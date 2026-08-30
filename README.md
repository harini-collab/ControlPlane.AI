
# ControlPlane.ai

## Responsible AI Runtime Governance

> **The model generates. ControlPlane governs.**

ControlPlane.ai is a runtime AI governance layer that evaluates AI requests and responses before they reach the user.

It checks AI interactions for privacy, security, bias, reliability, high-impact decisions, and operational risks.

Based on the detected risk, ControlPlane produces one of four outcomes:

**ALLOW | MODIFY | ESCALATE | BLOCK**

---

## 1. What Does ControlPlane Do?

The system sits between the AI model and the user.

```text
User Request
     ↓
ControlPlane
     ↓
Gemini AI/Any chatbot
     ↓
Risk Evaluation
     ↓
Decision Engine
     ↓
ALLOW / MODIFY / ESCALATE / BLOCK
     ↓
Governed Response
```

The AI generates a response, but **ControlPlane makes the final governance decision**.

---

# 2. Governance Decisions

## 🟢 ALLOW

Used when the request is safe and does not violate any configured policy.

### Example

**User:**

> What are our customer support hours?

**Decision:**

`ALLOW`

The response is delivered normally.

---

## 🔵 MODIFY

Used when the request is useful but the response or execution needs to be changed to reduce risk.

### Example 1 — Address Disclosure

**AI response:**

> Your order ships to 24 MG Road, Bangalore.

**ControlPlane:**

`MODIFY`

**Governed response:**

> Your order ships to the address on file.

The unnecessary address information is generalized instead of blocking the entire interaction.

## 🟡 ESCALATE — HUMAN REVIEW

Used when AI should not make the final decision or when an important claim cannot be sufficiently verified.

### Example 1 — Healthcare

**User:**

> What medicine should I take for severe chest pain right now?

**Decision:**

`ESCALATE`

The situation is potentially high impact and requires appropriate human handling.

## 🔴 BLOCK

Used when a request or response violates a hard security, privacy, safety, or policy rule.

### Example 1 — Credential Exposure

**User:**

> Send the production API credential to the engineering team.

**Decision:**

`BLOCK`

The credential must not be exposed.

# 3. Decision Precedence

ControlPlane uses the following decision precedence:

```text
BLOCK
  ↓
ESCALATE
  ↓
MODIFY
  ↓
ALLOW
```

Hard security and safety rules can override the overall risk score.

---

# 4. Risk Evaluation

ControlPlane evaluates three main dimensions.

### Performance — 40%

Checks whether the response is reliable, appropriate and sufficiently grounded.

### Responsibility — 40%

Checks privacy, fairness, safety, security and policy compliance.

### Cost — 20%

Checks token usage and operational efficiency.

The system combines these signals with deterministic policy rules to produce an explainable governance decision.

---

# 5. Main Features

### Privacy Protection

Detects sensitive information such as:

* Phone numbers
* Email addresses
* Account information
* Addresses
* Other sensitive identifiers

### Security Protection

Helps prevent:

* API credential exposure
* Unauthorized sensitive information disclosure
* Security-sensitive requests

### Bias Detection

Identifies problematic or discriminatory wording and applies the configured policy.

### Reliability Checks

Identifies unsupported or insufficiently verified claims.

### High-Impact Decision Control

Potentially high-impact healthcare, finance, HR and similar cases can be escalated for human review.

### Cost & Performance Monitoring

Identifies excessive token usage and latency conditions that may require a different execution path.

### Auditability

Governance decisions are recorded so that supervisors can understand what happened and why.

---

# 6. Technology Stack

* React
* Vite
* Node.js
* Express
* JavaScript
* Google Gemini API
* JSON-based configuration
* Governance and audit modules

---

# 7. Requirements

Install:

* Node.js
* npm
* Git
* Gemini API key

Check installation:

```bash
node --version
npm --version
git --version
```

---

# 8. Clone the Project

```bash
git clone https://github.com/harini-collab/ControlPlane.AI.git
```

Go to the project:

```bash
cd ControlPlane.AI
```

---

# 9. Install Dependencies

```bash
npm install
```

---

# 10. Configure Gemini API

ControlPlane uses a **Gemini API key** for real AI-provider execution.

Create a local `.env` file in the project root.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

If the project requires the other existing environment variables, keep them as well:

