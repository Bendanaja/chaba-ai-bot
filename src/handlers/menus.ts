import type { messagingApi } from "@line/bot-sdk";
import { getModelsByCategory, type ModelDef } from "../models/kieai-models.js";
import { config } from "../config.js";
import type { Invoice } from "../services/database.js";
import * as dbService from "../services/database.js";

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

// ==================== Icon Cache ====================

let iconCache: Record<string, string> | null = null;
let iconCacheTime = 0;

export async function getIcons(): Promise<Record<string, string>> {
  if (iconCache && Date.now() - iconCacheTime < 300000) return iconCache;
  const data = await dbService.getSetting("menu_icons");
  const result: Record<string, string> = data || {};
  iconCache = result;
  iconCacheTime = Date.now();
  return result;
}

// ==================== Main Menu ====================

export async function buildMainMenu(): Promise<messagingApi.FlexMessage> {
  const icons = await getIcons();
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
              mainCatCard("🖼", "รูปภาพ", "3-8 ฿", "image", "#B5246B", "#D63384", icons["image"]),
              mainCatCard("🎬", "วิดีโอ", "15-22 ฿", "video", "#C0392B", "#E17055", icons["video"]),
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              mainCatCard("🎤", "เสียงพูด", "4-5 ฿", "audio", "#0652DD", "#0984E3", icons["audio"]),
              mainCatCard("🎵", "เพลง", "10 ฿", "music", "#4834D4", "#6C5CE7", icons["music"]),
            ],
          },

          // ---- Tools Section ----
          sectionTitle("🛠 เครื่องมือแต่งรูป"),
          {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              toolCard("✂️", "ลบพื้นหลัง", "3 ฿", "removebg", icons["removebg"]),
              toolCard("🔍", "ขยายรูป", "4 ฿", "upscale", icons["upscale"]),
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
          footerBtn("📋 ดูราคา", "price"),
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

function mainCatCard(emoji: string, label: string, price: string, cat: string, colorStart: string, colorEnd: string, iconUrl?: string): messagingApi.FlexBox {
  const iconContent: messagingApi.FlexComponent = iconUrl
    ? { type: "image", url: iconUrl, size: "xxl", aspectMode: "fit", aspectRatio: "1:1" }
    : { type: "text", text: emoji, size: "xxl", align: "center" };
  return {
    type: "box",
    layout: "vertical",
    flex: 1,
    contents: [
      iconContent,
      { type: "text", text: label, weight: "bold", size: "lg", align: "center", color: C.white, margin: "sm" },
      { type: "text", text: price, size: "sm", align: "center", color: "#FFFFFFDD" },
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

function toolCard(emoji: string, label: string, price: string, cmd: string, iconUrl?: string): messagingApi.FlexBox {
  const iconContent: messagingApi.FlexComponent = iconUrl
    ? { type: "image", url: iconUrl, size: "xl", aspectMode: "fit", aspectRatio: "1:1", flex: 0 }
    : { type: "text", text: emoji, size: "xl", flex: 0, gravity: "center" };
  return {
    type: "box",
    layout: "horizontal",
    flex: 1,
    contents: [
      iconContent,
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
    image: { label: "รูปภาพ", emoji: "🖼", s: "#B5246B", e: "#D63384" },
    video: { label: "วิดีโอ", emoji: "🎬", s: "#C0392B", e: "#E17055" },
    audio: { label: "เสียง", emoji: "🎤", s: "#0652DD", e: "#0984E3" },
    music: { label: "เพลง", emoji: "🎵", s: "#4834D4", e: "#6C5CE7" },
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
    { key: "image" as const, label: "🖼 รูปภาพ", s: "#B5246B", e: "#D63384" },
    { key: "video" as const, label: "🎬 วิดีโอ", s: "#C0392B", e: "#E17055" },
    { key: "audio" as const, label: "🎤 เสียง", s: "#0652DD", e: "#0984E3" },
    { key: "music" as const, label: "🎵 เพลง", s: "#4834D4", e: "#6C5CE7" },
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

// ==================== Receipt / Invoice ====================

export function buildReceiptCard(invoice: Invoice): messagingApi.FlexBubble {
  const itemRows: messagingApi.FlexComponent[] = invoice.items.map((item) => ({
    type: "box" as const,
    layout: "horizontal" as const,
    contents: [
      {
        type: "text" as const,
        text: item.description,
        size: "sm" as const,
        color: C.text,
        flex: 3,
        wrap: true,
      },
      {
        type: "text" as const,
        text: `${item.quantity}x`,
        size: "xs" as const,
        color: C.textSub,
        flex: 1,
        align: "center" as const,
      },
      {
        type: "text" as const,
        text: `฿${(item.quantity * item.unit_price).toFixed(2)}`,
        size: "sm" as const,
        color: C.text,
        flex: 2,
        align: "end" as const,
        weight: "bold" as const,
      },
    ],
    paddingTop: "6px",
    paddingBottom: "6px",
  }));

  const date = new Date(invoice.created_at);
  const dateStr = date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "🧾 ใบเสร็จรับเงิน",
              weight: "bold",
              size: "lg",
              color: C.white,
              flex: 3,
            },
            {
              type: "text",
              text: "PAID",
              size: "xs",
              color: "#FFFFFF",
              align: "end",
              weight: "bold",
              flex: 1,
              decoration: "none",
            },
          ],
        },
        {
          type: "text",
          text: `${invoice.invoice_number}`,
          size: "xs",
          color: "#FFFFFFBB",
          margin: "sm",
        },
      ],
      paddingAll: "18px",
      background: {
        type: "linearGradient",
        angle: "135deg",
        startColor: "#D63384",
        endColor: "#B5246B",
      },
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "ลูกค้า", size: "xs", color: C.textSub, flex: 1 },
            { type: "text", text: invoice.customer_name, size: "sm", color: C.text, flex: 3, weight: "bold" },
          ],
          paddingBottom: "8px",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "วันที่", size: "xs", color: C.textSub, flex: 1 },
            { type: "text", text: dateStr, size: "sm", color: C.text, flex: 3 },
          ],
          paddingBottom: "12px",
        },
        { type: "separator", color: "#E8E8F0" },
        {
          type: "text",
          text: "รายการ",
          size: "xs",
          color: C.textSub,
          margin: "lg",
        },
        ...itemRows,
        { type: "separator", color: "#E8E8F0", margin: "lg" },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "ราคารวม", size: "sm", color: C.textSub, flex: 2 },
            {
              type: "text",
              text: `฿${invoice.subtotal.toFixed(2)}`,
              size: "sm",
              color: C.text,
              flex: 2,
              align: "end",
            },
          ],
          margin: "lg",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: `VAT ${(invoice.tax_rate * 100).toFixed(0)}%`, size: "sm", color: C.textSub, flex: 2 },
            {
              type: "text",
              text: `฿${invoice.tax_amount.toFixed(2)}`,
              size: "sm",
              color: C.text,
              flex: 2,
              align: "end",
            },
          ],
          margin: "sm",
        },
        { type: "separator", color: C.gold, margin: "lg" },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "ยอดรวมทั้งหมด", size: "md", weight: "bold", color: C.text, flex: 2 },
            {
              type: "text",
              text: `฿${invoice.total.toFixed(2)}`,
              size: "xl",
              weight: "bold",
              color: C.pink,
              flex: 2,
              align: "end",
            },
          ],
          margin: "lg",
          paddingBottom: "4px",
        },
      ],
      paddingAll: "18px",
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
              text: "📄 ดูแบบเต็ม",
              size: "sm",
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
            startColor: "#C8A951",
            endColor: "#E8D48B",
          },
          action: {
            type: "uri",
            label: "ดูแบบเต็ม",
            uri: `https://admin.chaba.icutmc.com/dashboard/invoices/${invoice.id}`,
          },
        },
      ],
      paddingAll: "12px",
      backgroundColor: C.cream,
    },
  };
}

