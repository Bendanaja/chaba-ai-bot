import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  line: {
    channelId: required("LINE_CHANNEL_ID"),
    channelSecret: required("LINE_CHANNEL_SECRET"),
    channelAccessToken: required("LINE_CHANNEL_ACCESS_TOKEN"),
  },
  kieai: {
    apiKey: required("KIEAI_API_KEY"),
    callbackBaseUrl: required("KIEAI_CALLBACK_BASE_URL"),
    baseUrl: "https://api.kie.ai",
    fileUploadUrl: "https://kieai.redpandaai.co",
  },
  port: parseInt(process.env["PORT"] || "3000", 10),
} as const;
