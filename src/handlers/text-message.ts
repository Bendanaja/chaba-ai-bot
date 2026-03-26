import type { webhook } from "@line/bot-sdk";
import { replyText, pushText } from "../services/line.js";
import * as kieai from "../services/kieai.js";
import * as dbService from "../services/database.js";
import {
  getModelById,
  getModelsByCategory,
  models,
} from "../models/kieai-models.js";

// Pending commands: user typed /removebg, /upscale, etc. waiting for image
const pendingCommands = new Map<
  string,
  { command: string; expiresAt: number }
>();

export function getPendingCommand(
  userId: string
): { command: string } | undefined {
  const pending = pendingCommands.get(userId);
  if (!pending) return undefined;
  if (Date.now() > pending.expiresAt) {
    pendingCommands.delete(userId);
    return undefined;
  }
  return { command: pending.command };
}

export function clearPendingCommand(userId: string): void {
  pendingCommands.delete(userId);
}

export async function handleTextMessage(
  event: webhook.MessageEvent & { message: webhook.TextMessageContent }
): Promise<void> {
  const userId = event.source?.userId;
  if (!userId) return;

  const text = event.message.text.trim();
  const replyToken = event.replyToken!;

  dbService.getOrCreateUser(userId);

  // ==================== Commands ====================

  if (text.startsWith("/")) {
    const parts = text.split(/\s+/);
    const cmd = parts[0]!.toLowerCase();

    switch (cmd) {
      case "/myid": {
        await replyText(replyToken, `Your User ID:\n${userId}`);
        return;
      }

      case "/balance":
      case "/wallet": {
        const balance = dbService.getBalance(userId);
        await replyText(replyToken, `Wallet: ${balance.toFixed(2)} THB`);
        return;
      }

      case "/topup": {
        // Admin-only: check ADMIN_USER_IDS env var
        const adminIds = (process.env["ADMIN_USER_IDS"] || "").split(",");
        if (!adminIds.includes(userId)) {
          await replyText(
            replyToken,
            "Contact admin to top up your wallet.\nTransfer via PromptPay then send slip."
          );
          return;
        }
        // Admin can top up any user: /topup <amount> or /topup <amount> <userId>
        const amount = parseFloat(parts[1] || "0");
        if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
          await replyText(replyToken, "Usage: /topup <amount>\nMax: 100,000 THB");
          return;
        }
        const targetUserId = parts[2] || userId;
        dbService.getOrCreateUser(targetUserId);
        const newBalance = dbService.topUp(targetUserId, amount);
        await replyText(
          replyToken,
          `Top up +${amount} THB\nUser: ${targetUserId === userId ? "you" : targetUserId}\nBalance: ${newBalance.toFixed(2)} THB`
        );
        return;
      }

      case "/history": {
        const txns = dbService.getTransactions(userId, 10);
        if (txns.length === 0) {
          await replyText(replyToken, "No transactions yet.");
          return;
        }
        const lines = txns.map(
          (t) =>
            `${t.type === "topup" ? "+" : t.type === "refund" ? "+" : "-"}${t.amount} THB - ${t.description || t.type} (${t.created_at})`
        );
        await replyText(replyToken, `Transaction History:\n${lines.join("\n")}`);
        return;
      }

      case "/model": {
        if (parts[1]) {
          const modelId = parts.slice(1).join(" ");
          const model = getModelById(modelId);
          if (!model) {
            const available = models
              .map((m) => `  ${m.id} - ${m.labelTh} (${m.creditCost} THB)`)
              .join("\n");
            await replyText(
              replyToken,
              `Model not found.\n\nAvailable models:\n${available}`
            );
            return;
          }
          dbService.setSelectedModel(userId, model.id);
          await replyText(
            replyToken,
            `Model: ${model.label} (${model.creditCost} THB/gen)`
          );
          return;
        }

        const current = dbService.getSelectedModel(userId);
        const currentModel = getModelById(current);
        const available = models
          .map(
            (m) =>
              `${m.id === current ? ">" : " "} ${m.id} - ${m.labelTh} (${m.creditCost} THB)`
          )
          .join("\n");
        await replyText(
          replyToken,
          `Current: ${currentModel?.label || current}\n\nModels:\n${available}\n\nUsage: /model <model_id>`
        );
        return;
      }

      case "/removebg":
      case "/upscale": {
        pendingCommands.set(userId, {
          command: cmd.slice(1),
          expiresAt: Date.now() + 60_000,
        });
        await replyText(replyToken, `Send an image now. (${cmd})`);
        return;
      }

      case "/video": {
        const prompt = parts.slice(1).join(" ");
        if (!prompt) {
          await replyText(replyToken, "Usage: /video <prompt>\nExample: /video A cat running in a garden");
          return;
        }
        const vModel = getModelById("kling-2.6/text-to-video")!;
        await generateWithModel(userId, replyToken, vModel, prompt);
        return;
      }

      case "/audio":
      case "/tts": {
        const prompt = parts.slice(1).join(" ");
        if (!prompt) {
          await replyText(replyToken, "Usage: /audio <text>\nExample: /audio Hello world");
          return;
        }
        const aModel = getModelById("elevenlabs/text-to-speech-turbo-2-5")!;
        await generateWithModel(userId, replyToken, aModel, prompt, { text: prompt });
        return;
      }

      case "/sfx": {
        const prompt = parts.slice(1).join(" ");
        if (!prompt) {
          await replyText(replyToken, "Usage: /sfx <description>\nExample: /sfx Thunder and rain");
          return;
        }
        const sfxModel = getModelById("elevenlabs/sound-effect-v2")!;
        await generateWithModel(userId, replyToken, sfxModel, prompt, { text: prompt });
        return;
      }

      case "/music": {
        const prompt = parts.slice(1).join(" ");
        if (!prompt) {
          await replyText(replyToken, "Usage: /music <description>\nExample: /music Upbeat electronic dance track");
          return;
        }
        const mModel = getModelById("suno/v4.5")!;
        await generateWithModel(userId, replyToken, mModel, prompt);
        return;
      }

      case "/price": {
        const categories = ["image", "video", "audio", "music"] as const;
        const sections = categories.map((cat) => {
          const catModels = getModelsByCategory(cat);
          const lines = catModels.map((m) => `  ${m.labelTh}: ${m.creditCost} THB`);
          return `[${cat.toUpperCase()}]\n${lines.join("\n")}`;
        });
        await replyText(replyToken, `Pricing:\n\n${sections.join("\n\n")}`);
        return;
      }

      case "/help": {
        await replyText(
          replyToken,
          [
            "=== Commands ===",
            "",
            "[Wallet]",
            "/wallet - Check balance",
            "/topup <amount> - Top up",
            "/history - Transactions",
            "",
            "[Image]",
            "Send text = Generate image",
            "Send image = Edit image",
            "/model - View/change model",
            "/removebg - Remove background",
            "/upscale - Upscale image",
            "",
            "[Video]",
            "/video <prompt> - Generate video",
            "",
            "[Audio]",
            "/audio <text> - Text to speech",
            "/sfx <desc> - Sound effect",
            "",
            "[Music]",
            "/music <desc> - Generate music",
            "",
            "/price - View all pricing",
          ].join("\n")
        );
        return;
      }

      default:
        break; // not a known command, treat as prompt
    }
  }

  // ==================== Default: Text-to-Image ====================

  const modelId = dbService.getSelectedModel(userId);
  const model = getModelById(modelId) || models[0]!;

  if (model.requiresImage) {
    pendingCommands.set(userId, {
      command: `prompt:${text}`,
      expiresAt: Date.now() + 120_000,
    });
    await replyText(
      replyToken,
      `Model "${model.label}" requires an image.\nSend an image now.`
    );
    return;
  }

  await generateWithModel(userId, replyToken, model, text);
}

