import type { webhook } from "@line/bot-sdk";
import { replyText, replyMessage, pushText, pushMessage } from "../services/line.js";
import * as dbService from "../services/database.js";
import { getModelById, models, getModelsByCategory } from "../models/kieai-models.js";
import {
  buildMainMenu,
  buildCategoryMenu,
  buildWalletMenu,
  buildPriceMenu,
} from "./menus.js";
import {
  startSession,
  getSession,
  getStepsForCommand,
  getCurrentStepMessage,
  clearSession,
} from "./session.js";
import { executeGeneration } from "./text-message.js";

export async function handlePostback(event: webhook.PostbackEvent): Promise<void> {
  const userId = event.source?.userId;
  if (!userId) return;

  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");
  const replyToken = event.replyToken!;

  await dbService.getOrCreateUser(userId);

  switch (action) {
    // ==================== Menu Navigation ====================
    case "menu": {
      const cat = params.get("cat");
      const cmd = params.get("cmd");

      if (cat) {
        // Show category model selection
        const menu = buildCategoryMenu(cat as "image" | "video" | "audio" | "music");
        await replyMessage(replyToken, menu);
        return;
      }

      if (cmd === "main") {
        await replyMessage(replyToken, buildMainMenu());
        return;
      }

      if (cmd === "wallet") {
        const balance = await dbService.getBalance(userId);
        await replyMessage(replyToken, buildWalletMenu(balance));
        return;
      }

      if (cmd === "history") {
        const txns = await dbService.getTransactions(userId, 10);
        if (txns.length === 0) {
          await replyText(replyToken, "ยังไม่มีประวัติ");
          return;
        }
        const lines = txns.map(
          (t) =>
            `${t.type === "topup" ? "+" : t.type === "refund" ? "+" : "-"}${t.amount} THB - ${t.description || t.type}`
        );
        await replyText(replyToken, `ประวัติ:\n${lines.join("\n")}`);
        return;
      }

      if (cmd === "price") {
        await replyMessage(replyToken, buildPriceMenu());
        return;
      }

      if (cmd === "removebg") {
        // Start removebg flow - ask for image
        await replyText(replyToken, "ส่งรูปที่ต้องการลบพื้นหลังมาเลย");
        // Set pending command
        const { pendingCommands } = await import("./text-message.js").then(m => ({ pendingCommands: (m as any).__pendingCommands })).catch(() => ({ pendingCommands: null }));
        // Use the exported function approach
        startSession(userId, {
          command: "removebg_wait",
          modelId: "recraft/remove-background",
          params: {},
          steps: [],
        });
        return;
      }

      if (cmd === "upscale") {
        await replyText(replyToken, "ส่งรูปที่ต้องการขยายมาเลย");
        startSession(userId, {
          command: "upscale_wait",
          modelId: "topaz/image-upscale",
          params: {},
          steps: [],
        });
        return;
      }

      break;
    }

    // ==================== Select Model & Start Generation ====================
    case "select_gen": {
      const modelId = params.get("model");
      const cat = params.get("cat");
      if (!modelId) return;

      const model = getModelById(modelId);
      if (!model) {
        await replyText(replyToken, "ไม่พบ Model");
        return;
      }

      // Save as selected model
      await dbService.setSelectedModel(userId, modelId);

      // Determine command type from category
      let command: string;
      switch (cat) {
        case "video": command = "video"; break;
        case "audio": command = "audio"; break;
        case "music": command = "music"; break;
        default: command = "image"; break;
      }

      // Special handling for sound effects
      if (modelId.includes("sound-effect")) {
        command = "sfx";
      }

      // Start interactive session
      const steps = getStepsForCommand(command, modelId);
      if (steps.length === 0) {
        await replyText(replyToken, `เลือก ${model.labelTh} แล้ว\nพิมพ์ข้อความเพื่อสร้างได้เลย`);
        return;
      }

      const session = startSession(userId, {
        command,
        modelId,
        params: {},
        steps,
      });

      const msg = getCurrentStepMessage(session);
      if (msg) {
        await replyMessage(replyToken, msg);
      }
      return;
    }

    // ==================== Session Option Selection ====================
    case "session_opt": {
      const key = params.get("key");
      const value = params.get("value");
      const session = getSession(userId);

      if (!session || !key || !value) return;

      session.params[key] = value;
      session.stepIndex++;

      if (session.stepIndex >= session.steps.length) {
        // All params collected, generate
        await executeSessionFromPostback(userId, replyToken, session);
        clearSession(userId);
        return;
      }

      const msg = getCurrentStepMessage(session);
      if (msg) {
        await replyMessage(replyToken, msg);
      }
      return;
    }

    // ==================== Legacy: Direct Model Select ====================
    case "select_model": {
      const modelId = params.get("model");
      if (!modelId) return;
      const model = getModelById(modelId);
      if (!model) {
        await replyText(replyToken, "ไม่พบ Model");
        return;
      }
      await dbService.setSelectedModel(userId, model.id);
      await replyText(
        replyToken,
        `Model: ${model.label}\nราคา: ${model.creditCost} THB/ครั้ง`
      );
      break;
    }

    case "check_balance": {
      const balance = await dbService.getBalance(userId);
      await replyMessage(replyToken, buildWalletMenu(balance));
      break;
    }

    case "show_models": {
      await replyMessage(replyToken, buildMainMenu());
      break;
    }

    default:
      break;
  }
}

async function executeSessionFromPostback(
  userId: string,
  replyToken: string,
  session: { command: string; modelId: string; params: Record<string, unknown> }
): Promise<void> {
  const model = getModelById(session.modelId);
  if (!model) {
    await replyText(replyToken, "ไม่พบ Model");
    return;
  }

  const prompt = (session.params["prompt"] || session.params["text"] || "") as string;
  const extraInput = { ...session.params };

  // Convert string booleans
  for (const [k, v] of Object.entries(extraInput)) {
    if (v === "true") extraInput[k] = true;
    if (v === "false") extraInput[k] = false;
  }

  // Convert string numbers
  for (const numKey of ["speed", "duration_seconds", "prompt_influence", "stability", "similarity_boost"]) {
    if (typeof extraInput[numKey] === "string") {
      extraInput[numKey] = parseFloat(extraInput[numKey] as string);
    }
  }

  await executeGeneration(userId, replyToken, model, prompt, extraInput);
}
