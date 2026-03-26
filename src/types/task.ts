export interface TaskRecord {
  taskId: string;
  userId: string;
  model: string;
  apiType: "market" | "gpt4o" | "flux-kontext";
  prompt?: string;
  createdAt: number;
}
