# ControlPlane - AI Governance Framework

A comprehensive framework for managing AI model deployments with governance, policy enforcement, and compliance tracking.

## Project Structure

```
├── src/                      # Frontend React components
│   ├── App.jsx              # Main application component
│   ├── PolishedDashboard.jsx # Dashboard UI
│   └── main.jsx             # Entry point
├── lib/                      # Backend utilities and libraries
│   ├── modelManager.js      # Model lifecycle management
│   ├── policyEngine.js      # Policy evaluation engine
│   ├── auditLogger.js       # Audit trail tracking
│   └── apiClient.js         # API communication
├── config/                   # Configuration files
│   ├── policies.json        # Policy definitions
│   └── settings.json        # Application settings
├── tests/                    # Test files
│   └── governance.test.js   # Governance tests
├── server.js                # Node.js backend server
├── package.json             # Dependencies
└── .env                     # Environment configuration
```

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file with required variables:

```
API_PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Core Features

### Model Management
- Register and track AI models
- Version control and deployment tracking
- Model performance monitoring

### Policy Engine
- Define and enforce governance policies
- Real-time policy compliance checking
- Policy violation alerts

### Audit Logging
- Complete action audit trail
- Compliance documentation
- Activity monitoring and reporting

### API Client
- RESTful API endpoints
- Request/response handling
- Error management

## Configuration

### Policies

Configure governance policies in `config/policies.json`:

```json
{
  "policies": [
    {
      "id": "policy-001",
      "name": "Model Deployment Policy",
      "rules": [],
      "enabled": true
    }
  ]
}
```

### Environment Variables

Key environment variables:

- `API_PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

## Testing

Run tests with:

```bash
npm test
```

## API Endpoints

### Models
- `GET /api/models` - List all models
- `POST /api/models` - Create new model
- `GET /api/models/:id` - Get model details
- `PUT /api/models/:id` - Update model
- `DELETE /api/models/:id` - Delete model

### Policies
- `GET /api/policies` - List all policies
- `POST /api/policies` - Create new policy
- `GET /api/policies/:id` - Get policy details
- `PUT /api/policies/:id` - Update policy

### Audit Logs
- `GET /api/audit/logs` - Retrieve audit logs
- `GET /api/audit/logs/:id` - Get specific log

## Technology Stack

- **Frontend**: React
- **Backend**: Node.js/Express
- **Build Tool**: Vite
- **Testing**: Jest
- **Package Manager**: npm

## Development Guidelines

1. Follow existing code structure
2. Write tests for new features
3. Update documentation
4. Commit with clear messages

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue in the repository.
# ControlPlane
# ControlPlane
