import type { Request, Response } from "express";
import { pushImage, pushText, pushVideo, pushAudio, pushMessage } from "../services/line.js";
import * as kieai from "../services/kieai.js";
import * as dbService from "../services/database.js";
import { getModelById } from "../models/kieai-models.js";
import { buildReceiptButton } from "../handlers/menus.js";

export async function kieaiCallbackHandler(
  req: Request,
  res: Response
): Promise<void> {
  res.status(200).json({ status: "received" });

  const body = req.body;
  console.log("Kie.ai callback:", JSON.stringify(body, null, 2));

  try {
    // Extract taskId from different callback formats
    const taskId =
      body.taskId ||
      body.data?.taskId ||
      body.data?.task_id;

    if (!taskId) {
      console.error("No taskId in callback body");
      return;
    }

    const task = await dbService.getTask(taskId);
    if (!task) {
      console.error("Task not found:", taskId);
      return;
    }

    // Skip if already processed (prevent double-callback)
    if (task.status === "success" || task.status === "failed") {
      console.log("Task already processed:", taskId, task.status);
      return;
    }

    // Suno sends intermediate callbacks before all tracks are ready:
    //   "text"  — lyrics generated, no audio yet
    //   "first" — first track ready, second still processing
    //   "complete" — all tracks ready (what we want)
    // Skip text/first to avoid marking task done early and missing the 2nd track.
    const callbackType = body.data?.callbackType;
    if (task.api_type === "suno" && (callbackType === "text" || callbackType === "first")) {
      console.log(`Suno ${callbackType} callback — skipping, waiting for complete`);
      return;
    }

    const code = body.code ?? body.data?.code;
    const isSuccess = code === 200;

    if (!isSuccess) {
      const errMsg = body.msg || body.data?.msg || "Generation failed";
      await dbService.updateTaskStatus(taskId, "failed");

      // Refund on failure
      const model = getModelById(task.model);
      if (model) {
        await dbService.refund(
          task.user_id,
          model.creditCost,
          `Refund: ${errMsg.slice(0, 50)}`,
          taskId
        );
      }

      await pushText(
        task.user_id,
        `Generation failed: ${errMsg}\nYour balance has been refunded.`
      );
      return;
    }

    // Extract result URLs based on API type
    let resultUrls: string[] = [];
    let audioDuration = 0;

    if (task.api_type === "gpt4o") {
      // GPT-4o callback: data.info.result_urls
      resultUrls = body.data?.info?.result_urls || [];
    } else if (task.api_type === "suno") {
      // Suno callback includes audio data directly (snake_case fields)
      // Format: { data: { data: [{ audio_url, image_url, title, duration }] } }
      const sunoTracks = body.data?.data;
      if (Array.isArray(sunoTracks)) {
        for (const track of sunoTracks) {
          const url = track.audio_url || track.audioUrl;
          if (url) {
            resultUrls.push(url);
            audioDuration = Math.max(audioDuration, (track.duration || 0) * 1000);
          }
        }
      }

      // Fallback: poll if callback didn't include data
      if (resultUrls.length === 0) {
        for (let attempt = 0; attempt < 3 && resultUrls.length === 0; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 5000));
          try {
            const sunoStatus = await kieai.getSunoTaskStatus(taskId);
            console.log("Suno poll attempt", attempt + 1, JSON.stringify(sunoStatus));
            const sunoData = sunoStatus?.response?.sunoData;
            if (sunoData && sunoData.length > 0) {
              for (const track of sunoData) {
                const url = (track as any).audio_url || track.audioUrl;
                if (url) {
                  resultUrls.push(url);
                  audioDuration = Math.max(audioDuration, (track.duration || 0) * 1000);
                }
              }
            }
          } catch (err) {
            console.error("Suno poll error:", err);
          }
        }
      }
    } else if (task.api_type === "market") {
      // Market API: poll for result (retry up to 3 times with delay)
      for (let attempt = 0; attempt < 3 && resultUrls.length === 0; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
        try {
          const status = await kieai.getMarketTaskStatus(taskId);
          console.log("Market status attempt", attempt + 1, "state:", status?.state);
          if (status?.state === "success" && status.resultJson) {
            const result = JSON.parse(status.resultJson);
            resultUrls =
              result.resultUrls ||
              result.resultImageUrls ||
              (result.resultUrl ? [result.resultUrl] : []);

            // Some models return different field names
            if (resultUrls.length === 0) {
              for (const val of Object.values(result)) {
                if (typeof val === "string" && val.startsWith("http")) {
                  resultUrls.push(val);
                } else if (Array.isArray(val)) {
                  for (const item of val) {
                    if (typeof item === "string" && item.startsWith("http")) {
                      resultUrls.push(item);
                    }
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Market status poll error (attempt " + (attempt + 1) + "):", err);
        }
      }
    }

    if (resultUrls.length === 0) {
      await dbService.updateTaskStatus(taskId, "failed");

      const model = getModelById(task.model);
      if (model) {
        await dbService.refund(
          task.user_id,
          model.creditCost,
          "Refund: No result",
          taskId
        );
      }

      await pushText(
        task.user_id,
        "Generation completed but no result was returned.\nYour balance has been refunded."
      );
      return;
    }

    // Send results to user
    await dbService.updateTaskStatus(taskId, "success", resultUrls[0]);

    const model = getModelById(task.model);
    const modelType = model?.type || "text-to-image";

    for (const url of resultUrls) {
      // Determine content type from URL or model type
      if (url.match(/\.(mp4|mov|webm)(\?|$)/i) || modelType === "text-to-video" || modelType === "image-to-video") {
        await pushText(task.user_id, `🎬 Video: ${url}`);
      } else if (url.match(/\.(mp3|wav|ogg|m4a)(\?|$)/i) || modelType === "text-to-audio" || modelType === "text-to-music") {
        if (audioDuration > 0) {
          try {
            await pushAudio(task.user_id, url, audioDuration);
          } catch {
            await pushText(task.user_id, `🎵 Audio: ${url}`);
          }
        } else {
          await pushText(task.user_id, `🎵 Audio: ${url}`);
        }
      } else {
        await pushImage(task.user_id, url);
      }
    }

    const balance = await dbService.getBalance(task.user_id);
    await pushText(
      task.user_id,
      `Done! (${model?.label || task.model})\nBalance: ${balance.toFixed(2)} THB`
    );

    // Send receipt request button
    await pushMessage(task.user_id, buildReceiptButton(taskId));
  } catch (err) {
    console.error("Callback processing error:", err);
  }
}
