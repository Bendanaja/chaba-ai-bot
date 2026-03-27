# Market API

The Market API is the unified interface for creating generation tasks across many AI models (image, video, audio). All models use the same `createTask` endpoint and `recordInfo` polling endpoint.

## Endpoints

### Create Task

**POST** `https://api.kie.ai/api/v1/jobs/createTask`

Creates a new generation task for any Market model.

#### Request Body

```json
{
  "model": "string (required - model identifier)",
  "callBackUrl": "string (optional - webhook URL)",
  "input": {
    // Model-specific parameters
  }
}
```

#### Common Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Yes | Model identifier (e.g., `kling-2.6/text-to-video`, `bytedance/seedream`) |
| `callBackUrl` | string (URI) | No | Webhook URL to receive completion notifications |
| `input` | object | Yes | Model-specific generation parameters |

#### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_bytedance_1765177777132"
  }
}
```

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 401 | Missing/invalid credentials |
| 402 | Insufficient credits |
| 404 | Resource not found |
| 422 | Validation error |
| 429 | Rate limited |
| 455 | Maintenance |
| 500 | Server error |
| 501 | Generation failed |
| 505 | Feature disabled |

---

### Get Task Details (Record Info)

**GET** `https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}`

Query task status and retrieve results.

#### Parameters

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `taskId` | Query | string | Yes | Task ID from createTask response |

#### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_12345678",
    "model": "grok-imagine/text-to-image",
    "state": "success",
    "param": "{JSON string of original request parameters}",
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-content.jpg\"]}",
    "failCode": "",
    "failMsg": "",
    "costTime": 15000,
    "completeTime": 1698765432000,
    "createTime": 1698765400000,
    "updateTime": 1698765432000,
    "progress": 45
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | Unique task identifier |
| `model` | string | Model used (e.g., `grok-imagine/text-to-image`) |
| `state` | enum | Task status: `waiting`, `queuing`, `generating`, `success`, `fail` |
| `param` | string | Original request parameters as JSON string |
| `resultJson` | string | Generated content URLs as JSON string (on success) |
| `failCode` | string | Error code (empty if successful) |
| `failMsg` | string | Error message (empty if successful) |
| `costTime` | integer | Processing time in milliseconds |
| `completeTime` | integer | Unix timestamp (ms) of completion |
| `createTime` | integer | Unix timestamp (ms) of creation |
| `updateTime` | integer | Unix timestamp (ms) of last update |
| `progress` | integer | Generation progress 0-100 (sora2/sora2 pro only) |

#### Task States

| State | Description |
|-------|-------------|
| `waiting` | Task queued, not yet started |
| `queuing` | In queue, waiting for resources |
| `generating` | Actively generating |
| `success` | Completed successfully |
| `fail` | Generation failed |

#### Rate Limit
Maximum query rate: **3 times per second per task**

---

## Callback Format

When `callBackUrl` is provided, the system POSTs results on completion:

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_12345678",
    "resultJson": "{\"resultUrls\":[\"https://example.com/image.jpg\"]}"
  }
}
```

---

## Available Models

### Image Models

