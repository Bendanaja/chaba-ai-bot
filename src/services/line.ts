import { messagingApi, HTTPFetchError } from "@line/bot-sdk";
import { config } from "../config.js";

const { MessagingApiClient, MessagingApiBlobClient } = messagingApi;

export const lineClient = new MessagingApiClient({
  channelAccessToken: config.line.channelAccessToken,
});

export const lineBlobClient = new MessagingApiBlobClient({
  channelAccessToken: config.line.channelAccessToken,
});

export async function replyText(
  replyToken: string,
  text: string
): Promise<void> {
  try {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: "text", text }],
    });
  } catch (err) {
    if (err instanceof HTTPFetchError) {
      console.error("LINE reply error:", err.status, err.body);
    }
    throw err;
  }
}

export async function pushText(userId: string, text: string): Promise<void> {
  try {
    await lineClient.pushMessage({
      to: userId,
      messages: [{ type: "text", text }],
    });
  } catch (err) {
    if (err instanceof HTTPFetchError) {
      console.error("LINE push text error:", err.status, err.body);
    }
  }
}

export async function pushImage(
  userId: string,
  imageUrl: string
): Promise<void> {
  try {
    await lineClient.pushMessage({
      to: userId,
      messages: [
        {
          type: "image",
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl,
        },
      ],
    });
  } catch (err) {
    if (err instanceof HTTPFetchError) {
      console.error("LINE push image error:", err.status, err.body);
    }
  }
}

export async function pushVideo(
  userId: string,
  videoUrl: string,
  previewUrl: string
): Promise<void> {
  try {
    await lineClient.pushMessage({
      to: userId,
      messages: [
        {
          type: "video",
          originalContentUrl: videoUrl,
          previewImageUrl: previewUrl,
        },
      ],
    });
  } catch (err) {
    if (err instanceof HTTPFetchError) {
      console.error("LINE push video error:", err.status, err.body);
    }
  }
}

export async function pushAudio(
  userId: string,
  audioUrl: string,
  duration: number
): Promise<void> {
  try {
    await lineClient.pushMessage({
      to: userId,
      messages: [
        {
          type: "audio",
          originalContentUrl: audioUrl,
          duration,
        },
      ],
    });
  } catch (err) {
    if (err instanceof HTTPFetchError) {
      console.error("LINE push audio error:", err.status, err.body);
    }
  }
}

export async function getImageBuffer(messageId: string): Promise<Buffer> {
  const stream = await lineBlobClient.getMessageContent(messageId);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
