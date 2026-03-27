import type { webhook } from "@line/bot-sdk";
import { replyText, pushText, getImageBuffer } from "../services/line.js";
import * as kieai from "../services/kieai.js";
import * as dbService from "../services/database.js";
import { getModelById } from "../models/kieai-models.js";
import {
  getPendingTopup,
  setPendingTopup,
  clearPendingTopup,
  getPendingCommand,
  clearPendingCommand,
  executeGenerationForUser,
} from "./text-message.js";
import { verifySlip } from "../services/slip2go.js";
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

  // Slip detection: auto-verify via Slip2Go when user sends image with pending topup
  if (!session && !pending) {
    const topupPending = getPendingTopup(userId);
    if (topupPending) {
      await replyText(replyToken, "🔍 กำลังตรวจสอบสลิปนะคะ รอแป๊บนึง~");
      try {
        const imageBuffer = await getImageBuffer(messageId);
        const result = await verifySlip(imageBuffer);

        if (!result.success) {
          await pushText(userId, `❌ ${result.message}\n\nส่งสลิปใหม่ได้เลยนะคะ 💕`);
          return;
        }

        // Check duplicate
        const used = await dbService.isSlipUsed(result.slipId);
        if (used) {
          await pushText(userId, "❌ สลิปนี้ถูกใช้ไปแล้วนะคะ กรุณาโอนเงินใหม่แล้วส่งสลิปใหม่ค่ะ");
          return;
        }

        // Check amount sufficient
        if (result.amount < topupPending.shortfall) {
          await dbService.recordSlip({ slipId: result.slipId, amount: result.amount, userId });
          const newBal = await dbService.topUp(userId, result.amount);
          const remaining = topupPending.shortfall - result.amount;
          setPendingTopup(userId, { ...topupPending, shortfall: remaining });
          await pushText(userId,
            `💸 ได้รับ ${result.amount.toFixed(2)} บาทแล้วค่ะ ยังขาดอีก ${remaining.toFixed(2)} บาทนะคะ\n💰 ยอดปัจจุบัน: ${newBal.toFixed(2)} บาท\n\nโอนเพิ่มแล้วส่งสลิปมาอีกทีนะคะ 💕`
          );
          return;
        }

        // All good — topup + auto-generate
        await dbService.recordSlip({ slipId: result.slipId, amount: result.amount, userId });
        const newBalance = await dbService.topUp(userId, result.amount);
        clearPendingTopup(userId);

        await pushText(userId,
          `✅ ตรวจสอบสลิปผ่านแล้วค่ะ!\n💰 เติมเงิน ${result.amount.toFixed(2)} บาท\n💎 ยอดคงเหลือ: ${newBalance.toFixed(2)} บาท`
        );

        const pendingModel = getModelById(topupPending.modelId);
        if (pendingModel && newBalance >= pendingModel.creditCost) {
          await executeGenerationForUser(userId, pendingModel, topupPending.prompt, topupPending.extraInput);
        }
      } catch (err) {
        console.error("Slip verification error:", err);
        await pushText(userId, "😅 เกิดข้อผิดพลาดในการตรวจสอบสลิป ลองส่งใหม่อีกทีนะคะ~");
      }
      return;
    }
  }

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
      `🪙 เงินไม่พอค่าา~\nต้องการ ${model.creditCost} บาท แต่คงเหลือ ${balance.toFixed(2)} บาทเองเลย\nเติมเงินก่อนนะคะ 💕`
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
    await replyText(replyToken, "😅 หักเงินไม่ผ่านค่ะ ลองใหม่อีกทีนะคะ~");
    return;
  }

  await replyText(
    replyToken,
    `🌸 น้องชบากำลังประมวลผลรูปให้อยู่นะคะ~\n✨ ${model.label}\n💸 หักไป ${model.creditCost} บาท รอแป๊บนึงน้า!`
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
      `😢 ประมวลผลรูปไม่สำเร็จเลยค่ะ คืนเงิน ${model.creditCost} บาทให้แล้วนะคะ~`
    );
  }
}
