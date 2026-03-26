import type { messagingApi } from "@line/bot-sdk";
import { getModelsByCategory, type ModelDef } from "../models/kieai-models.js";
import { config } from "../config.js";

// ==================== Chaba Theme ====================
const C = {
  pink: "#D63384",
  pinkDark: "#B5246B",
  pinkLight: "#F8BBD9",
  gold: "#C8A951",
  goldDark: "#9B7E2E",
  cream: "#FFF8F0",
  white: "#FFFFFF",
  text: "#2D2D3A",
  textSub: "#7A7A8E",
  shadow: "#00000011",
};

const MASCOT = `${config.kieai.callbackBaseUrl}/public/chaba-mascot.jpg`;

// ==================== Main Menu ====================

export function buildMainMenu(): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: "🌺 Chaba AI — เลือกสิ่งที่ต้องการสร้าง",
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            flex: 4,
            contents: [
              { type: "text", text: "🌺 Chaba AI", weight: "bold", size: "xxl", color: C.white },
              { type: "text", text: "สวัสดีค่า~ เลือกสิ่งที่", size: "sm", color: "#FFFFFFCC", margin: "md" },
              { type: "text", text: "อยากสร้างได้เลยนะคะ ✨", size: "sm", color: "#FFFFFFCC" },
            ],
            justifyContent: "center",
          },
          {
            type: "box",
            layout: "vertical",
            flex: 2,
            contents: [
              {
                type: "image",
                url: MASCOT,
                size: "full",
                aspectMode: "cover",
                aspectRatio: "1:1",
              },
            ],
            cornerRadius: "100px",
            width: "80px",
            height: "80px",
          },
        ],
        paddingAll: "20px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#D63384",
          endColor: "#6C5CE7",
        },
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "lg",
        contents: [
          // ---- Create Section ----
          sectionTitle("✨ สร้างผลงาน"),
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              mainCatCard("🖼", "รูปภาพ", "3-8 ฿", "image", "#D63384", "#FF6B9D"),
              mainCatCard("🎬", "วิดีโอ", "15-22 ฿", "video", "#E17055", "#FF9A76"),
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              mainCatCard("🎤", "เสียงพูด", "4-5 ฿", "audio", "#0984E3", "#48C6EF"),
              mainCatCard("🎵", "เพลง", "10 ฿", "music", "#6C5CE7", "#A78BFA"),
            ],
          },

          // ---- Tools Section ----
          sectionTitle("🛠 เครื่องมือแต่งรูป"),
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              toolCard("✂️", "ลบพื้นหลัง", "3 ฿", "removebg"),
              toolCard("🔍", "ขยายรูป", "4 ฿", "upscale"),
            ],
          },
        ],
        paddingAll: "16px",
        backgroundColor: C.cream,
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          footerBtn("💰 กระเป๋าเงิน", "wallet"),
          footerBtn("📋 ราคาทั้งหมด", "price"),
        ],
        paddingAll: "12px",
        backgroundColor: "#F0E6FF",
      },
    },
  };
}

function sectionTitle(text: string): messagingApi.FlexText {
  return { type: "text", text, weight: "bold", size: "sm", color: C.text };
}

function mainCatCard(emoji: string, label: string, price: string, cat: string, colorStart: string, colorEnd: string): messagingApi.FlexBox {
  return {
    type: "box",
    layout: "vertical",
    flex: 1,
    contents: [
      { type: "text", text: emoji, size: "xxl", align: "center" },
      { type: "text", text: label, weight: "bold", size: "md", align: "center", color: C.white, margin: "sm" },
      { type: "text", text: price, size: "xs", align: "center", color: "#FFFFFFAA" },
    ],
    paddingAll: "14px",
    cornerRadius: "12px",
    background: {
      type: "linearGradient",
      angle: "135deg",
      startColor: colorStart,
      endColor: colorEnd,
    },
    action: {
      type: "postback",
      label,
      data: `action=menu&cat=${cat}`,
      displayText: `${emoji} ${label}`,
    },
  };
}

