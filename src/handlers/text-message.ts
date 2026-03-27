import type { webhook } from "@line/bot-sdk";
import { replyText, pushText, replyMessage } from "../services/line.js";
import * as kieai from "../services/kieai.js";
import * as dbService from "../services/database.js";
import {
  getModelById,
  getModelsByCategory,
  models,
} from "../models/kieai-models.js";
import {
  getSession,
  startSession,
  clearSession,
  getStepsForCommand,
  getCurrentStepMessage,
  type Session,
} from "./session.js";
import { buildMainMenu } from "./menus.js";

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

  await dbService.getOrCreateUser(userId);

  // ==================== Cancel ====================
  if (text === "/cancel" || text === "ยกเลิก") {
    const session = getSession(userId);
    if (session) {
      clearSession(userId);
      await replyText(replyToken, "ยกเลิกแล้ว");
      return;
    }
  }

  // ==================== Show Menu on Greeting ====================
  const greetings = ["เมนู", "menu", "สวัสดี", "hi", "hello", "start"];
  if (greetings.includes(text.toLowerCase())) {
    clearSession(userId);
    await replyMessage(replyToken, buildMainMenu());
    return;
  }

  // ==================== Active Session ====================
  const session = getSession(userId);
  if (session) {
    await handleSessionInput(userId, replyToken, session, text);
    return;
  }

  // ==================== Commands ====================

  if (text.startsWith("/")) {
    const parts = text.split(/\s+/);
    const cmd = parts[0]!.toLowerCase();
    const restText = parts.slice(1).join(" ");

    switch (cmd) {
      case "/menu":
      case "/start": {
        await replyMessage(replyToken, buildMainMenu());
        return;
      }

      case "/myid": {
        await replyText(replyToken, `Your User ID:\n${userId}`);
        return;
      }

      case "/balance":
      case "/wallet": {
        const balance = await dbService.getBalance(userId);
        await replyText(replyToken, `Wallet: ${balance.toFixed(2)} THB`);
        return;
      }

      case "/topup": {
        const adminIds = (process.env["ADMIN_USER_IDS"] || "").split(",");
        if (!adminIds.includes(userId)) {
          await replyText(
            replyToken,
            "Contact admin to top up your wallet.\nTransfer via PromptPay then send slip."
          );
          return;
        }
        const amount = parseFloat(parts[1] || "0");
        if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
          await replyText(replyToken, "Usage: /topup <amount>\nMax: 100,000 THB");
          return;
        }
        const targetUserId = parts[2] || userId;
        await dbService.getOrCreateUser(targetUserId);
        const newBalance = await dbService.topUp(targetUserId, amount);
        await replyText(
          replyToken,
          `Top up +${amount} THB\nUser: ${targetUserId === userId ? "you" : targetUserId}\nBalance: ${newBalance.toFixed(2)} THB`
        );
        return;
      }

      case "/history": {
        const txns = await dbService.getTransactions(userId, 10);
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
          await dbService.setSelectedModel(userId, model.id);
          await replyText(
            replyToken,
            `Model: ${model.label} (${model.creditCost} THB/gen)`
          );
          return;
        }

        const current = await dbService.getSelectedModel(userId);
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
        await replyText(replyToken, `ส่งรูปมาเลย (${cmd})`);
        return;
      }

      case "/video": {
        const modelId = "kling-2.6/text-to-video";
        const steps = getStepsForCommand("video", modelId);
        if (restText) {
          // User provided prompt inline, skip prompt step
          const s = startSession(userId, { command: "video", modelId, params: { prompt: restText }, steps });
          s.stepIndex = 1; // skip prompt step
          const msg = getCurrentStepMessage(s);
          if (msg) {
            await replyMessage(replyToken, msg);
          }
        } else {
          startSession(userId, { command: "video", modelId, params: {}, steps });
          const s = getSession(userId)!;
          const msg = getCurrentStepMessage(s);
          if (msg) {
            await replyMessage(replyToken, msg);
          }
        }
        return;
      }

      case "/audio":
      case "/tts": {
        const modelId = "elevenlabs/text-to-speech-turbo-2-5";
        const steps = getStepsForCommand("audio", modelId);
        if (restText) {
          const s = startSession(userId, { command: "audio", modelId, params: { text: restText }, steps });
          s.stepIndex = 1;
          const msg = getCurrentStepMessage(s);
          if (msg) {
            await replyMessage(replyToken, msg);
          }
        } else {
          startSession(userId, { command: "audio", modelId, params: {}, steps });
          const s = getSession(userId)!;
          const msg = getCurrentStepMessage(s);
          if (msg) {
            await replyMessage(replyToken, msg);
          }
        }
        return;
      }

      case "/sfx": {
        const modelId = "elevenlabs/sound-effect-v2";
        const steps = getStepsForCommand("sfx", modelId);
        if (restText) {
          const s = startSession(userId, { command: "sfx", modelId, params: { text: restText }, steps });
          s.stepIndex = 1;
          const msg = getCurrentStepMessage(s);
          if (msg) {
            await replyMessage(replyToken, msg);
          }
        } else {
          startSession(userId, { command: "sfx", modelId, params: {}, steps });
          const s = getSession(userId)!;
          const msg = getCurrentStepMessage(s);
          if (msg) {
            await replyMessage(replyToken, msg);
          }
        }
        return;
      }

      case "/music": {
        const modelId = "suno/v4.5";
        const steps = getStepsForCommand("music", modelId);
        if (restText) {
          const s = startSession(userId, { command: "music", modelId, params: { prompt: restText }, steps });
          s.stepIndex = 1;
          const msg = getCurrentStepMessage(s);
          if (msg) {
            await replyMessage(replyToken, msg);
          }
        } else {
          startSession(userId, { command: "music", modelId, params: {}, steps });
          const s = getSession(userId)!;
          const msg = getCurrentStepMessage(s);
          if (msg) {
            await replyMessage(replyToken, msg);
          }
        }
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
            "=== คำสั่ง ===",
            "",
            "[กระเป๋าเงิน]",
            "/wallet - ดูยอดเงิน",
            "/topup <จำนวน> - เติมเงิน",
            "/history - ประวัติ",
            "",
            "[รูปภาพ]",
            "พิมพ์ข้อความ = สร้างรูป",
            "ส่งรูป = แก้ไขรูป",
            "/model - ดู/เปลี่ยน model",
            "/removebg - ลบพื้นหลัง",
            "/upscale - ขยายรูป",
            "",
            "[วิดีโอ]",
            "/video - สร้างวิดีโอ",
            "",
            "[เสียง]",
            "/audio - สร้างเสียงพูด",
            "/sfx - สร้างเสียงเอฟเฟกต์",
            "",
            "[เพลง]",
            "/music - สร้างเพลง",
            "",
            "/price - ดูราคา",
            "/cancel - ยกเลิก",
          ].join("\n")
        );
        return;
      }

      default:
        break;
    }
  }

  // ==================== Default: Text-to-Image (Interactive) ====================

  const modelId = await dbService.getSelectedModel(userId);
  const model = getModelById(modelId) || models[0]!;

  if (model.requiresImage) {
    pendingCommands.set(userId, {
      command: `prompt:${text}`,
      expiresAt: Date.now() + 120_000,
    });
    await replyText(
      replyToken,
      `Model "${model.label}" ต้องการรูปภาพ\nส่งรูปมาเลย`
    );
    return;
  }

  // Start image session with prompt pre-filled, ask for aspect ratio
  const steps = getStepsForCommand("image", modelId);
  if (steps.length > 1) {
    // Has options to ask (e.g., aspect_ratio)
    const s = startSession(userId, {
      command: "image",
      modelId,
      params: { prompt: text },
      steps,
    });
    s.stepIndex = 1; // skip prompt step since user already typed it
    const msg = getCurrentStepMessage(s);
    if (msg) {
      await replyMessage(replyToken, msg);
    }
  } else {
    // No extra options, generate directly
    await executeGeneration(userId, replyToken, model, text, {});
  }
}

