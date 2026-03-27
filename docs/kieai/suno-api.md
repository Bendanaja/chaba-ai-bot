# Suno Music API

Comprehensive music generation API supporting creation, extension, covers, vocals, MIDI, WAV conversion, and more.

## Base URL
`https://api.kie.ai`

---

## Generate Music

**POST** `/api/v1/generate`

### Request Body

#### Required Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Music description or lyrics. Max: 500 chars (non-custom), 3000 (V4), 5000 (V4_5+/V5) |
| `customMode` | boolean | Yes | Simple (`false`) or Advanced (`true`) mode |
| `instrumental` | boolean | Yes | Instrumental only (`true`) or with lyrics (`false`) |
| `model` | string | Yes | `V4`, `V4_5`, `V4_5PLUS`, `V4_5ALL`, `V5` |
| `callBackUrl` | string (URI) | Yes | Webhook for completion notifications |

#### Conditional Parameters (when `customMode: true`)

| Parameter | Type | Required When | Description |
|-----------|------|---------------|-------------|
| `style` | string | Always in custom mode | Music genre/style. Max: 200 (V4), 1000 (others) |
| `title` | string | Always in custom mode | Track title. Max: 80 chars |
| `prompt` | string | `instrumental: false` | Exact lyrics to use |

#### Optional Parameters

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `negativeTags` | string | - | Styles/traits to exclude |
| `vocalGender` | string | `m`, `f` | Vocal preference (probability-based, not guaranteed) |
| `styleWeight` | number | 0-1 | Style adherence strength (2 decimal places) |
| `weirdnessConstraint` | number | 0-1 | Creative deviation control (2 decimal places) |
| `audioWeight` | number | 0-1 | Audio feature balance (2 decimal places) |
| `personaId` | string | - | Custom persona style (custom mode only) |

### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "5c79****be8e"
  }
}
```

### Model Capabilities

| Model | Max Duration | Special Features |
|-------|-------------|------------------|
| V4 | 4 min | Improved vocals |
| V4_5 | 8 min | Smart prompts, faster |
| V4_5PLUS | 8 min | Richer sound |
| V4_5ALL | 8 min | Smart & fast |
| V5 | 8 min | Superior musicality and speed |

---

## Extend Music

**POST** `/api/v1/generate/extend`

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audioId` | string | Yes | ID of track to extend |
| `defaultParamFlag` | boolean | Yes | `true` = custom params, `false` = inherit from original |
| `model` | string | Yes | `V4`, `V4_5`, `V4_5PLUS`, `V4_5ALL`, `V5` |
| `callBackUrl` | string (URI) | Yes | Webhook URL |
| `prompt` | string | Conditional | Extension description/lyrics |
| `style` | string | When `defaultParamFlag: true` | Music style |
| `title` | string | When `defaultParamFlag: true` | Track title |
| `continueAt` | number | When `defaultParamFlag: true` | Start point in seconds |
| `negativeTags` | string | No | Styles to exclude |
| `vocalGender` | string | No | `m` or `f` |
| `styleWeight` | number | No | 0-1 |
| `weirdnessConstraint` | number | No | 0-1 |
| `audioWeight` | number | No | 0-1 |
| `personaId` | string | No | Custom persona ID |

### Response
Same format as Generate Music.

---

## Upload And Cover Audio

**POST** `/api/v1/generate/upload-cover`

Creates a cover version of an uploaded audio track.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uploadUrl` | string (URI) | Yes | Audio file URL (max 8 minutes) |
| `prompt` | string | Yes | Content description |
| `customMode` | boolean | Yes | Advanced settings toggle |
| `instrumental` | boolean | Yes | Instrumental only |
| `model` | string | Yes | `V4`, `V4_5`, `V4_5PLUS`, `V4_5ALL`, `V5` |
| `callBackUrl` | string (URI) | Yes | Webhook URL |
| `style` | string | Custom mode | Music genre/style |
| `title` | string | Custom mode | Track title |
| `negativeTags` | string | No | Styles to exclude |
| `vocalGender` | string | No | `m` or `f` |
| `styleWeight` | number | No | 0-1 |
| `weirdnessConstraint` | number | No | 0-1 |
| `audioWeight` | number | No | 0-1 |
| `personaId` | string | No | Custom persona ID |

---

## Upload And Extend Audio

**POST** `/api/v1/generate/upload-extend`

Extends an uploaded audio track.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uploadUrl` | string (URI) | Yes | Audio file URL (max 8 minutes) |
| `defaultParamFlag` | boolean | Yes | Custom mode toggle |
| `instrumental` | boolean | Yes | Instrumental only |
| `continueAt` | number | Yes | Start time in seconds |
| `model` | string | Yes | `V4`, `V4_5`, `V4_5PLUS`, `V4_5ALL`, `V5` |
| `callBackUrl` | string (URI) | Yes | Webhook URL |
| `prompt` | string | Conditional | Extension description |
| `style` | string | Custom mode | Music style |
| `title` | string | Custom mode | Track title |
| `negativeTags` | string | No | Styles to exclude |
| `vocalGender` | string | No | `m` or `f` |
| `styleWeight` | number | No | 0-1 |
| `weirdnessConstraint` | number | No | 0-1 |
| `audioWeight` | number | No | 0-1 |
| `personaId` | string | No | Custom persona ID |