function toolCard(emoji: string, label: string, price: string, cmd: string): messagingApi.FlexBox {
  return {
    type: "box",
    layout: "horizontal",
    flex: 1,
    contents: [
      { type: "text", text: emoji, size: "xl", flex: 0, gravity: "center" },
      {
        type: "box",
        layout: "vertical",
        flex: 1,
        contents: [
          { type: "text", text: label, size: "sm", weight: "bold", color: C.text },
          { type: "text", text: price, size: "xs", color: C.textSub },
        ],
        margin: "md",
      },
    ],
    paddingAll: "12px",
    cornerRadius: "10px",
    backgroundColor: C.white,
    borderWidth: "1px",
    borderColor: "#E8E8F0",
    action: {
      type: "postback",
      label,
      data: `action=menu&cmd=${cmd}`,
      displayText: `${emoji} ${label}`,
    },
  };
}

function footerBtn(label: string, cmd: string): messagingApi.FlexButton {
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
  const info: Record<string, { label: string; emoji: string; s: string; e: string }> = {
    image: { label: "รูปภาพ", emoji: "🖼", s: "#D63384", e: "#FF6B9D" },
    video: { label: "วิดีโอ", emoji: "🎬", s: "#E17055", e: "#FF9A76" },
    audio: { label: "เสียง", emoji: "🎤", s: "#0984E3", e: "#48C6EF" },
    music: { label: "เพลง", emoji: "🎵", s: "#6C5CE7", e: "#A78BFA" },
  };

  const { label, emoji, s, e } = info[category]!;
  const catModels = getModelsByCategory(category);
  const filtered = category === "image"
    ? catModels.filter((m) => m.type === "text-to-image")
    : catModels.filter((m) => !m.requiresImage);

  const bubbles = filtered.map((m) => modelCard(m, emoji, s, e));

  return {
    type: "flex",
    altText: `${emoji} เลือก Model ${label}`,
    contents: { type: "carousel", contents: bubbles.slice(0, 10) },
  };
}

function modelCard(model: ModelDef, emoji: string, colorStart: string, colorEnd: string): messagingApi.FlexBubble {
  const typeMap: Record<string, string> = {
    "text-to-image": "✏️ ข้อความ → รูป",
    "text-to-video": "✏️ ข้อความ → วิดีโอ",
    "image-to-video": "🖼 รูป → วิดีโอ",
    "text-to-audio": "✏️ ข้อความ → เสียง",
    "text-to-music": "✏️ ข้อความ → เพลง",
  };

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: `${emoji} ${model.label}`, weight: "bold", size: "md", color: C.white, wrap: true },
        { type: "text", text: typeMap[model.type] || model.type, size: "xs", color: "#FFFFFFAA", margin: "sm" },
      ],
      paddingAll: "16px",
      background: {
        type: "linearGradient",
        angle: "135deg",
        startColor: colorStart,
        endColor: colorEnd,
      },
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        { type: "text", text: model.labelTh, size: "sm", weight: "bold", color: C.text },
        {
          type: "box",
          layout: "baseline",
          margin: "lg",
          contents: [
            { type: "text", text: `${model.creditCost}`, size: "3xl", weight: "bold", color: colorStart, flex: 0 },
            { type: "text", text: " THB / ครั้ง", size: "sm", color: C.textSub, flex: 0, margin: "md" },
          ],
        },
      ],
      paddingAll: "16px",
      backgroundColor: C.cream,
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "🌺 เลือกใช้งาน",
              size: "md",
              weight: "bold",
              color: C.white,
              align: "center",
            },
          ],
          paddingAll: "12px",
          cornerRadius: "8px",
          background: {
            type: "linearGradient",
            angle: "90deg",
            startColor: colorStart,
            endColor: colorEnd,
          },
          action: {
            type: "postback",
            label: "เลือกใช้งาน",
            data: `action=select_gen&model=${model.id}&cat=${model.category}`,
            displayText: `เลือก ${model.labelTh}`,
          },
        },
      ],
      paddingAll: "12px",
      backgroundColor: C.cream,
    },
  };
}

