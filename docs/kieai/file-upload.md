# Kie.ai File Upload API

## Base URL
`https://kieai.redpandaai.co`

**NOTE**: Different from main API base URL!

## Base64 Upload
**POST** `https://kieai.redpandaai.co/api/file-base64-upload`
```json
{
  "base64Data": "data:image/jpeg;base64,...",
  "uploadPath": "chaba-uploads",
  "fileName": "image.jpg"
}
```

## URL Upload
**POST** `https://kieai.redpandaai.co/api/file-url-upload`
```json
{
  "fileUrl": "https://...",
  "uploadPath": "chaba-uploads"
}
```

## Response
```json
{
  "success": true,
  "code": 200,
  "data": {
    "fileId": "...",
    "fileName": "...",
    "fileSize": 12345,
    "mimeType": "image/jpeg",
    "fileUrl": "https://...",
    "downloadUrl": "https://...",
    "expiresAt": "2026-03-30T..."
  }
}
```

**Files expire after 3 days!**
Download URLs expire after 20 minutes.