---

## Add Instrumental

**POST** `/api/v1/generate/add-instrumental`

Adds instrumental accompaniment to uploaded audio.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uploadUrl` | string (URI) | Yes | Source audio URL |
| `title` | string | Yes | Music title |
| `tags` | string | Yes | Music style tags |
| `negativeTags` | string | Yes | Styles to exclude |
| `callBackUrl` | string (URI) | Yes | Webhook URL |
| `model` | string | No | `V5` or `V4_5PLUS` (default: V4_5PLUS) |
| `vocalGender` | string | No | `m` or `f` |
| `styleWeight` | number | No | 0-1 |
| `weirdnessConstraint` | number | No | 0-1 |
| `audioWeight` | number | No | 0-1 |

---

## Add Vocals

**POST** `/api/v1/generate/add-vocals`

Adds vocal singing to uploaded audio.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uploadUrl` | string (URI) | Yes | Source audio URL |
| `prompt` | string | Yes | Vocal guidance description |
| `title` | string | Yes | Music title |
| `style` | string | Yes | Music style |
| `negativeTags` | string | Yes | Styles to exclude |
| `callBackUrl` | string (URI) | Yes | Webhook URL |
| `model` | string | No | `V5` or `V4_5PLUS` (default: V4_5PLUS) |
| `vocalGender` | string | No | `m` or `f` |
| `styleWeight` | number | No | 0-1 |
| `weirdnessConstraint` | number | No | 0-1 |
| `audioWeight` | number | No | 0-1 |

---

## Replace Section

**POST** `/api/v1/generate/replace-section`

Replaces a section of generated music.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Parent music task ID |
| `audioId` | string | Yes | Audio ID to replace |
| `prompt` | string | Yes | Replacement segment description |
| `tags` | string | Yes | Music style tags |
| `title` | string | Yes | Music title |
| `infillStartS` | number | Yes | Start time in seconds (2 decimal places) |
| `infillEndS` | number | Yes | End time in seconds (2 decimal places) |
| `negativeTags` | string | No | Excluded styles |
| `fullLyrics` | string | No | Complete modified lyrics |
| `callBackUrl` | string | No | Webhook URL |

**Constraints**: Duration 6-60 seconds, cannot exceed 50% of original duration.

---

## Generate Mashup

**POST** `/api/v1/generate/mashup`

Combines two audio tracks into a mashup.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uploadUrlList` | array[string] | Yes | Exactly 2 audio file URLs |
| `customMode` | boolean | Yes | Advanced customization toggle |
| `model` | string | Yes | `V4`, `V4_5`, `V4_5PLUS`, `V4_5ALL`, `V5` |
| `callBackUrl` | string | Yes | Webhook URL |
| `prompt` | string | Conditional | Core concept (required in non-custom mode, max 500 chars) |
| `instrumental` | boolean | No | Skip vocals if true |
| `style` | string | Custom mode | Genre/mood |
| `title` | string | Custom mode | Track title (max 80 chars) |
| `vocalGender` | string | No | `m` or `f` |
| `styleWeight` | number | No | 0-1 |
| `weirdnessConstraint` | number | No | 0-1 |
| `audioWeight` | number | No | 0-1 |

---

## Generate Sounds

**POST** `/api/v1/generate/sounds`

Generates sound effects and ambient audio.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Sound description (max 500 chars) |
| `model` | string | No | Only `V5` supported |
| `soundLoop` | boolean | No | Enable looping (default: false) |
| `soundTempo` | integer | No | BPM range 1-300 |
| `soundKey` | string | No | Musical key (C, C#, D...B, Cm, C#m...Bm) |
| `grabLyrics` | boolean | No | Capture lyric subtitles (default: false) |
| `callBackUrl` | string | No | Webhook URL |

---

## Generate Lyrics

**POST** `/api/v1/lyrics`

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Lyrics description (max 200 chars) |
| `callBackUrl` | string (URI) | Yes | Webhook URL |

### Get Lyrics Details

**GET** `/api/v1/lyrics/record-info?taskId={taskId}`

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `data.status` | string | PENDING, SUCCESS, CREATE_TASK_FAILED, GENERATE_LYRICS_FAILED, CALLBACK_EXCEPTION, SENSITIVE_WORD_ERROR |
| `data.response.data[]` | array | Lyrics variations |
| `data.response.data[].text` | string | Lyrics content with section markers |
| `data.response.data[].title` | string | Suggested title |
| `data.response.data[].status` | string | `complete` or `failed` |

---

## Boost Music Style

**POST** `/api/v1/style/generate`

Generates enhanced style text from a description.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | Style description (e.g., "Pop, Mysterious") |

### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "string",
    "param": "string",
    "result": "string (generated style text)",
    "creditsConsumed": 0.00,
    "creditsRemaining": 0.00,
    "successFlag": "0|1|2",
    "errorCode": 400,
    "errorMessage": "string",
    "createTime": "string"
  }
}
```

