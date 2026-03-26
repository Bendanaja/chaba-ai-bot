import type { Request, Response } from "express";
import { pushImage, pushText, pushVideo, pushAudio } from "../services/line.js";
import * as kieai from "../services/kieai.js";
import * as dbService from "../services/database.js";
import { getModelById } from "../models/kieai-models.js";

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

    const task = dbService.getTask(taskId);
    if (!task) {
      console.error("Task not found:", taskId);
      return;
    }

    const code = body.code ?? body.data?.code;
    const isSuccess = code === 200;

    if (!isSuccess) {
      const errMsg = body.msg || body.data?.msg || "Generation failed";
      dbService.updateTaskStatus(taskId, "failed");

      // Refund on failure
      const model = getModelById(task.model);
      if (model) {
        dbService.refund(
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
      // Suno music: poll for sunoData array
      try {
        const sunoStatus = await kieai.getSunoTaskStatus(taskId);
        const sunoData = sunoStatus?.response?.sunoData;
        if (sunoData && sunoData.length > 0) {
          for (const track of sunoData) {
            if (track.audioUrl) {
              resultUrls.push(track.audioUrl);
              audioDuration = Math.max(audioDuration, (track.duration || 0) * 1000);
            }
          }
        }
      } catch (err) {
        console.error("Suno status poll error:", err);
      }
    } else if (task.api_type === "market") {
      // Market API callback doesn't include URLs directly
      // Need to poll for the actual result
      const status = await kieai.getMarketTaskStatus(taskId);
      if (status?.state === "success" && status.resultJson) {
        try {
          const result = JSON.parse(status.resultJson);
          resultUrls =
            result.resultUrls ||
            result.resultImageUrls ||
            (result.resultUrl ? [result.resultUrl] : []);

          // Some models return different field names
          if (resultUrls.length === 0) {
            // Try to find any URL-like value in the result
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
        } catch {
          console.error("Failed to parse resultJson:", status.resultJson);
        }
      }
    }

    if (resultUrls.length === 0) {
      dbService.updateTaskStatus(taskId, "failed");

      const model = getModelById(task.model);
      if (model) {
        dbService.refund(
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
    dbService.updateTaskStatus(taskId, "success", resultUrls[0]);

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

    const balance = dbService.getBalance(task.user_id);
    await pushText(
      task.user_id,
      `Done! (${model?.label || task.model})\nBalance: ${balance.toFixed(2)} THB`
    );
  } catch (err) {
    console.error("Callback processing error:", err);
  }
}
