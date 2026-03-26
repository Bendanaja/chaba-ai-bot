import type { webhook } from "@line/bot-sdk";
import { replyText } from "../services/line.js";
import * as dbService from "../services/database.js";
import { getModelById, models } from "../models/kieai-models.js";

export async function handlePostback(event: webhook.PostbackEvent): Promise<void> {
  const userId = event.source?.userId;
  if (!userId) return;

  const params = new URLSearchParams(event.postback.data);
  const action = params.get("action");
  const replyToken = event.replyToken!;

  dbService.getOrCreateUser(userId);

  switch (action) {
    case "select_model": {
      const modelId = params.get("model");
      if (!modelId) return;
      const model = getModelById(modelId);
      if (!model) {
        await replyText(replyToken, "Model not found.");
        return;
      }
      dbService.setSelectedModel(userId, model.id);
      await replyText(
        replyToken,
        `Model: ${model.label}\nCost: ${model.creditCost} THB/gen`
      );
      break;
    }

    case "check_balance": {
      const balance = dbService.getBalance(userId);
      await replyText(replyToken, `Wallet: ${balance.toFixed(2)} THB`);
      break;
    }

    case "show_models": {
      const current = dbService.getSelectedModel(userId);
      const lines = models.map(
        (m) =>
          `${m.id === current ? ">" : " "} ${m.labelTh} (${m.creditCost} THB)`
      );
      await replyText(
        replyToken,
        `Models:\n${lines.join("\n")}\n\nUse /model <id> to switch.`
      );
      break;
    }

    default:
      break;
  }
}
