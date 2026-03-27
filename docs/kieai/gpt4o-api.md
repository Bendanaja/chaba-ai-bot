# GPT-4o Image API

Dedicated API for GPT-4o image generation and editing. Separate from the Market API with its own endpoints.

## Endpoints

### Generate Image

**POST** `https://api.kie.ai/api/v1/gpt4o-image/generate`

Creates a new image generation task. Generated images persist for 14 days.

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Conditional | Text description for image generation. At least one of `prompt` or `filesUrl` required. |
| `filesUrl` | array[string] | Conditional | Up to 5 publicly accessible image URLs for reference/editing. Supported: .jfif, .pjpeg, .jpeg, .pjp, .jpg, .png, .webp |
| `size` | string | **Yes** | Aspect ratio: `1:1`, `3:2`, or `2:3` |
| `maskUrl` | string | No | Mask image URL (max 25 MB). White = preserve, black = modify |
| `nVariants` | integer | No | Number of variants: `1`, `2`, or `4` |
| `isEnhance` | boolean | No | Enable prompt enhancement (default: `false`) |
| `enableFallback` | boolean | No | Enable fallback to backup models (default: `false`) |
| `fallbackModel` | string | No | Fallback model: `GPT_IMAGE_1` or `FLUX_MAX` (default: `FLUX_MAX`) |
| `uploadCn` | boolean | No | Route uploads via China servers (default: `false`) |
| `callBackUrl` | string | No | Webhook URL for task completion notifications |
| `fileUrl` | string | No | **Deprecated** - use `filesUrl` instead |

#### Use Cases by Request Type

- **Text-to-Image**: `prompt` + `size` + `nVariants` + `isEnhance`
- **Image Editing**: `filesUrl` + `maskUrl` + `prompt` + `size`
- **Image Variants**: `filesUrl` + `prompt` + `size` + `nVariants`

#### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_4o_abc123"
  }
}
```

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Format Error - Invalid JSON |
| 401 | Unauthorized - Missing/invalid credentials |
| 402 | Insufficient Credits |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 455 | Service Unavailable - Maintenance |
| 500 | Server Error |
| 550 | Connection Denied - Queue full |

---

### Get Image Details (Record Info)

**GET** `https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId={taskId}`

#### Parameters

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `taskId` | Query | string | Yes | Task ID from generate response |

#### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_4o_abc123",
    "paramJson": "{\"prompt\":\"A beautiful sunset\",\"size\":\"1:1\",\"isEnhance\":false}",
    "completeTime": 1672574400000,
    "createTime": 1672561200000,
    "progress": "1.00",
    "status": "SUCCESS",
    "successFlag": 1,
    "errorCode": null,
    "errorMessage": "",
    "response": {
      "resultUrls": ["https://example.com/result/image1.png"]
    }
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | Task identifier |
| `paramJson` | string | Original request parameters as JSON string |
| `completeTime` | integer | Unix timestamp (ms) of completion (null if incomplete) |
| `createTime` | integer | Unix timestamp (ms) of creation |
| `progress` | string | Progress as decimal string `0.00` - `1.00` |
| `status` | string | Status enum (see below) |
| `successFlag` | integer | 0=Generating, 1=Success, 2=Failed |
| `errorCode` | integer/null | Error code when failed |
| `errorMessage` | string | Error details when failed |
| `response` | object | Contains `resultUrls` array on success |

#### Status Values

| Status | Description |
|--------|-------------|
| `GENERATING` | Generation in progress |
| `SUCCESS` | Generation successful |
| `CREATE_TASK_FAILED` | Failed to create task |
| `GENERATE_FAILED` | Generation failed |

#### Rate Limit
Maximum query rate: **3 times per second per task**

---

### Get Download URL

**POST** `https://api.kie.ai/api/v1/gpt4o-image/download-url`

Converts image URLs to direct download URLs. Generated URLs valid for **20 minutes**.

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Task ID from image generation |
| `url` | string (URI) | Yes | Original image URL to convert |

#### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": "https://[storage].r2.cloudflarestorage.com/v/[id].png?[signed-params]"
}
```

Note: `data` is a string (the download URL), not an object.

#### Error Codes

| Code | Meaning |
|------|---------|
| 401 | Missing/invalid credentials |
| 404 | Resource not found |
| 422 | Validation failures (null record, >14 days old, blank/missing data) |
| 451 | Image fetch failed |
| 455 | System maintenance |
| 500 | Server error |

---

## Callback Format

When `callBackUrl` is provided, the system POSTs to your endpoint on completion:

### Success Callback

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task12345",
    "info": {
      "result_urls": ["https://example.com/result/image1.png"]
    }
  }
}
```

### Failure Callback

```json
{
  "code": 400,
  "msg": "Your content was flagged by OpenAI as violating content policies",
  "data": {
    "taskId": "task12345",
    "info": null
  }
}
```

### Callback Status Codes

| Code | Meaning |
|------|---------|
| 200 | Successful completion |
| 400 | Policy violation, size limits exceeded, or file processing errors |
| 451 | Download failure from provided URL |
| 500 | Server error (retry recommended) |

### Callback Requirements

- Use HTTPS for callback URLs
- Respond within **15 seconds** with HTTP 200
- Implement idempotent processing (duplicate callbacks possible)
- Process complex logic asynchronously
- Verify webhook authenticity via signature verification
- Download images promptly (URLs may have time limits)

---

## Key Constraints

- **Image Storage**: 14 days before automatic deletion
- **Download URL Validity**: 20 minutes
- **Max Input Images**: 5 URLs per request
- **Supported Variants**: 1, 2, or 4 images
- **Aspect Ratios**: `1:1` (square), `3:2` (landscape), `2:3` (portrait)
- **Polling Alternative**: Query record-info every 30 seconds if not using callbacks