// ==================== Session Handler ====================

async function handleSessionInput(
  userId: string,
  replyToken: string,
  session: Session,
  text: string
): Promise<void> {
  const step = session.steps[session.stepIndex];
  if (!step) {
    clearSession(userId);
    return;
  }

  // Handle skip for optional steps
  const isSkip = step.optional && (text === "ข้าม" || text.toLowerCase() === "skip");
  if (!isSkip) {
    // Validate select options
    if (step.type === "select" && step.options) {
      const valid = step.options.find(
        (o) => o.value === text || o.label === text
      );
      if (valid) {
        session.params[step.key] = valid.value;
      } else {
        // Accept the raw text if it looks reasonable
        session.params[step.key] = text;
      }
    } else {
      session.params[step.key] = text;
    }
  }

  // Advance to next step
  session.stepIndex++;

  // Check if all steps done
  if (session.stepIndex >= session.steps.length) {
    await executeSessionGeneration(userId, replyToken, session);
    clearSession(userId);
    return;
  }

  // Ask next question
  const msg = getCurrentStepMessage(session);
  if (msg) {
    await replyMessage(replyToken, msg);
  }
}

// ==================== Execute Generation ====================

async function executeSessionGeneration(
  userId: string,
  replyToken: string,
  session: Session
): Promise<void> {
  const model = getModelById(session.modelId);
  if (!model) {
    await replyText(replyToken, "Model not found.");
    return;
  }

  const prompt = (session.params["prompt"] || session.params["text"] || "") as string;
  const extraInput = { ...session.params };

  // Convert string booleans
  for (const [k, v] of Object.entries(extraInput)) {
    if (v === "true") extraInput[k] = true;
    if (v === "false") extraInput[k] = false;
  }

  // Convert string numbers for specific keys
  for (const numKey of ["speed", "duration_seconds", "prompt_influence", "stability", "similarity_boost"]) {
    if (typeof extraInput[numKey] === "string") {
      extraInput[numKey] = parseFloat(extraInput[numKey] as string);
    }
  }

  await executeGeneration(userId, replyToken, model, prompt, extraInput);
}