| Model ID | Description |
|----------|-------------|
| `bytedance/seedream` | Seedream 3.0 Text-to-Image |
| `seedream-4.0/text-to-image` | Seedream 4.0 Text-to-Image |
| `seedream-4.0/edit` | Seedream 4.0 Image Edit |
| `seedream-4.5/text-to-image` | Seedream 4.5 Text-to-Image |
| `seedream-4.5/edit` | Seedream 4.5 Image Edit |
| `seedream-5-lite/text-to-image` | Seedream 5 Lite Text-to-Image |
| `seedream-5-lite/image-to-image` | Seedream 5 Lite Image-to-Image |
| `z-image/z-image` | Z-Image Generation |
| `google/nanobanana2` | Google NanoBanana 2 |
| `google/imagen4-fast` | Google Imagen 4 Fast |
| `google/imagen4-ultra` | Google Imagen 4 Ultra |
| `google/imagen4` | Google Imagen 4 |
| `google/nano-banana-edit` | Google NanoBanana Edit |
| `google/nano-banana` | Google NanoBanana |
| `flux2/pro-image-to-image` | Flux 2 Pro Image-to-Image |
| `flux2/pro-text-to-image` | Flux 2 Pro Text-to-Image |
| `flux2/flex-image-to-image` | Flux 2 Flex Image-to-Image |
| `flux2/flex-text-to-image` | Flux 2 Flex Text-to-Image |
| `grok-imagine/text-to-image` | Grok Imagine Text-to-Image |
| `grok-imagine/image-to-image` | Grok Imagine Image-to-Image |
| `gpt-image/1.5-text-to-image` | GPT Image 1.5 Text-to-Image |
| `gpt-image/1.5-image-to-image` | GPT Image 1.5 Image-to-Image |
| `topaz/image-upscale` | Topaz Image Upscale |
| `recraft/remove-background` | Recraft Background Removal |
| `recraft/crisp-upscale` | Recraft Crisp Upscale |
| `ideogram/v3-text-to-image` | Ideogram V3 Text-to-Image |
| `ideogram/v3-edit` | Ideogram V3 Edit |
| `ideogram/v3-reframe` | Ideogram V3 Reframe |
| `ideogram/v3-remix` | Ideogram V3 Remix |
| `ideogram/character` | Ideogram Character |
| `ideogram/character-edit` | Ideogram Character Edit |
| `ideogram/character-remix` | Ideogram Character Remix |
| `qwen/text-to-image` | Qwen Text-to-Image |
| `qwen/image-to-image` | Qwen Image-to-Image |
| `qwen/image-edit` | Qwen Image Edit |
| `qwen2/image-edit` | Qwen 2 Image Edit |

### Video Models

| Model ID | Description |
|----------|-------------|
| `kling-2.6/text-to-video` | Kling 2.6 Text-to-Video |
| `kling-2.6/image-to-video` | Kling 2.6 Image-to-Video |
| `kling/v25-turbo-image-to-video-pro` | Kling V2.5 Turbo I2V Pro |
| `kling/v25-turbo-text-to-video-pro` | Kling V2.5 Turbo T2V Pro |
| `kling/ai-avatar-standard` | Kling AI Avatar Standard |
| `kling/ai-avatar-pro` | Kling AI Avatar Pro |
| `kling/v2-1-master-image-to-video` | Kling V2.1 Master I2V |
| `kling/v2-1-master-text-to-video` | Kling V2.1 Master T2V |
| `kling/v2-1-pro` | Kling V2.1 Pro |
| `kling/v2-1-standard` | Kling V2.1 Standard |
| `kling/motion-control` | Kling Motion Control |
| `kling/motion-control-v3` | Kling Motion Control V3 |
| `kling/kling-3-0` | Kling 3.0 |
| `bytedance/seedance-1-5-pro` | Seedance 1.5 Pro |
| `bytedance/v1-pro-fast-image-to-video` | ByteDance V1 Pro Fast I2V |
| `bytedance/v1-pro-image-to-video` | ByteDance V1 Pro I2V |
| `bytedance/v1-pro-text-to-video` | ByteDance V1 Pro T2V |
| `bytedance/v1-lite-image-to-video` | ByteDance V1 Lite I2V |
| `bytedance/v1-lite-text-to-video` | ByteDance V1 Lite T2V |
| `hailuo/2-3-image-to-video-pro` | Hailuo 2.3 I2V Pro |
| `hailuo/2-3-image-to-video-standard` | Hailuo 2.3 I2V Standard |
| `hailuo/02-text-to-video-pro` | Hailuo 02 T2V Pro |
| `hailuo/02-image-to-video-pro` | Hailuo 02 I2V Pro |
| `hailuo/02-text-to-video-standard` | Hailuo 02 T2V Standard |
| `hailuo/02-image-to-video-standard` | Hailuo 02 I2V Standard |
| `sora2/sora-2-image-to-video` | Sora 2 I2V |
| `sora2/sora-2-text-to-video` | Sora 2 T2V |
| `sora2/sora-2-pro-image-to-video` | Sora 2 Pro I2V |
| `sora2/sora-2-pro-text-to-video` | Sora 2 Pro T2V |
| `sora2/sora-watermark-remover` | Sora Watermark Remover |
| `sora2/sora-2-characters` | Sora 2 Characters |
| `sora2/sora-2-characters-pro` | Sora 2 Characters Pro |
| `sora-2-pro-storyboard` | Sora 2 Pro Storyboard |
| `wan/2-6-image-to-video` | Wan 2.6 I2V |
| `wan/2-6-text-to-video` | Wan 2.6 T2V |
| `wan/2-6-video-to-video` | Wan 2.6 V2V |
| `wan/2-2-a14b-image-to-video-turbo` | Wan 2.2 A14B I2V Turbo |
| `wan/2-2-a14b-text-to-video-turbo` | Wan 2.2 A14B T2V Turbo |
| `wan/2-2-a14b-speech-to-video-turbo` | Wan 2.2 A14B Speech2V Turbo |
| `wan/2-2-animate-move` | Wan 2.2 Animate Move |
| `wan/2-2-animate-replace` | Wan 2.2 Animate Replace |
| `wan/2-6-flash-image-to-video` | Wan 2.6 Flash I2V |
| `wan/2-6-flash-video-to-video` | Wan 2.6 Flash V2V |
| `wan/2-5-image-to-video` | Wan 2.5 I2V |
| `wan/2-5-text-to-video` | Wan 2.5 T2V |
| `topaz/video-upscale` | Topaz Video Upscale |
| `grok-imagine/text-to-video` | Grok Imagine T2V |
| `grok-imagine/image-to-video` | Grok Imagine I2V |
| `grok-imagine/upscale` | Grok Imagine Upscale |
| `grok-imagine/extend` | Grok Imagine Extend |