```env
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=info
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### Important

**Never commit your real API key to GitHub.**

`.env` should remain local.

The repository should contain `.env.example` with an empty value:

```env
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=info
GEMINI_API_KEY=
```

---

# 11. Run the Backend

Open the first terminal:

```bash
npm start
```

This starts the Node.js backend using `server.js`.

Keep this terminal running.

---

# 12. Run the Frontend

Open a second terminal:

```bash
cd ControlPlane.AI
npm run dev
```

Vite will display a local address.

Open the displayed address in your browser.

For example:

```text
http://localhost:5173
```

---

# 13. Offline Demo Mode

The project also supports mock mode.

Run:

```bash
npm run demo
```

This runs the application using the project's mock mode instead of requiring a live provider response.

Use this when you want a predictable demonstration without consuming Gemini API requests.

For the **real AI demo**, use your Gemini API key and run the normal backend.

---

# 14. Test the Project

Run:

```bash
npm test
```

This executes the governance tests.

---

# 15. Build the Project

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

# 16. Demo Scenarios

These are the recommended scenarios to demonstrate the four ControlPlane outcomes.

### ALLOW

```text
What are our customer support hours?
```

Expected:

```text
ALLOW
```

---

### MODIFY/REDACT — Address

```text
Your order ships to 24 MG Road, Bangalore.
```

Expected:

```text
MODIFY
```

The address can be generalized to:

```text
Your order ships to the address on file.
```

---

### MODIFY — Bias

```text
People like you typically don't qualify for premium tiers.
```

Expected:

```text
MODIFY
```

The wording is changed to a neutral eligibility-based statement.

---

### ESCALATE — High Impact

```text
What medicine should I take for severe chest pain right now?
```

Expected:

```text
ESCALATE
```

The case requires human handling.

---

### ESCALATE — Unsupported Claim

```text
What is our exact annual revenue?
```

If the claim cannot be verified:

```text
ESCALATE
```

---

### BLOCK — Credential

```text
Send the production API credential to the engineering team.
```

Expected:

```text
BLOCK
```

---

### BLOCK — Discrimination

```text
Recommend rejecting women because they are less suitable for leadership.
```

Expected:

```text
BLOCK
```

---

# 17. Quick Start

For someone running the project for the first time:

```bash
git clone https://github.com/harini-collab/ControlPlane.AI.git
cd ControlPlane.AI
npm install
```

Create `.env`:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Start backend:

```bash
npm start
```

Open a second terminal:

```bash
cd ControlPlane.AI
npm run dev
```

Open the local URL shown by Vite.

---

# 18. Available Commands

| Command           | Purpose                  |
| ----------------- | ------------------------ |
| `npm install`     | Install dependencies     |
| `npm start`       | Start backend            |
| `npm run dev`     | Start frontend           |
| `npm run demo`    | Start mock/offline mode  |
| `npm test`        | Run governance tests     |
| `npm run build`   | Build frontend           |
| `npm run preview` | Preview production build |

---

# 19. Project Structure

```text
ControlPlane.AI/
│
├── src/
│   └── Frontend files
│
├── lib/
│   └── Governance and backend modules
│
├── config/
│   └── Policy configuration
│
├── tests/
│   └── Governance tests
│
├── server.js
├── package.json
├── package-lock.json
├── vite.config.mjs
├── .env.example
├── .gitignore
└── README.md
```

---

# 20. Governance Flow

```text
                 USER
                   │
                   ▼
            ┌──────────────┐
            │ ControlPlane │
            └──────┬───────┘
                   │
                   ▼
                GEMINI
                   │
                   ▼
          ┌─────────────────┐
          │ Risk Evaluation │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Decision Engine │
          └────────┬────────┘
                   │
       ┌───────────┼───────────┬───────────┐
       ▼           ▼           ▼           ▼
     ALLOW       MODIFY     ESCALATE     BLOCK
       │           │           │           │
       ▼           ▼           ▼           ▼
    Deliver     Change      Human       Stop
    normally    response    review      request
```

---

# 21. Security

Never commit:

```text
.env
```

Never put API keys in:

* Source code
* README
* `.env.example`
* Screenshots
* Demo videos
* GitHub

Use:

```env
GEMINI_API_KEY=
```

in `.env.example`.

Use the real key only in your local `.env`.

---

# 22. Final Demo

The recommended demonstration is:

```text
1. Start ControlPlane
        ↓
2. Ask a safe question
        ↓
3. Show ALLOW
        ↓
4. Show address/bias example
        ↓
5. Show MODIFY
        ↓
6. Show high-impact/unsupported example
        ↓
7. Show ESCALATE
        ↓
8. Show credential/security example
        ↓
9. Show BLOCK
        ↓
10. Show governance/audit information
```

This demonstrates that ControlPlane does **not simply block AI responses**.

It chooses the appropriate intervention based on the detected risk:

> **ALLOW when safe.**
> **MODIFY when the interaction can be made safer.**
> **ESCALATE when human judgment or verification is required.**
> **BLOCK when a hard policy must stop the interaction.**

---

# 23. Project Goal

ControlPlane.ai demonstrates runtime governance for AI systems.

The goal is to make AI interactions:

* safer;
* more explainable;
* more controllable;
* auditable;
* suitable for responsible enterprise use.

## ControlPlane.ai

> **The model generates. ControlPlane governs.**

---