export async function executeGeneration(
  userId: string,
  replyToken: string,
  model: { id: string; label: string; creditCost: number; apiType: string },
  prompt: string,
  extraInput: Record<string, unknown>
): Promise<void> {
  const balance = await dbService.getBalance(userId);
  if (balance < model.creditCost) {
    await replyText(
      replyToken,
      `ยอดเงินไม่พอ\nต้องการ: ${model.creditCost} THB\nคงเหลือ: ${balance.toFixed(2)} THB\n\nใช้ /topup <จำนวน> เพื่อเติมเงิน`
    );
    return;
  }

  const spent = await dbService.spend(
    userId,
    model.creditCost,
    `${model.label}: ${prompt.slice(0, 50)}`
  );

  if (!spent) {
    await replyText(replyToken, "ชำระเงินล้มเหลว ลองใหม่อีกครั้ง");
    return;
  }

  await replyText(
    replyToken,
    `กำลังสร้างด้วย ${model.label}... (-${model.creditCost} THB)`
  );

  try {
    const input = { prompt, ...extraInput };
    const { taskId, apiType } = await kieai.createTask(model.id, input);
    await dbService.saveTask(taskId, userId, model.id, apiType, prompt);
  } catch (err) {
    console.error("Create task error:", err);
    await dbService.refund(userId, model.creditCost, `Refund: task creation failed`);
    await pushText(
      userId,
      `สร้างไม่สำเร็จ คืนเงิน ${model.creditCost} THB`
    );
  }
}