### Audio Models

| Model ID | Description |
|----------|-------------|
| `infinitalk/from-audio` | Infinitalk From Audio |
| `elevenlabs/audio-isolation` | ElevenLabs Audio Isolation |
| `elevenlabs/sound-effect-v2` | ElevenLabs Sound Effect V2 |
| `elevenlabs/speech-to-text` | ElevenLabs Speech-to-Text |
| `elevenlabs/text-to-dialogue-v3` | ElevenLabs T2D V3 |
| `elevenlabs/text-to-speech-multilingual-v2` | ElevenLabs TTS Multilingual V2 |
| `elevenlabs/text-to-speech-turbo-2-5` | ElevenLabs TTS Turbo 2.5 |

### Chat/LLM Models

| Model ID | Description |
|----------|-------------|
| `chat/gpt-5-2` | GPT 5.2 |
| `chat/gpt-5-4` | GPT 5.4 |
| `claude/claude-haiku-4-5` | Claude Haiku 4.5 |
| `claude/claude-opus-4-5` | Claude Opus 4.5 |
| `claude/claude-opus-4-6` | Claude Opus 4.6 |
| `claude/claude-sonnet-4-5` | Claude Sonnet 4.5 |
| `claude/claude-sonnet-4-6` | Claude Sonnet 4.6 |
| `gemini/gemini-2-5-pro` | Gemini 2.5 Pro |
| `gemini/gemini-3-pro` | Gemini 3 Pro |
| `gemini/gemini-3-1-pro` | Gemini 3.1 Pro |
| `gemini/gemini-2-5-flash` | Gemini 2.5 Flash |
| `gemini/gemini-3-flash` | Gemini 3 Flash |
| `gemini/gemini-3-flash-v1beta` | Gemini 3 Flash V1Beta |
| `codex/gpt-codex` | GPT Codex |

---

## Model-Specific Input Examples

### Image Generation (e.g., Seedream)

```json
{
  "model": "bytedance/seedream",
  "callBackUrl": "https://example.com/callback",
  "input": {
    "prompt": "A beautiful sunset over mountains",
    "image_size": "square_hd",
    "guidance_scale": 2.5,
    "seed": 12345
  }
}
```

Image size options: `square`, `square_hd`, `portrait_4_3`, `portrait_16_9`, `landscape_4_3`, `landscape_16_9`

### Video Generation (e.g., Kling)

```json
{
  "model": "kling-2.6/text-to-video",
  "callBackUrl": "https://example.com/callback",
  "input": {
    "prompt": "A cat playing piano",
    "sound": true,
    "aspect_ratio": "16:9",
    "duration": "5"
  }
}
```

Duration options: `5` or `10` seconds
Aspect ratio options: `1:1`, `16:9`, `9:16`

---

## Best Practices

- Implement callbacks to avoid polling overhead
- If polling, use exponential backoff (start at 2-3 seconds, increase gradually)
- Stop polling after 10-15 minutes
- Download results within 24 hours (URLs expire)
- Generated files are retained for 14 days