export function buildReceiptList(invoices: Invoice[]): messagingApi.FlexMessage {
  if (invoices.length === 0) {
    return {
      type: "flex",
      altText: "🧾 ไม่มีใบเสร็จ",
      contents: {
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "🧾 ยังไม่มีใบเสร็จ", size: "md", weight: "bold", color: C.text, align: "center" },
            { type: "text", text: "ใบเสร็จจะสร้างเมื่อสร้างผลงานสำเร็จ", size: "sm", color: C.textSub, align: "center", margin: "md", wrap: true },
          ],
          paddingAll: "24px",
          backgroundColor: C.cream,
        },
      },
    };
  }

  const bubbles = invoices.map((inv) => buildReceiptCard(inv));

  return {
    type: "flex",
    altText: `🧾 ใบเสร็จล่าสุด ${invoices.length} รายการ`,
    contents: { type: "carousel", contents: bubbles.slice(0, 10) },
  };
}

export function buildReceiptButton(taskId: string): messagingApi.FlexMessage {
  return {
    type: "flex",
    altText: "🧾 ขอใบเสร็จ",
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🧾 ขอใบเสร็จ",
                size: "md",
                weight: "bold",
                color: C.white,
                align: "center",
              },
            ],
            paddingAll: "12px",
            cornerRadius: "10px",
            background: {
              type: "linearGradient",
              angle: "90deg",
              startColor: "#C8A951",
              endColor: "#E8D48B",
            },
            action: {
              type: "postback",
              label: "ขอใบเสร็จ",
              data: `action=request_receipt&task_id=${taskId}`,
              displayText: "🧾 ขอใบเสร็จ",
            },
          },
        ],
        paddingAll: "12px",
        backgroundColor: C.cream,
      },
    },
  };
}

