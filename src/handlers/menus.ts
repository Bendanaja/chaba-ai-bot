import type { messagingApi } from "@line/bot-sdk";
import { getModelsByCategory, type ModelDef } from "../models/kieai-models.js";
import { config } from "../config.js";

// ==================== Chaba Theme Colors ====================
const C = {
  pink: "#D63384",       // ชบา pink
  pinkLight: "#E685B5",  // light pink
  pinkSoft: "#FFF0F6",   // soft pink bg
  gold: "#C8A951",       // thai gold
  goldDark: "#A67C00",   // dark gold
  navy: "#1A1A2E",       // night sky
  navyLight: "#16213E",  // lighter navy
  white: "#FFFFFF",
  cream: "#FFF8F0",
  gray: "#8E8E93",
  grayLight: "#F2F2F7",
  text: "#1A1A2E",
  textSub: "#636E72",
};

const MASCOT_URL = `${config.kieai.callbackBaseUrl}/public/chaba-mascot.jpg`;

// ==================== Main Menu ====================

export function buildMainMenu(): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: "🌺 Chaba AI Menu",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          // Hero section with gradient feel
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 3,
                contents: [
                  {
                    type: "text",
                    text: "🌺 Chaba AI",
                    weight: "bold",
                    size: "xl",
                    color: C.white,
                  },
                  {
                    type: "text",
                    text: "สร้างสรรค์ผลงาน AI",
                    size: "sm",
                    color: "#FFFFFFBB",
                    margin: "sm",
                  },
                  {
                    type: "text",
                    text: "ง่ายๆ แค่กดเลือก ✨",
                    size: "xs",
                    color: "#FFFFFF88",
                  },
                ],
              },
              {
                type: "image",
                url: MASCOT_URL,
                size: "80px",
                aspectMode: "cover",
                aspectRatio: "1:1",
                flex: 1,
              },
            ],
            paddingAll: "20px",
            backgroundColor: C.pink,
          },
        ],
        paddingAll: "0px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        backgroundColor: C.cream,
        contents: [
          // Creation section
          {
            type: "text",
            text: "🎨 สร้างผลงาน",
            weight: "bold",
            size: "sm",
            color: C.text,
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              catButton("🖼 รูปภาพ", "image", C.pink),
              catButton("🎬 วิดีโอ", "video", "#E17055"),
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              catButton("🎤 เสียงพูด", "audio", "#0984E3"),
              catButton("🎵 เพลง", "music", "#6C5CE7"),
            ],
          },
          // Tools section
          {
            type: "text",
            text: "🛠 เครื่องมือ",
            weight: "bold",
            size: "sm",
            color: C.text,
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "md",
            contents: [
              toolButton("✂️ ลบพื้นหลัง", "removebg"),
              toolButton("🔍 ขยายรูป", "upscale"),
            ],
          },
        ],
        paddingAll: "16px",
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "postback",
              label: "💰 กระเป๋าเงิน",
              data: "action=menu&cmd=wallet",
              displayText: "กระเป๋าเงิน",
            },
          },
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "postback",
              label: "📋 ราคา",
              data: "action=menu&cmd=price",
              displayText: "ดูราคา",
            },
          },
        ],
        paddingAll: "12px",
        backgroundColor: C.grayLight,
      },
    },
  };
}

function catButton(label: string, cat: string, color: string): messagingApi.FlexButton {
  return {
    type: "button",
    style: "primary",
    color,
    height: "sm",
    action: {
      type: "postback",
      label,
      data: `action=menu&cat=${cat}`,
      displayText: label,
    },
  };
}

function toolButton(label: string, cmd: string): messagingApi.FlexButton {
  return {
    type: "button",
    style: "secondary",
    height: "sm",
    action: {
      type: "postback",
      label,
      data: `action=menu&cmd=${cmd}`,
      displayText: label,
    },
  };
}

// ==================== Category Model Carousel ====================

export function buildCategoryMenu(category: "image" | "video" | "audio" | "music"): messagingApi.FlexMessage {
  const catInfo: Record<string, { label: string; color: string; emoji: string }> = {
    image: { label: "รูปภาพ", color: C.pink, emoji: "🖼" },
    video: { label: "วิดีโอ", color: "#E17055", emoji: "🎬" },
    audio: { label: "เสียง", color: "#0984E3", emoji: "🎤" },
    music: { label: "เพลง", color: "#6C5CE7", emoji: "🎵" },
  };

  const info = catInfo[category]!;
  const catModels = getModelsByCategory(category);
  const filteredModels = category === "image"
    ? catModels.filter((m) => m.type === "text-to-image")
    : catModels.filter((m) => !m.requiresImage);

  const bubbles = filteredModels.map((model) =>
    buildModelCard(model, info.color, info.emoji)
  );

  return {
    type: "flex",
    altText: `${info.emoji} เลือก Model ${info.label}`,
    contents: {
      type: "carousel",
      contents: bubbles.slice(0, 10),
    },
  };
}

