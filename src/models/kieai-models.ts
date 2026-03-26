export type ModelType =
  | "text-to-image"
  | "image-to-image"
  | "remove-background"
  | "upscale"
  | "text-to-video"
  | "image-to-video"
  | "text-to-audio"
  | "text-to-music";

export type ApiType = "market" | "gpt4o" | "flux-kontext" | "runway" | "veo" | "suno";

export interface ModelDef {
  id: string;
  label: string;
  labelTh: string;
  type: ModelType;
  apiType: ApiType;
  requiresImage: boolean;
  creditCost: number;
  defaultParams?: Record<string, unknown>;
  category: "image" | "video" | "audio" | "music";
}

export const models: ModelDef[] = [
  // ==================== IMAGE: Text-to-Image ====================
  {
    id: "flux-2/pro-text-to-image",
    label: "Flux 2 Pro",
    labelTh: "Flux 2 Pro",
    type: "text-to-image",
    apiType: "market",
    requiresImage: false,
    creditCost: 5,
    category: "image",
    defaultParams: { aspect_ratio: "1:1", resolution: "1K" },
  },
  {
    id: "gpt-image/1.5-text-to-image",
    label: "GPT Image 1.5",
    labelTh: "GPT Image 1.5",
    type: "text-to-image",
    apiType: "gpt4o",
    requiresImage: false,
    creditCost: 8,
    category: "image",
    defaultParams: { size: "1:1", quality: "medium" },
  },
  {
    id: "ideogram/v3-text-to-image",
    label: "Ideogram V3",
    labelTh: "Ideogram V3",
    type: "text-to-image",
    apiType: "market",
    requiresImage: false,
    creditCost: 5,
    category: "image",
    defaultParams: { rendering_speed: "BALANCED", style: "AUTO", image_size: "square_hd" },
  },
  {
    id: "google/imagen4",
    label: "Google Imagen 4",
    labelTh: "Google Imagen 4",
    type: "text-to-image",
    apiType: "market",
    requiresImage: false,
    creditCost: 5,
    category: "image",
    defaultParams: { aspect_ratio: "1:1" },
  },
  {
    id: "grok-imagine/text-to-image",
    label: "Grok Imagine",
    labelTh: "Grok Imagine",
    type: "text-to-image",
    apiType: "market",
    requiresImage: false,
    creditCost: 5,
    category: "image",
    defaultParams: { aspect_ratio: "1:1" },
  },

  // ==================== IMAGE: Image-to-Image ====================
  {
    id: "flux-2/pro-image-to-image",
    label: "Flux 2 Pro (i2i)",
    labelTh: "Flux 2 Pro (แก้ไขรูป)",
    type: "image-to-image",
    apiType: "market",
    requiresImage: true,
    creditCost: 6,
    category: "image",
    defaultParams: { aspect_ratio: "auto", resolution: "1K" },
  },

  // ==================== IMAGE: Utilities ====================
  {
    id: "recraft/remove-background",
    label: "Remove BG",
    labelTh: "ลบพื้นหลัง",
    type: "remove-background",
    apiType: "market",
    requiresImage: true,
    creditCost: 3,
    category: "image",
  },
  {
    id: "topaz/image-upscale",
    label: "Upscale",
    labelTh: "ขยายรูป",
    type: "upscale",
    apiType: "market",
    requiresImage: true,
    creditCost: 4,
    category: "image",
    defaultParams: { upscale_factor: "2" },
  },

  // ==================== VIDEO: Text-to-Video ====================
  {
    id: "kling-2.6/text-to-video",
    label: "Kling 2.6",
    labelTh: "Kling 2.6 (วิดีโอ)",
    type: "text-to-video",
    apiType: "market",
    requiresImage: false,
    creditCost: 20,
    category: "video",
    defaultParams: { sound: false, aspect_ratio: "16:9", duration: "5" },
  },
  {
    id: "wan/2-6-text-to-video",
    label: "Wan 2.6",
    labelTh: "Wan 2.6 (วิดีโอ)",
    type: "text-to-video",
    apiType: "market",
    requiresImage: false,
    creditCost: 15,
    category: "video",
    defaultParams: { duration: "5", resolution: "720p" },
  },
  {
    id: "grok-imagine/text-to-video",
    label: "Grok Video",
    labelTh: "Grok (วิดีโอ)",
    type: "text-to-video",
    apiType: "market",
    requiresImage: false,
    creditCost: 18,
    category: "video",
    defaultParams: { aspect_ratio: "16:9", mode: "normal", duration: "6", resolution: "480p" },
  },

  // ==================== VIDEO: Image-to-Video ====================
  {
    id: "kling-2.6/image-to-video",
    label: "Kling 2.6 (i2v)",
    labelTh: "Kling 2.6 (รูปเป็นวิดีโอ)",
    type: "image-to-video",
    apiType: "market",
    requiresImage: true,
    creditCost: 22,
    category: "video",
    defaultParams: { sound: false, duration: "5" },
  },
  {
    id: "wan/2-6-image-to-video",
    label: "Wan 2.6 (i2v)",
    labelTh: "Wan 2.6 (รูปเป็นวิดีโอ)",
    type: "image-to-video",
    apiType: "market",
    requiresImage: true,
    creditCost: 18,
    category: "video",
    defaultParams: { duration: "5", resolution: "720p" },
  },

  // ==================== AUDIO: Text-to-Speech ====================
  {
    id: "elevenlabs/text-to-speech-turbo-2-5",
    label: "ElevenLabs TTS",
    labelTh: "สร้างเสียงพูด",
    type: "text-to-audio",
    apiType: "market",
    requiresImage: false,
    creditCost: 5,
    category: "audio",
    defaultParams: { voice: "Rachel", stability: 0.5, similarity_boost: 0.75, speed: 1 },
  },
  {
    id: "elevenlabs/sound-effect-v2",
    label: "Sound Effect",
    labelTh: "สร้างเสียงเอฟเฟกต์",
    type: "text-to-audio",
    apiType: "market",
    requiresImage: false,
    creditCost: 4,
    category: "audio",
    defaultParams: { duration_seconds: 5, prompt_influence: 0.3 },
  },

  // ==================== MUSIC ====================
  {
    id: "suno/v4.5",
    label: "Suno V4.5",
    labelTh: "สร้างเพลง (Suno)",
    type: "text-to-music",
    apiType: "suno",
    requiresImage: false,
    creditCost: 10,
    category: "music",
    defaultParams: { customMode: false, instrumental: false, model: "V4_5" },
  },
];

export function getModelById(id: string): ModelDef | undefined {
  return models.find((m) => m.id === id);
}

export function getTextToImageModels(): ModelDef[] {
  return models.filter((m) => m.type === "text-to-image");
}

export function getModelsByCategory(category: ModelDef["category"]): ModelDef[] {
  return models.filter((m) => m.category === category);
}

export function getDefaultModel(): ModelDef {
  return models[0]!;
}
