# Kie.ai API Overview

## Base URL

```
https://api.kie.ai
```

File Upload Base URL:
```
https://api.kie.ai
```

## Authentication

All API requests require Bearer token authentication via the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

- Obtain API keys from: https://kie.ai/api-key
- **Never expose API keys** in client-side code or public repositories
- Missing/invalid keys return: `{"code": 401, "msg": "You do not have access permissions"}`

## Asynchronous Task Architecture

All generation tasks are **asynchronous**:

1. Submit a request -> receive a `taskId` (HTTP 200 means task created, NOT completed)
2. Get results via:
   - **Callbacks/Webhooks**: Provide a `callBackUrl` in your request; results are POSTed to it
   - **Polling**: Query the record-info/status endpoint with the `taskId`

## Rate Limits

- **20 new generation requests per 10 seconds** (per account)
- **100+ concurrent tasks** supported
- Exceeded limits return HTTP 429 (requests are rejected, not queued)
- Contact support for higher limits

## Data Retention

- **Generated media files**: 14 days, then automatically deleted
- **Uploaded files**: 3 days, then automatically deleted
- **Log records**: 2 months, then deleted
- Download and store results locally for long-term access

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request / Format Error / Content Policy Violation |
| 401 | Unauthorized - Missing or invalid API key |
| 402 | Insufficient Credits |
| 404 | Resource Not Found |
| 405 | Method Not Allowed / Rate Limit |
| 409 | Conflict (record already exists) |
| 422 | Validation Error - Parameters failed validation |
| 429 | Rate Limited - Request quota exceeded |
| 451 | Download/Fetch Failed or Access Denied |
| 455 | Service Unavailable - System maintenance |
| 500 | Server Error |
| 501 | Generation Failed |
| 505 | Feature Disabled |
| 550 | Connection Denied - Queue full |

## Common Response Format

### Success
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_abc123"
  }
}
```

### Error
```json
{
  "code": 500,
  "msg": "Server Error - An unexpected error occurred while processing the request",
  "data": null
}
```

## API Sections

| API | Base Path | Description |
|-----|-----------|-------------|
| Market API | `/api/v1/jobs/` | Unified API for image/video/audio generation across multiple models |
| GPT-4o Image API | `/api/v1/gpt4o-image/` | GPT-4o image generation and editing |
| Flux Kontext API | `/api/v1/flux/kontext/` | Flux Kontext image generation and editing |
| Runway API | `/api/v1/runway/` | Runway video generation |
| Veo3 API | `/api/v1/veo/` | Google Veo3 video generation |
| Suno API | `/api/v1/generate/`, `/api/v1/lyrics/`, etc. | Music generation, editing, and utilities |
| File Upload API | `/api/file-base64-upload`, `/api/file-stream-upload`, `/api/file-url-upload` | File upload utilities |
| Common API | `/api/v1/chat/credit`, `/api/v1/common/download-url` | Credits and download utilities |

## Pricing

- Pricing is typically **30-50% lower** than official APIs
- Discounts up to 80% on some models
- Image models: 10-50 credits per generation
- Video models: 100-500 credits per generation
- Language models: Per-token pricing
- See https://kie.ai/pricing for details

## Support

- **Discord & Telegram**: Primary support (UTC 21:00 - 17:00 next day)
- **Email**: support@kie.ai (slower)
- **Task Logs**: https://kie.ai/logs
- **Model Marketplace**: https://kie.ai/market
