import type { messagingApi } from "@line/bot-sdk";

// ==================== Types ====================

export interface SessionStep {
  key: string;
  question: string;
  questionTh: string;
  type: "text" | "select";
  options?: { label: string; value: string }[];
  optional?: boolean; // skip if user sends "ข้าม" / "skip"
}

export interface Session {
  command: string;
  modelId: string;
  params: Record<string, unknown>;
  stepIndex: number;
  steps: SessionStep[];
  expiresAt: number;
}

const sessions = new Map<string, Session>();
const SESSION_TTL = 5 * 60 * 1000; // 5 minutes

// ==================== Session CRUD ====================

export function getSession(userId: string): Session | undefined {
  const s = sessions.get(userId);
  if (!s) return undefined;
  if (Date.now() > s.expiresAt) {
    sessions.delete(userId);
    return undefined;
  }
  return s;
}

export function startSession(userId: string, session: Omit<Session, "stepIndex" | "expiresAt">): Session {
  const s: Session = {
    ...session,
    stepIndex: 0,
    expiresAt: Date.now() + SESSION_TTL,
  };
  sessions.set(userId, s);
  return s;
}

export function clearSession(userId: string): void {
  sessions.delete(userId);
}

// ==================== Step Definitions ====================

const ASPECT_RATIOS = [
  { label: "1:1 (สี่เหลี่ยม)", value: "1:1" },
  { label: "16:9 (แนวนอน)", value: "16:9" },
  { label: "9:16 (แนวตั้ง)", value: "9:16" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
];

const VIDEO_DURATIONS = [
  { label: "5 วินาที", value: "5" },
  { label: "10 วินาที", value: "10" },
];

const SOUND_OPTIONS = [
  { label: "มีเสียง", value: "true" },
  { label: "ไม่มีเสียง", value: "false" },
];

const VIDEO_RESOLUTIONS = [
  { label: "720p", value: "720p" },
  { label: "480p", value: "480p" },
];

const TTS_VOICES = [
  { label: "Rachel (ผู้หญิง)", value: "Rachel" },
  { label: "Adam (ผู้ชาย)", value: "Adam" },
  { label: "Bella (ผู้หญิง)", value: "Bella" },
  { label: "Antoni (ผู้ชาย)", value: "Antoni" },
  { label: "Elli (ผู้หญิง)", value: "Elli" },
  { label: "Josh (ผู้ชาย)", value: "Josh" },
];

const SFX_DURATIONS = [
  { label: "3 วินาที", value: "3" },
  { label: "5 วินาที", value: "5" },
  { label: "10 วินาที", value: "10" },
];

const INSTRUMENTAL_OPTIONS = [
  { label: "มีเนื้อร้อง", value: "false" },
  { label: "Instrumental (ไม่มีเนื้อร้อง)", value: "true" },
];

const IMAGE_QUALITY = [
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

// ==================== Flow Definitions ====================

export function getStepsForCommand(command: string, modelId: string): SessionStep[] {
  switch (command) {
    case "image":
      if (modelId.startsWith("gpt-image")) {
        return [
          { key: "prompt", question: "What do you want to generate?", questionTh: "พิมพ์ prompt ที่ต้องการสร้างรูป:", type: "text" },
          { key: "size", question: "Aspect ratio?", questionTh: "เลือกอัตราส่วน:", type: "select", options: ASPECT_RATIOS },
          { key: "quality", question: "Quality?", questionTh: "เลือกคุณภาพ:", type: "select", options: IMAGE_QUALITY },
        ];
      }
      if (modelId.startsWith("ideogram")) {
        return [
          { key: "prompt", question: "What do you want to generate?", questionTh: "พิมพ์ prompt ที่ต้องการสร้างรูป:", type: "text" },
          { key: "image_size", question: "Aspect ratio?", questionTh: "เลือกอัตราส่วน:", type: "select", options: [
            { label: "1:1 HD", value: "square_hd" },
            { label: "16:9", value: "landscape_16_9" },
            { label: "9:16", value: "portrait_16_9" },
            { label: "4:3", value: "landscape_4_3" },
          ]},
        ];
      }
      return [
        { key: "prompt", question: "What do you want to generate?", questionTh: "พิมพ์ prompt ที่ต้องการสร้างรูป:", type: "text" },
        { key: "aspect_ratio", question: "Aspect ratio?", questionTh: "เลือกอัตราส่วน:", type: "select", options: ASPECT_RATIOS },
      ];

    case "video":
      if (modelId.includes("kling")) {
        return [
          { key: "prompt", question: "Describe the video:", questionTh: "อธิบายวิดีโอที่ต้องการ:", type: "text" },
          { key: "aspect_ratio", question: "Aspect ratio?", questionTh: "เลือกอัตราส่วน:", type: "select", options: ASPECT_RATIOS.slice(0, 3) },
          { key: "duration", question: "Duration?", questionTh: "เลือกความยาว:", type: "select", options: VIDEO_DURATIONS },
          { key: "sound", question: "Sound?", questionTh: "ต้องการเสียงไหม?", type: "select", options: SOUND_OPTIONS },
        ];
      }
      if (modelId.includes("wan")) {
        return [
          { key: "prompt", question: "Describe the video:", questionTh: "อธิบายวิดีโอที่ต้องการ:", type: "text" },
          { key: "duration", question: "Duration?", questionTh: "เลือกความยาว:", type: "select", options: VIDEO_DURATIONS },
          { key: "resolution", question: "Resolution?", questionTh: "เลือกความละเอียด:", type: "select", options: VIDEO_RESOLUTIONS },
        ];
      }
      if (modelId.includes("grok")) {
        return [
          { key: "prompt", question: "Describe the video:", questionTh: "อธิบายวิดีโอที่ต้องการ:", type: "text" },
          { key: "aspect_ratio", question: "Aspect ratio?", questionTh: "เลือกอัตราส่วน:", type: "select", options: ASPECT_RATIOS.slice(0, 3) },
          { key: "duration", question: "Duration?", questionTh: "เลือกความยาว:", type: "select", options: [{ label: "6 วินาที", value: "6" }, { label: "10 วินาที", value: "10" }] },
          { key: "resolution", question: "Resolution?", questionTh: "เลือกความละเอียด:", type: "select", options: VIDEO_RESOLUTIONS },
        ];
      }
      return [
        { key: "prompt", question: "Describe the video:", questionTh: "อธิบายวิดีโอที่ต้องการ:", type: "text" },
        { key: "aspect_ratio", question: "Aspect ratio?", questionTh: "เลือกอัตราส่วน:", type: "select", options: ASPECT_RATIOS.slice(0, 3) },
        { key: "duration", question: "Duration?", questionTh: "เลือกความยาว:", type: "select", options: VIDEO_DURATIONS },
      ];

    case "audio":
      return [
        { key: "text", question: "Enter text to speak:", questionTh: "พิมพ์ข้อความที่ต้องการให้พูด:", type: "text" },
        { key: "voice", question: "Choose a voice:", questionTh: "เลือกเสียง:", type: "select", options: TTS_VOICES },
        { key: "speed", question: "Speed?", questionTh: "เลือกความเร็ว:", type: "select", options: [
          { label: "ช้า (0.75x)", value: "0.75" },
          { label: "ปกติ (1x)", value: "1" },
          { label: "เร็ว (1.25x)", value: "1.25" },
          { label: "เร็วมาก (1.5x)", value: "1.5" },
        ]},
      ];

    case "sfx":
      return [
        { key: "text", question: "Describe the sound:", questionTh: "อธิบายเสียงที่ต้องการ:", type: "text" },
        { key: "duration_seconds", question: "Duration?", questionTh: "เลือกความยาว:", type: "select", options: SFX_DURATIONS },
      ];

    case "music":
      return [
        { key: "prompt", question: "Describe the song:", questionTh: "อธิบายเพลงที่ต้องการ (หรือพิมพ์เนื้อร้อง):", type: "text" },
        { key: "instrumental", question: "Vocals?", questionTh: "ต้องการเนื้อร้องไหม?", type: "select", options: INSTRUMENTAL_OPTIONS },
        { key: "style", question: "Music style?", questionTh: "สไตล์เพลง (เช่น Pop, Rock, Jazz) หรือพิมพ์ 'ข้าม':", type: "text", optional: true },
        { key: "title", question: "Song title?", questionTh: "ชื่อเพลง (หรือพิมพ์ 'ข้าม'):", type: "text", optional: true },
      ];

    default:
      return [];
  }
}

// ==================== Quick Reply Builder ====================

export function buildQuickReplyMessage(
  text: string,
  options: { label: string; value: string }[]
): messagingApi.TextMessage {
  return {
    type: "text",
    text,
    quickReply: {
      items: options.map((opt) => ({
        type: "action" as const,
        action: {
          type: "message" as const,
          label: opt.label.slice(0, 20), // LINE limit: 20 chars
          text: opt.value,
        },
      })),
    },
  };
}

export function getCurrentStepMessage(session: Session): messagingApi.TextMessage | null {
  if (session.stepIndex >= session.steps.length) return null;

  const step = session.steps[session.stepIndex]!;
  const text = step.questionTh;

  if (step.type === "select" && step.options) {
    return buildQuickReplyMessage(text, step.options);
  }

  return { type: "text", text };
}
