import axios from "axios";
import { config } from "../config.js";
import type {
  MarketCreateTaskResponse,
  MarketTaskStatusResponse,
  Gpt4oRecordInfoResponse,
  FileUploadResponse,
} from "../types/kieai.js";
import { getModelById, type ApiType } from "../models/kieai-models.js";

const api = axios.create({
  baseURL: config.kieai.baseUrl,
  headers: {
    Authorization: `Bearer ${config.kieai.apiKey}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

const callbackUrl = `${config.kieai.callbackBaseUrl}/webhook/kieai`;

// ==================== Create Tasks ====================

export async function createMarketTask(
  model: string,
  input: Record<string, unknown>
): Promise<string> {
  const { data } = await api.post<MarketCreateTaskResponse>(
    "/api/v1/jobs/createTask",
    { model, callBackUrl: callbackUrl, input }
  );

  if (data.code !== 200 || !data.data) {
    throw new Error(`Kie.ai market task failed: ${data.msg}`);
  }
  return data.data.taskId;
}

export async function createGpt4oTask(
  prompt: string,
  options: {
    filesUrl?: string[];
    size?: string;
  } = {}
): Promise<string> {
  const { data } = await api.post<MarketCreateTaskResponse>(
    "/api/v1/gpt4o-image/generate",
    {
      prompt,
      filesUrl: options.filesUrl,
      size: options.size || "1:1",
      callBackUrl: callbackUrl,
      isEnhance: false,
    }
  );

  if (data.code !== 200 || !data.data) {
    throw new Error(`Kie.ai GPT4o task failed: ${data.msg}`);
  }
  return data.data.taskId;
}

// ==================== Suno Music API ====================

export async function createSunoTask(
  prompt: string,
  options: Record<string, unknown> = {}
): Promise<string> {
  const { data } = await api.post<MarketCreateTaskResponse>(
    "/api/v1/generate",
    {
      prompt,
      customMode: options["customMode"] ?? false,
      instrumental: options["instrumental"] ?? false,
      model: options["model"] ?? "V4_5",
      style: options["style"],
      title: options["title"],
      callBackUrl: callbackUrl,
    }
  );

  if (data.code !== 200 || !data.data) {
    throw new Error(`Suno task failed: ${data.msg}`);
  }
  return data.data.taskId;
}

export async function getSunoTaskStatus(taskId: string) {
  const { data } = await api.get<{
    code: number;
    data: {
      taskId: string;
      status: string;
      response?: {
        sunoData?: Array<{
          audioUrl: string;
          imageUrl: string;
          title: string;
          duration: number;
        }>;
      };
    };
  }>(`/api/v1/generate/record-info`, { params: { taskId } });
  return data.data;
}

// ==================== Unified Create Task ====================

export async function createTask(
  modelId: string,
  input: Record<string, unknown>
): Promise<{ taskId: string; apiType: ApiType }> {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  let taskId: string;

  switch (model.apiType) {
    case "gpt4o": {
      const prompt = input["prompt"] as string | undefined;
      const filesUrl = input["filesUrl"] as string[] | undefined;
      const size = input["size"] as string | undefined;
      taskId = await createGpt4oTask(prompt || "", { filesUrl, size });
      break;
    }
    case "suno": {
      const prompt = input["prompt"] as string || "";
      taskId = await createSunoTask(prompt, { ...model.defaultParams, ...input });
      break;
    }
    case "market":
    default: {
      const merged = { ...model.defaultParams, ...input };
      taskId = await createMarketTask(modelId, merged);
      break;
    }
  }

  return { taskId, apiType: model.apiType };
}

// ==================== Poll Status ====================

export async function getMarketTaskStatus(
  taskId: string
): Promise<MarketTaskStatusResponse["data"]> {
  const { data } = await api.get<MarketTaskStatusResponse>(
    `/api/v1/jobs/recordInfo`,
    { params: { taskId } }
  );
  return data.data;
}

export async function getGpt4oTaskStatus(
  taskId: string
): Promise<Gpt4oRecordInfoResponse["data"]> {
  const { data } = await api.get<Gpt4oRecordInfoResponse>(
    `/api/v1/gpt4o-image/record-info`,
    { params: { taskId } }
  );
  return data.data;
}

// ==================== File Upload ====================

// File upload uses a DIFFERENT base URL than the main API
const fileApi = axios.create({
  baseURL: config.kieai.fileUploadUrl,
  headers: {
    Authorization: `Bearer ${config.kieai.apiKey}`,
    "Content-Type": "application/json",
  },
  timeout: 60000, // longer timeout for file uploads
});

export async function uploadImageBase64(
  base64Data: string,
  fileName?: string
): Promise<string> {
  const { data } = await fileApi.post<FileUploadResponse>(
    "/api/file-base64-upload",
    {
      base64Data,
      uploadPath: "chaba-uploads",
      fileName,
    }
  );

  if (!data.success) {
    throw new Error(`File upload failed: ${data.msg}`);
  }
  return data.data.downloadUrl;
}

export async function uploadImageUrl(url: string): Promise<string> {
  const { data } = await fileApi.post<FileUploadResponse>(
    "/api/file-url-upload",
    {
      fileUrl: url,
      uploadPath: "chaba-uploads",
    }
  );

  if (!data.success) {
    throw new Error(`File URL upload failed: ${data.msg}`);
  }
  return data.data.downloadUrl;
}

// ==================== Check Credits ====================

export async function getCredits(): Promise<number> {
  const { data } = await api.get<{ code: number; data: number }>(
    "/api/v1/chat/credit"
  );
  return data.data;
}