// ==================== Helper ====================

async function generateWithModel(
  userId: string,
  replyToken: string,
  model: { id: string; label: string; creditCost: number; apiType: string },
  prompt: string,
  extraInput?: Record<string, unknown>
): Promise<void> {
  const balance = dbService.getBalance(userId);
  if (balance < model.creditCost) {
    await replyText(
      replyToken,
      `Not enough balance.\nRequired: ${model.creditCost} THB\nBalance: ${balance.toFixed(2)} THB\n\nUse /topup <amount> to top up.`
    );
    return;
  }

  // Deduct FIRST, then create task
  const spent = dbService.spend(
    userId,
    model.creditCost,
    `${model.label}: ${prompt.slice(0, 50)}`
  );

  if (!spent) {
    await replyText(replyToken, "Payment failed. Please try again.");
    return;
  }

  await replyText(
    replyToken,
    `Generating with ${model.label}... (-${model.creditCost} THB)`
  );

  try {
    const input = { prompt, ...extraInput };
    const { taskId, apiType } = await kieai.createTask(model.id, input);
    dbService.saveTask(taskId, userId, model.id, apiType, prompt);
  } catch (err) {
    console.error("Create task error:", err);
    // Refund on failure
    dbService.refund(userId, model.creditCost, `Refund: task creation failed`);
    await pushText(
      userId,
      `Generation failed. ${model.creditCost} THB refunded.`
    );
  }
}