// ==================== Wallet ====================

export function buildWalletMenu(balance: number): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: `💰 ฿${balance.toFixed(2)}`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "box",
            layout: "vertical",
            flex: 3,
            contents: [
              { type: "text", text: "💰 กระเป๋าเงิน", weight: "bold", size: "lg", color: C.white },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            flex: 1,
            contents: [
              { type: "image", url: MASCOT, size: "full", aspectMode: "cover", aspectRatio: "1:1" },
            ],
            cornerRadius: "100px",
            width: "45px",
            height: "45px",
          },
        ],
        paddingAll: "16px",
        background: {
          type: "linearGradient",
          angle: "135deg",
          startColor: "#C8A951",
          endColor: "#E8D48B",
        },
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "ยอดคงเหลือ", size: "xs", color: C.textSub, align: "center" },
          { type: "text", text: `฿${balance.toFixed(2)}`, size: "3xl", weight: "bold", color: C.pink, align: "center", margin: "md" },
        ],
        paddingAll: "24px",
        backgroundColor: C.cream,
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "secondary",
            height: "sm",
            action: { type: "postback", label: "📜 ประวัติ", data: "action=menu&cmd=history", displayText: "ประวัติ" },
          },
          {
            type: "button",
            style: "primary",
            color: C.pink,
            height: "sm",
            action: { type: "postback", label: "🌺 กลับเมนู", data: "action=menu&cmd=main", displayText: "เมนูหลัก" },
          },
        ],
        paddingAll: "12px",
        backgroundColor: "#FFF0F6",
      },
    },
  };
}

// ==================== Price Carousel ====================

export function buildPriceMenu(): messagingApi.FlexMessage {
  const cats = [
    { key: "image" as const, label: "🖼 รูปภาพ", s: "#D63384", e: "#FF6B9D" },
    { key: "video" as const, label: "🎬 วิดีโอ", s: "#E17055", e: "#FF9A76" },
    { key: "audio" as const, label: "🎤 เสียง", s: "#0984E3", e: "#48C6EF" },
    { key: "music" as const, label: "🎵 เพลง", s: "#6C5CE7", e: "#A78BFA" },
  ];

  const bubbles: messagingApi.FlexBubble[] = cats.map(({ key, label, s, e }) => {
    const models = getModelsByCategory(key);
    const rows: messagingApi.FlexComponent[] = models.map((m) => ({
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        { type: "text" as const, text: m.labelTh, size: "xs" as const, color: C.text, flex: 3, wrap: true },
        {
          type: "box" as const,
          layout: "vertical" as const,
          flex: 1,
          contents: [
            { type: "text" as const, text: `${m.creditCost} ฿`, size: "sm" as const, weight: "bold" as const, color: s, align: "end" as const },
          ],
        },
      ],
      paddingTop: "8px",
      paddingBottom: "8px",
    }));

    return {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: label, weight: "bold", size: "lg", color: C.white },
          { type: "text", text: `${models.length} models`, size: "xs", color: "#FFFFFFAA" },
        ],
        paddingAll: "16px",
        background: { type: "linearGradient", angle: "135deg", startColor: s, endColor: e },
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: rows as messagingApi.FlexComponent[],
        paddingAll: "14px",
        backgroundColor: C.cream,
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              { type: "text", text: "เลือก Model", size: "sm", weight: "bold", color: C.white, align: "center" },
            ],
            paddingAll: "10px",
            cornerRadius: "8px",
            background: { type: "linearGradient", angle: "90deg", startColor: s, endColor: e },
            action: { type: "postback", label: "เลือก", data: `action=menu&cat=${key}`, displayText: `${label} เลือก Model` },
          },
        ],
        paddingAll: "12px",
        backgroundColor: C.cream,
      },
    } satisfies messagingApi.FlexBubble;
  });

  return {
    type: "flex",
    altText: "📋 ราคาทั้งหมด",
    contents: { type: "carousel", contents: bubbles },
  };
}