---

## Generate Persona

**POST** `/api/v1/generate/generate-persona`

Creates a reusable music persona/character from generated music.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Music generation task ID |
| `audioId` | string | Yes | Audio track ID |
| `name` | string | Yes | Persona name |
| `description` | string | Yes | Detailed style description |
| `vocalStart` | number | No | Segment start in seconds (default: 0) |
| `vocalEnd` | number | No | Segment end in seconds (default: 30, duration 10-30s) |
| `style` | string | No | Style tag supplement |

### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "personaId": "a1b2****c3d4",
    "name": "Electronic Pop Singer",
    "description": "A modern electronic music style pop singer..."
  }
}
```

**Notes**: Requires model v3.5+ (v3.5 itself not supported). Each audio ID can generate a persona only once.

---

## Cover Suno (Generate Cover Image)

**POST** `/api/v1/suno/cover/generate`

Generates personalized cover images for music.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Original music task ID |
| `callBackUrl` | string (URI) | Yes | Webhook URL |

### Get Cover Details

**GET** `/api/v1/suno/cover/record-info?taskId={taskId}`

---

## Get Timestamped Lyrics

**POST** `/api/v1/generate/get-timestamped-lyrics`

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Music generation task ID |
| `audioId` | string | Yes | Audio track ID |

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `alignedWords[].word` | string | Lyrics text |
| `alignedWords[].startS` | number | Start time in seconds |
| `alignedWords[].endS` | number | End time in seconds |
| `alignedWords[].success` | boolean | Alignment success |
| `waveformData` | array[number] | Audio visualization data |
| `hootCer` | number | Accuracy score (0-1) |

---

## Convert to WAV

**POST** `/api/v1/wav/generate`

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Music generation task ID |
| `audioId` | string | Yes | Audio track ID |
| `callBackUrl` | string (URI) | Yes | Webhook URL |

### Get WAV Details

**GET** `/api/v1/wav/record-info?taskId={taskId}`

Status flags: `PENDING`, `SUCCESS`, `CREATE_TASK_FAILED`, `GENERATE_WAV_FAILED`, `CALLBACK_EXCEPTION`

---

## Separate Vocals

**POST** `/api/v1/vocal-removal/generate`

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Music generation task ID |
| `audioId` | string | Yes | Audio track ID |
| `type` | string | Yes | `separate_vocal` (2 stems, 10 credits) or `split_stem` (up to 12 stems, 50 credits) |
| `callBackUrl` | string (URI) | Yes | Webhook URL |

### Separation Modes

- **separate_vocal**: Returns `vocalUrl` + `instrumentalUrl`
- **split_stem**: Returns individual URLs for vocals, backing_vocals, drums, bass, guitar, keyboard, percussion, strings, synth, fx, brass, woodwinds

### Get Vocal Separation Details

**GET** `/api/v1/vocal-removal/record-info?taskId={taskId}`

---

## Generate MIDI

**POST** `/api/v1/midi/generate`

Requires completed vocal separation task first.

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Vocal separation task ID |
| `callBackUrl` | string | Yes | Webhook URL |
| `audioId` | string | No | Specific separated audio track |

### Get MIDI Details

**GET** `/api/v1/midi/record-info?taskId={taskId}`

MIDI data includes instruments with notes containing: `pitch` (MIDI 0-127), `start` (seconds), `end` (seconds), `velocity` (0-1).

---

## Create Music Video

**POST** `/api/v1/mp4/generate`

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taskId` | string | Yes | Music generation task ID |
| `audioId` | string | Yes | Audio track ID |
| `callBackUrl` | string (URI) | Yes | Webhook URL |
| `author` | string | No | Artist name overlay (max 50 chars) |
| `domainName` | string | No | Watermark text (max 50 chars) |