// ==================== Topup Request Card ====================

export function buildTopupRequestCard(params: {
  balance: number;
  needed: number;
  shortfall: number;
  promptpay: string;
  modelLabel: string;
}): messagingApi.FlexMessage {
  const promptpaySection: messagingApi.FlexComponent[] = params.promptpay
    ? [
        { type: "text", text: "PromptPay 💳", size: "sm", color: C.textSub, margin: "lg" },
        { type: "text", text: params.promptpay, size: "lg", weight: "bold", color: C.text, margin: "sm" },
        { type: "text", text: `โอน ${params.shortfall.toFixed(2)} บาท แล้วส่งสลิปมาเลยนะคะ 📸`, size: "sm", color: C.textSub, margin: "md", wrap: true },
      ]
    : [
        { type: "text", text: "ติดต่อ admin เพื่อเติมเงินนะคะ 💕", size: "sm", color: C.textSub, margin: "lg", wrap: true },
      ];

  return {
    type: "flex",
    altText: `🌸 เติมเงินก่อนนะคะ~ ขาดอีก ${params.shortfall.toFixed(2)} บาท`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🌸 เติมเงินก่อนนะคะ~", weight: "bold", size: "lg", color: C.white },
        ],
        paddingAll: "16px",
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
        contents: [
          // Balance row
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "💰 ยอดปัจจุบัน", size: "sm", color: C.textSub, flex: 3 },
              { type: "text", text: `${params.balance.toFixed(2)} บาท`, size: "sm", color: C.text, flex: 3, align: "end" },
            ],
            paddingTop: "8px",
            paddingBottom: "8px",
          },
          // Price row
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: `💸 ราคา (${params.modelLabel})`, size: "sm", color: C.textSub, flex: 3, wrap: true },
              { type: "text", text: `${params.needed.toFixed(2)} บาท`, size: "sm", color: C.text, flex: 3, align: "end" },
            ],
            paddingTop: "8px",
            paddingBottom: "8px",
          },
          // Shortfall row
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "❗ ขาดอีก", size: "md", color: C.pink, flex: 3, weight: "bold" },
              { type: "text", text: `${params.shortfall.toFixed(2)} บาท`, size: "md", color: C.pink, flex: 3, align: "end", weight: "bold" },
            ],
            paddingTop: "8px",
            paddingBottom: "8px",
          },
          // Separator
          { type: "separator", color: "#E8E8F0", margin: "md" },
          // PromptPay or contact admin section
          ...promptpaySection,
        ],
        paddingAll: "16px",
        backgroundColor: C.cream,
      },
    },
  };
}
