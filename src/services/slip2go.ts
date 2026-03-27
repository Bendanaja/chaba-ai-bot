import axios from "axios";
import FormData from "form-data";
import { config } from "../config.js";

export type SlipError = "fake" | "not_found" | "expired" | "duplicate" | "api_error";

export interface SlipVerifyResult {
  success: true;
  slipId: string;
  amount: number;
  dateTime: Date;
}

export interface SlipVerifyFailure {
  success: false;
  error: SlipError;
  message: string;
}

export type SlipResult = SlipVerifyResult | SlipVerifyFailure;

const MAX_RETRIES = 2;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export async function verifySlip(imageBuffer: Buffer): Promise<SlipResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const formData = new FormData();
      formData.append("file", imageBuffer, {
        filename: "slip.jpg",
        contentType: "image/jpeg",
      });

      const response = await axios.post(
        "https://connect.slip2go.com/api/verify-slip/qr-image/info",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${config.payment.slip2goToken}`,
          },
          timeout: 15000,
        }
      );

      // Fake slip
      if (response.data.code === "200500") {
        return { success: false, error: "fake", message: "สลิปปลอมหรือไม่ถูกต้อง" };
      }

      // Not found
      if (response.data.code === "200404") {
        return { success: false, error: "not_found", message: "ไม่พบข้อมูลสลิปในรูปนี้" };
      }

      const slip = response.data.data;
      if (!slip) {
        return { success: false, error: "not_found", message: "ไม่พบข้อมูลสลิปในรูปนี้" };
      }

      // Parse slip data
      const slipId = slip.transRef;
      const amount = parseFloat(slip.amount);
      const dateTime = new Date(slip.dateTime || slip.transTimestamp);

      // Check expiry (12 hours)
      if (Date.now() - dateTime.getTime() > TWELVE_HOURS_MS) {
        return { success: false, error: "expired", message: "สลิปเก่าเกิน 12 ชั่วโมงแล้วค่ะ" };
      }

      return { success: true, slipId, amount, dateTime };
    } catch (err: unknown) {
      lastError = err;

      // Retry on timeout errors
      const isTimeout =
        axios.isAxiosError(err) &&
        (err.code === "ETIMEDOUT" || err.code === "ECONNABORTED");

      // Also handle HTTP 404
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return { success: false, error: "not_found", message: "ไม่พบข้อมูลสลิปในรูปนี้" };
      }

      if (!isTimeout || attempt === MAX_RETRIES) {
        break;
      }
    }
  }

  console.error("Slip verification failed:", lastError);
  return { success: false, error: "api_error", message: "ไม่สามารถตรวจสอบสลิปได้ กรุณาลองใหม่" };
}