### Get Music Video Details

**GET** `/api/v1/mp4/record-info?taskId={taskId}`

Status flags: `PENDING`, `SUCCESS`, `CREATE_TASK_FAILED`, `GENERATE_MP4_FAILED`

---

## Get Music Details (Record Info)

**GET** `/api/v1/generate/record-info?taskId={taskId}`

Polling endpoint for all music generation tasks.

### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "5c79****be8e",
    "parentMusicId": "string",
    "param": "string",
    "status": "SUCCESS",
    "type": "chirp-v3-5",
    "operationType": "generate",
    "errorCode": null,
    "errorMessage": null,
    "response": {
      "taskId": "string",
      "sunoData": [
        {
          "id": "e231****-****-****-****-****8cadc7dc",
          "audioUrl": "https://example.cn/****.mp3",
          "streamAudioUrl": "https://example.cn/****",
          "imageUrl": "https://example.cn/****.jpeg",
          "prompt": "[Verse] Night city lights",
          "modelName": "chirp-v3-5",
          "title": "Iron Man",
          "tags": "electrifying, rock",
          "createTime": "2025-01-01 00:00:00",
          "duration": 198.44
        }
      ]
    }
  }
}
```

### Task Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Processing underway |
| `TEXT_SUCCESS` | Lyrics generation complete |
| `FIRST_SUCCESS` | First track ready |
| `SUCCESS` | All tracks complete |
| `CREATE_TASK_FAILED` | Task creation error |
| `GENERATE_AUDIO_FAILED` | Generation error |
| `SENSITIVE_WORD_ERROR` | Content filtered |
| `CALLBACK_EXCEPTION` | Webhook error |

### Operation Types
`generate`, `extend`, `upload_cover`, `upload_extend`

### Rate Limit
Maximum **3 requests per second per task**

---

## Common Callback Format

All Suno endpoints with callbacks use this format:

### Success Callback

```json
{
  "code": 200,
  "msg": "All generated successfully.",
  "data": {
    "callbackType": "complete",
    "task_id": "2fac****9f72",
    "data": [
      {
        "id": "e231****8cadc7dc",
        "audio_url": "https://example.cn/****.mp3",
        "stream_audio_url": "https://example.cn/****",
        "image_url": "https://example.cn/****.jpeg",
        "prompt": "[Verse] Night city lights shining bright",
        "model_name": "chirp-v3-5",
        "title": "Iron Man",
        "tags": "electrifying, rock",
        "createTime": "2025-01-01 00:00:00",
        "duration": 198.44
      }
    ]
  }
}
```

### Callback Types

| Type | Description |
|------|-------------|
| `text` | Text/lyrics generation complete |
| `first` | First track complete |
| `complete` | All tracks complete |
| `error` | Generation failed |

### Callback Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation Error (copyrighted content) |
| 408 | Rate Limited/Timeout |
| 413 | Conflict (audio matches existing work) |
| 500 | Server Error |
| 501 | Audio generation failed |
| 531 | Generation failed (credits refunded) |

### Callback Requirements

- Callback URL must be publicly accessible
- Respond within **15 seconds** with HTTP 200
- System retries **3 times** before stopping
- Implement idempotent processing
- Use HTTPS

---

## Common Status Codes (All Suno Endpoints)

| Code | Meaning |
|------|---------|
| 200 | Success |
| 401 | Unauthorized |
| 402 | Insufficient credits |
| 404 | Resource not found |
| 409 | Conflict (WAV record exists) |
| 422 | Validation error |
| 429 | Rate limited |
| 451 | Fetch access denied |
| 455 | Service unavailable / maintenance |
| 500 | Server error |
| 501 | Generation failed |
| 505 | Feature disabled |

---

## General Notes

- All generated files retained for **14 days**
- Model version should match source audio for extend operations
- Character limits vary by model version (V4: lower, V4_5+/V5: higher)
- Implement webhook signature verification for security
- Polling interval: **30 seconds** recommended