function buildModelCard(model: ModelDef, color: string, emoji: string): messagingApi.FlexBubble {
  const typeDesc: Record<string, string> = {
    "text-to-image": "ข้อความ → รูปภาพ",
    "image-to-image": "รูป → รูป",
    "text-to-video": "ข้อความ → วิดีโอ",
    "image-to-video": "รูป → วิดีโอ",
    "text-to-audio": "ข้อความ → เสียง",
    "text-to-music": "ข้อความ → เพลง",
    "remove-background": "ลบพื้นหลัง",
    "upscale": "ขยายความละเอียด",
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
          text: `${emoji} ${model.label}`,
          weight: "bold",
          size: "md",
          color: C.white,
          wrap: true,
        },
      ],
      backgroundColor: color,
      paddingAll: "14px",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: model.labelTh,
          size: "sm",
          weight: "bold",
          color: C.text,
        },
        {
          type: "text",
          text: typeDesc[model.type] || model.type,
          size: "xs",
          color: C.textSub,
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            {
              type: "text",
              text: `${model.creditCost}`,
              size: "xxl",
              weight: "bold",
              color,
              flex: 0,
            },
            {
              type: "text",
              text: " THB",
              size: "sm",
              color: C.textSub,
              gravity: "bottom",
              flex: 0,
              margin: "sm",
            },
          ],
        },
      ],
      paddingAll: "14px",
      backgroundColor: C.cream,
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          color,
          height: "sm",
          action: {
            type: "postback",
            label: "🌺 เลือกใช้งาน",
            data: `action=select_gen&model=${model.id}&cat=${model.category}`,
            displayText: `เลือก ${model.labelTh}`,
          },
        },
      ],
      paddingAll: "10px",
      backgroundColor: C.cream,
    },
  };
}

// ==================== Wallet Card ====================

export function buildWalletMenu(balance: number): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `💰 ${balance.toFixed(2)} THB`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "💰 กระเป๋าเงิน",
            weight: "bold",
            size: "md",
            color: C.white,
            flex: 1,
          },
          {
            type: "image",
            url: MASCOT_URL,
            size: "40px",
            aspectMode: "cover",
            aspectRatio: "1:1",
            flex: 0,
          },
        ],
        backgroundColor: C.gold,
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "ยอดคงเหลือ",
            size: "xs",
            color: C.textSub,
            align: "center",
          },
          {
            type: "text",
            text: `฿${balance.toFixed(2)}`,
            size: "3xl",
            weight: "bold",
            color: C.pink,
            align: "center",
          },
          {
            type: "text",
            text: "THB",
            size: "sm",
            color: C.textSub,
            align: "center",
          },
        ],
        paddingAll: "20px",
        backgroundColor: C.cream,
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: {
              type: "postback",
              label: "📜 ประวัติ",
              data: "action=menu&cmd=history",
              displayText: "ประวัติการใช้งาน",
            },
          },
          {
            type: "button",
            style: "primary",
            color: C.pink,
            height: "sm",
            action: {
              type: "postback",
              label: "🌺 กลับเมนู",
              data: "action=menu&cmd=main",
              displayText: "เมนูหลัก",
            },
          },
        ],
        paddingAll: "12px",
        backgroundColor: C.grayLight,
      },
    },
  };
}

// ==================== Price List ====================

export function buildPriceMenu(): messagingApi.FlexMessage {
  const categories = [
    { key: "image" as const, label: "🖼 รูปภาพ", color: C.pink },
    { key: "video" as const, label: "🎬 วิดีโอ", color: "#E17055" },
    { key: "audio" as const, label: "🎤 เสียง", color: "#0984E3" },
    { key: "music" as const, label: "🎵 เพลง", color: "#6C5CE7" },
  ];

  const bubbles: messagingApi.FlexBubble[] = categories.map(({ key, label, color }) => {
    const catModels = getModelsByCategory(key);
    const rows: messagingApi.FlexBox[] = catModels.map((m) => ({
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: m.labelTh, size: "xs", color: C.text, flex: 3, wrap: true },
        { type: "text", text: `${m.creditCost} ฿`, size: "xs", weight: "bold", color, align: "end", flex: 1 },
      ],
      margin: "sm",
    }));

    return {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: label, weight: "bold", size: "md", color: C.white },
        ],
        backgroundColor: color,
        paddingAll: "14px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: rows,
        paddingAll: "14px",
        backgroundColor: C.cream,
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color,
            height: "sm",
            action: {
              type: "postback",
              label: `${label} เลือก Model`,
              data: `action=menu&cat=${key}`,
              displayText: `เลือก Model ${label}`,
            },
          },
        ],
        paddingAll: "10px",
        backgroundColor: C.cream,
      },
    };
  });

  return {
    type: "flex",
    altText: "📋 ราคาทั้งหมด",
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}
