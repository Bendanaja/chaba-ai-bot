export interface MarketCreateTaskRequest {
  model: string;
  callBackUrl: string;
  input: Record<string, unknown>;
}

export interface MarketCreateTaskResponse {
  code: number;
  msg: string;
  data: { taskId: string } | null;
}

export interface MarketTaskStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    model: string;
    state: "success" | "waiting" | "queuing" | "generating" | "fail";
    resultJson: string;
    failMsg: string;
    progress: number;
  };
}

export interface MarketCallbackBody {
  taskId: string;
  code: number;
  msg: string;
  data: {
    task_id: string;
    callbackType: string;
  };
}

export interface Gpt4oGenerateRequest {
  prompt?: string;
  filesUrl?: string[];
  size: string;
  callBackUrl: string;
  isEnhance?: boolean;
  enableFallback?: boolean;
}

export interface Gpt4oCallbackBody {
  code: number;
  msg: string;
  data: {
    taskId: string;
    info: {
      result_urls: string[];
    } | null;
  };
}

export interface Gpt4oRecordInfoResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    successFlag: number; // 0=processing, 1=success, 2=failed
    response: {
      resultUrls: string[];
    };
  };
}

export interface FileUploadResponse {
  success: boolean;
  code: number;
  msg: string;
  data: {
    fileName: string;
    filePath: string;
    downloadUrl: string;
    fileSize: number;
    mimeType: string;
  };
}
