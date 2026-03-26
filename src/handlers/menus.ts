import type { messagingApi } from "@line/bot-sdk";
import { getModelsByCategory, type ModelDef } from "../models/kieai-models.js";

// ==================== Color Palette ====================
const COLORS = {
  primary: "#6C5CE7",
  image: "#00B894",
  video: "#E17055",
  audio: "#0984E3",
  music: "#E84393",
  wallet: "#FDCB6E",
  bg: "#F8F9FA",
  textDark: "#2D3436",
  textLight: "#636E72",
};

// ==================== Main Menu ====================

export function buildMainMenu(): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: "Chaba AI Menu",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "Chaba AI",
            weight: "bold",
            size: "xl",
            color: "#FFFFFF",
          },
          {
            type: "text",
            text: "เลือกสิ่งที่ต้องการสร้าง",
            size: "sm",
            color: "#FFFFFFCC",
          },
        ],
        backgroundColor: COLORS.primary,
        paddingAll: "20px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          buildMenuRow([
            menuButton("รูปภาพ", "cat=image", COLORS.image),
            menuButton("วิดีโอ", "cat=video", COLORS.video),
          ]),
          buildMenuRow([
            menuButton("เสียงพูด", "cat=audio", COLORS.audio),
            menuButton("เพลง", "cat=music", COLORS.music),
          ]),
          buildMenuRow([
            menuButton("ลบพื้นหลัง", "cmd=removebg", "#636E72"),
            menuButton("ขยายรูป", "cmd=upscale", "#636E72"),
          ]),
          { type: "separator", margin: "lg" } as messagingApi.FlexSeparator,
          buildMenuRow([
            menuButton("กระเป๋าเงิน", "cmd=wallet", "#FDCB6E"),
            menuButton("ราคา", "cmd=price", "#A29BFE"),
          ]),
        ],
        paddingAll: "16px",
      },
    },
  };
}

function menuButton(
  label: string,
  data: string,
  color: string
): messagingApi.FlexButton {
  return {
    type: "button",
    style: "primary",
    color,
    height: "sm",
    action: {
      type: "postback",
      label,
      data: `action=menu&${data}`,
      displayText: label,
    },
  };
}

function buildMenuRow(buttons: messagingApi.FlexButton[]): messagingApi.FlexBox {
  return {
    type: "box",
    layout: "horizontal",
    spacing: "md",
    contents: buttons,
  };
}

// ==================== Category Model Selection ====================

export function buildCategoryMenu(category: "image" | "video" | "audio" | "music"): messagingApi.FlexMessage {
  const categoryLabels: Record<string, string> = {
    image: "รูปภาพ",
    video: "วิดีโอ",
    audio: "เสียง",
    music: "เพลง",
  };

  const categoryColors: Record<string, string> = {
    image: COLORS.image,
    video: COLORS.video,
    audio: COLORS.audio,
    music: COLORS.music,
  };

  const catModels = getModelsByCategory(category);
  // Filter: for image category, only show text-to-image models in the menu
  const filteredModels = category === "image"
    ? catModels.filter((m) => m.type === "text-to-image")
    : catModels.filter((m) => !m.requiresImage);

  const color = categoryColors[category] || COLORS.primary;

  const bubbles: messagingApi.FlexBubble[] = filteredModels.map((model) =>
    buildModelCard(model, color)
  );

  // Limit to 10 bubbles (LINE carousel limit)
  return {
    type: "flex",
    altText: `เลือก Model ${categoryLabels[category]}`,
    contents: {
      type: "carousel",
      contents: bubbles.slice(0, 10),
    },
  };
}

function buildModelCard(model: ModelDef, color: string): messagingApi.FlexBubble {
  const typeLabels: Record<string, string> = {
    "text-to-image": "สร้างรูปจากข้อความ",
    "image-to-image": "แก้ไขรูป",
    "text-to-video": "สร้างวิดีโอจากข้อความ",
    "image-to-video": "รูปเป็นวิดีโอ",
    "text-to-audio": "สร้างเสียง",
    "text-to-music": "สร้างเพลง",
    "remove-background": "ลบพื้นหลัง",
    "upscale": "ขยายรูป",
  };

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: model.label,
          weight: "bold",
          size: "lg",
          color: "#FFFFFF",
        },
      ],
      backgroundColor: color,
      paddingAll: "16px",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: model.labelTh,
          size: "md",
          weight: "bold",
          color: COLORS.textDark,
        },
        {
          type: "text",
          text: typeLabels[model.type] || model.type,
          size: "xs",
          color: COLORS.textLight,
        },
        {
          type: "text",
          text: `${model.creditCost} THB`,
          size: "xl",
          weight: "bold",
          color,
          margin: "md",
        },
      ],
      paddingAll: "16px",
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          color,
          action: {
            type: "postback",
            label: "เลือก",
            data: `action=select_gen&model=${model.id}&cat=${model.category}`,
            displayText: `เลือก ${model.labelTh}`,
          },
        },
      ],
      paddingAll: "12px",
    },
  };
}

// ==================== Wallet Menu ====================

export function buildWalletMenu(balance: number): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `กระเป๋าเงิน: ${balance.toFixed(2)} THB`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "กระเป๋าเงิน",
            weight: "bold",
            size: "lg",
            color: "#FFFFFF",
          },
        ],
        backgroundColor: "#FDCB6E",
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: `${balance.toFixed(2)} THB`,
            size: "xxl",
            weight: "bold",
            color: COLORS.textDark,
            align: "center",
          },
          {
            type: "text",
            text: "ยอดคงเหลือ",
            size: "sm",
            color: COLORS.textLight,
            align: "center",
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "secondary",
            action: {
              type: "postback",
              label: "ประวัติ",
              data: "action=menu&cmd=history",
              displayText: "ประวัติการใช้งาน",
            },
          },
          {
            type: "button",
            style: "primary",
            color: COLORS.primary,
            action: {
              type: "postback",
              label: "กลับเมนู",
              data: "action=menu&cmd=main",
              displayText: "เมนูหลัก",
            },
          },
        ],
        paddingAll: "12px",
      },
    },
  };
}
