// server.js
// ControlPlane Governance Proxy
//
// Point any app that normally talks to an LLM at this server instead.
// Every prompt/response passes through the governance pipeline:
//   1. Deterministic checks (PII, cost/tokens)      — fast, no LLM
//   2. Semantic checks (bias, hallucination, safety) — heuristic + optional LLM
//   3. Risk scoring (responsibility + performance + cost)
//   4. Policy evaluation (per-app profile)
//   5. Decision: ALLOW / REDACT / ESCALATE / BLOCK
//   6. Audit log entry written for every request
//
// Run:
//   MOCK_MODE=true node server.js        (no API key needed, uses fake LLM responses)
//   LLM_API_KEY=sk-... node server.js    (real provider, real governance)

const http = require('http');
const fs = require('fs');
const path = require('path');

const { detectPII } = require('./lib/piiDetector');
const semanticAnalyzer = require('./lib/semanticAnalyzer');
const riskEngine = require('./lib/riskEngine');
const auditLog = require('./lib/auditLog');
const { callProvider } = require('./lib/provider');
const { verify } = require('./lib/knowledgeVerifier');
const sessionRiskStore = require('./lib/sessionRisk');
const { loadEnv } = require('./lib/env');
const policyStore = require('./lib/policyStore');
const { decide } = require('./lib/decisionEngine');
const { scenarios, runAll } = require('./lib/scenarios');

loadEnv();

const PORT = process.env.PORT || 8787;
const DIST_DIR = path.join(__dirname, 'dist');

function getPolicy(appProfile) {
  return policyStore.get(appProfile);
}

