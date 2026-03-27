import type { webhook } from "@line/bot-sdk";
import { replyText, pushText, getImageBuffer } from "../services/line.js";
import * as kieai from "../services/kieai.js";
import * as dbService from "../services/database.js";
import { getModelById } from "../models/kieai-models.js";
import {
  getPendingCommand,
  clearPendingCommand,
} from "./text-message.js";
import { getSession, clearSession } from "./session.js";

export async function handleImageMessage(
  event: webhook.MessageEvent & { message: webhook.ImageMessageContent }
): Promise<void> {
  const userId = event.source?.userId;
  if (!userId) return;

  const replyToken = event.replyToken!;
  const messageId = event.message.id;

  await dbService.getOrCreateUser(userId);

  // Check session first (from menu postback), then pendingCommand (from text command)
  const session = getSession(userId);
  const pending = getPendingCommand(userId);
  clearPendingCommand(userId);

  let modelId: string;
  let prompt: string | undefined;

  if (session?.command === "removebg_wait") {
    modelId = "recraft/remove-background";
    clearSession(userId);
  } else if (session?.command === "upscale_wait") {
    modelId = "topaz/image-upscale";
    clearSession(userId);
  } else if (pending?.command === "removebg") {
    modelId = "recraft/remove-background";
  } else if (pending?.command === "upscale") {
    modelId = "topaz/image-upscale";
  } else if (pending?.command?.startsWith("prompt:")) {
    modelId = await dbService.getSelectedModel(userId);
    prompt = pending.command.slice(7);
    // If selected model doesn't support images, use flux image-to-image
    const model = getModelById(modelId);
    if (model && !model.requiresImage) {
      modelId = "flux-2/pro-image-to-image";
    }
  } else {
    // Check if user's selected model supports images
    const selected = await dbService.getSelectedModel(userId);
    const selectedModel = getModelById(selected);
    if (selectedModel?.requiresImage) {
      modelId = selected;
    } else {
      // Default: image-to-image with generic prompt
      modelId = "flux-2/pro-image-to-image";
    }
    prompt = "Enhance this image";
  }

  const model = getModelById(modelId);
  if (!model) {
    await replyText(replyToken, "Model not found.");
    return;
  }

  // Check balance
  const balance = await dbService.getBalance(userId);
  if (balance < model.creditCost) {
    await replyText(
      replyToken,
      `Not enough balance.\nRequired: ${model.creditCost} THB\nBalance: ${balance.toFixed(2)} THB\n\nUse /topup <amount> to top up.`
    );
    return;
  }

  // Deduct FIRST
  const spent = await dbService.spend(
    userId,
    model.creditCost,
    `${model.label}: ${(prompt || "image").slice(0, 50)}`
  );

  if (!spent) {
    await replyText(replyToken, "Payment failed. Please try again.");
    return;
  }

  await replyText(
    replyToken,
    `Processing with ${model.label}... (-${model.creditCost} THB)`
  );

  try {
    // Download image from LINE
    const imageBuffer = await getImageBuffer(messageId);
    const base64Data = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

    // Upload to Kie.ai
    const uploadedUrl = await kieai.uploadImageBase64(base64Data);

    // Build input based on model type
    let input: Record<string, unknown>;

    switch (model.type) {
      case "remove-background":
        input = { image: uploadedUrl };
        break;
      case "upscale":
        input = {
          image_url: uploadedUrl,
          ...model.defaultParams,
        };
        break;
      case "image-to-image":
        input = {
          input_urls: [uploadedUrl],
          prompt: prompt || "Enhance this image",
          ...model.defaultParams,
        };
        break;
      case "image-to-video":
        input = {
          image: uploadedUrl,
          prompt: prompt || "Animate this image",
          ...model.defaultParams,
        };
        break;
      default:
        input = { image_url: uploadedUrl, prompt };
        break;
    }

    const { taskId, apiType } = await kieai.createTask(model.id, input);
    await dbService.saveTask(taskId, userId, model.id, apiType, prompt);
  } catch (err) {
    console.error("Image task error:", err);
    // Refund on failure
    await dbService.refund(userId, model.creditCost, "Refund: image task failed");
    await pushText(
      userId,
      `Processing failed. ${model.creditCost} THB refunded.`
    );
  }
}
