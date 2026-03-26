import type { Request, Response } from "express";
import type { webhook } from "@line/bot-sdk";
import { handleTextMessage } from "../handlers/text-message.js";
import { handleImageMessage } from "../handlers/image-message.js";
import { handlePostback } from "../handlers/postback.js";
import { pushMessage } from "../services/line.js";
import { buildMainMenu } from "../handlers/menus.js";
import * as dbService from "../services/database.js";

async function handleEvent(event: webhook.Event): Promise<void> {
  switch (event.type) {
    case "message": {
      const msg = event.message;
      if (msg.type === "text") {
        await handleTextMessage(event as any);
      } else if (msg.type === "image") {
        await handleImageMessage(event as any);
      }
      break;
    }
    case "postback": {
      await handlePostback(event);
      break;
    }
    case "follow": {
      // New friend added — send welcome menu
      const userId = event.source?.userId;
      if (userId) {
        dbService.getOrCreateUser(userId);
        await pushMessage(userId, buildMainMenu());
      }
      break;
    }
    default:
      break;
  }
}

export async function lineWebhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  const events: webhook.Event[] = req.body.events;

  // Return 200 immediately
  res.status(200).json({ status: "ok" });

  // Process events async
  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      console.error("Event handler error:", err);
    }
  }
}