function sendJSON(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

function serveDashboard(res, pathname) {
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const candidate = path.resolve(DIST_DIR, requested);
  if (!candidate.startsWith(DIST_DIR) || !fs.existsSync(candidate) || fs.statSync(candidate).isDirectory()) {
    const index = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(index)) return false;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(index).pipe(res);
    return true;
  }
  const types = { '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };
  res.writeHead(200, { 'Content-Type': `${types[path.extname(candidate)] || 'application/octet-stream'}; charset=utf-8` });
  fs.createReadStream(candidate).pipe(res);
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Core governance pipeline — runs on the model's response before it goes
// back to the caller.
// ---------------------------------------------------------------------------
async function runGovernance({ responseText, usage, appProfile, promptText, sessionId, region, inputPii, startedAt }) {
  const policy = getPolicy(appProfile);

  const pii = detectPII(responseText);
  const semantic = await semanticAnalyzer.analyze(responseText);
  const promptRisk = semanticAnalyzer.assessPromptRisk(promptText);
  const verification = verify(responseText);
  // First pass estimates turn risk, then session state contributes to the
  // final decision. This avoids treating a conversation as isolated turns.
  const preliminary = riskEngine.evaluate({ pii, semantic, usage, responseText, policy, verification, promptRisk });
  const sessionRisk = sessionRiskStore.record(sessionId, preliminary.overallScore, preliminary.decision);

  const risk = riskEngine.evaluate({
    pii,
    semantic,
    usage,
    responseText,
    policy,
    verification,
    sessionRisk,
    promptRisk,
  });

  let finalText = responseText;
  if (risk.decision === 'REDACT') {
    finalText = pii.redacted;
  } else if (risk.decision === 'MODIFY') {
    finalText = responseText.replace(/\b(always|never|guaranteed|100%)\b/gi, 'may');
  } else if (risk.decision === 'BLOCK') {
    finalText =
      '[This response was blocked by ControlPlane governance policy. See audit log for details.]';
  }

  const entry = {
    appProfile: policy.name,
    prompt: promptText,
    originalResponse: responseText,
    finalResponse: finalText,
    decision: risk.decision,
    action: risk.action,
    overallScore: risk.overallScore,
    breakdown: risk.breakdown,
    reasons: risk.reasons,
    piiDetected: pii.found,
    piiTypes: pii.types,
    inputPiiDetected: inputPii.found,
    inputPiiTypes: inputPii.types,
    biasDetected: semantic.biasDetected,
    tokenUsage: risk.tokenUsage,
    verification,
    session: sessionRisk,
    region: region || 'global',
    latencyMs: Date.now() - startedAt,
    estimatedCostUsd: Number((((usage.input_tokens || 0) * 0.00000015) + ((usage.output_tokens || 0) * 0.0000006)).toFixed(6)),
  };

  const recorded = auditLog.record(entry);

  return { finalText, governance: recorded };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    // CORS for browser-based testing/dashboards
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-app-profile,x-session-id,x-region');
    if (req.method === 'OPTIONS') return res.writeHead(204).end();

    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) url.pathname = url.pathname.slice(4);

    // Health check
    if (url.pathname === '/health') {
      const configuredModel = process.env.LLM_MODEL || 'provider default';
      return sendJSON(res, 200, { status: 'ok', mockMode: process.env.MOCK_MODE === 'true', provider: process.env.LLM_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'mock'), model: configuredModel === 'gemini-2.5-flash' ? 'gemini-3.6-flash' : configuredModel, checks: ['input PII', 'output PII', 'bias/safety', 'evidence verification', 'multi-turn risk', 'cost'] });
    }

    if (url.pathname === '/evaluate' && req.method === 'POST') {
      const body = await readBody(req);
      const evaluation = decide(body);
      const audit = auditLog.record({ appProfile: body.application || 'default', prompt: body.query || '', originalResponse: evaluation.originalResponse, finalResponse: evaluation.block?.safeMessage || evaluation.modifiedResponse || evaluation.originalResponse, decision: evaluation.verdict.toUpperCase() === 'REVIEW' ? 'ESCALATE' : evaluation.verdict.toUpperCase(), overallScore: evaluation.risk.weighted / 100, breakdown: evaluation.risk, reasons: [evaluation.explanation], signals: evaluation.signals, evidence: evaluation.evidence, confidence: evaluation.confidence, tokenUsage: evaluation.audit.tokenUsage, latencyMs: evaluation.audit.latencyMs });
      return sendJSON(res, 200, { ...evaluation, auditId: audit.id });
    }
    if (url.pathname === '/scenarios' && req.method === 'GET') return sendJSON(res, 200, { scenarios });
    if (url.pathname === '/scenarios/run' && req.method === 'POST') { const results = runAll(); return sendJSON(res, 200, { total: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results }); }

    // Main governed completion endpoint (OpenAI-style shape, works with any
    // client that lets you set a custom base_url).
    if (url.pathname === '/v1/chat/completions' && req.method === 'POST') {
      const body = await readBody(req);
      const appProfile = req.headers['x-app-profile'] || 'default';
      const sessionId = req.headers['x-session-id'] || body.user || null;
      const region = req.headers['x-region'] || 'global';
      const messages = body.messages || [];
      const promptText = messages[messages.length - 1]?.content || '';
      const inputPii = detectPII(promptText);
      const startedAt = Date.now();

      const providerResult = await callProvider({ messages, model: body.model });

      const { finalText, governance } = await runGovernance({
        responseText: providerResult.text,
        usage: providerResult.usage,
        appProfile,
        promptText,
        sessionId,
        region,
        inputPii,
        startedAt,
      });

      return sendJSON(res, 200, {
        id: 'cp-' + Date.now(),
        object: 'chat.completion',
        // The OpenAI SDK's response model requires these two fields —
        // without them, client.chat.completions.create() raises a
        // pydantic validation error even though the JSON is otherwise valid.
        created: Math.floor(Date.now() / 1000),
        model: body.model || 'controlplane-governed',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: finalText },
            finish_reason: governance.decision === 'BLOCK' ? 'content_filter' : 'stop',
          },
        ],
        usage: {
          prompt_tokens: providerResult.usage.input_tokens,
          completion_tokens: providerResult.usage.output_tokens,
          total_tokens: providerResult.usage.input_tokens + providerResult.usage.output_tokens,
        },
        controlplane: governance, // <-- governance metadata, always included
      });
    }

    // Audit trail
    if (url.pathname === '/audit' && req.method === 'GET') {
      const limit = Number(url.searchParams.get('limit') || 50);
      return sendJSON(res, 200, { entries: auditLog.readAll({ limit }) });
    }

    // Human review queue (escalated decisions)
    if (url.pathname === '/review-queue' && req.method === 'GET') {
      return sendJSON(res, 200, { entries: auditLog.readPendingReview() });
    }

    if (url.pathname === '/feedback' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.runId || !['confirm', 'override', 'false_positive', 'false_negative'].includes(body.verdict)) {
        return sendJSON(res, 400, { error: 'runId and a valid verdict are required' });
      }
      return sendJSON(res, 201, { feedback: auditLog.recordFeedback({ runId: body.runId, reviewer: body.reviewer || 'anonymous', verdict: body.verdict, note: body.note || '' }) });
    }

    if (url.pathname === '/metrics' && req.method === 'GET') {
      return sendJSON(res, 200, auditLog.metrics());
    }

    // List available policy profiles
    if (url.pathname === '/policies' && req.method === 'GET') {
      return sendJSON(res, 200, policyStore.all());
    }
    if (url.pathname === '/policies' && req.method === 'POST') {
      const body = await readBody(req);
      if (!/^[a-z0-9_-]+$/i.test(body.key || '')) return sendJSON(res, 400, { error: 'Policy key may use only letters, numbers, _ and -' });
      return sendJSON(res, 201, { key: body.key, policy: policyStore.upsert(body.key, body.policy) });
    }
    const policyMatch = url.pathname.match(/^\/policies\/([a-zA-Z0-9_-]+)$/);
    if (policyMatch && req.method === 'PUT') {
      const body = await readBody(req);
      return sendJSON(res, 200, { key: policyMatch[1], policy: policyStore.upsert(policyMatch[1], body.policy) });
    }
    if (policyMatch && req.method === 'DELETE') {
      policyStore.remove(policyMatch[1]);
      return sendJSON(res, 200, { deleted: policyMatch[1] });
    }

    if (req.method === 'GET' && serveDashboard(res, url.pathname)) return;
    sendJSON(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(err);
    sendJSON(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`ControlPlane Governance Proxy running on http://localhost:${PORT}`);
  console.log(`Mock mode: ${process.env.MOCK_MODE === 'true' ? 'ON (no API key needed)' : 'OFF'}`);
  console.log(`\nPoint your app's base_url at http://localhost:${PORT}/v1/chat/completions`);
});
