import TelegramBot from "node-telegram-bot-api";
import { CONFIG } from "./config";
import { NewsItem } from "./news";

let bot: TelegramBot;

export function initBot(): TelegramBot {
  bot = new TelegramBot(CONFIG.telegramToken, { polling: false });
  return bot;
}

function formatDateTime(): string {
  const now = new Date();
  const date = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  });
  const time = now.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });
  return `${date} ${time}`;
}

function formatNewsItem(item: NewsItem, index: number): string {
  const source = item.source ? ` — ${escapeHtml(item.source)}` : "";
  return `${index + 1}. <a href="${item.link}">${escapeHtml(item.title)}</a>${source}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendNewsDigest(
  international: NewsItem[],
  domestic: NewsItem[]
): Promise<void> {
  const dateStr = formatDateTime();

  let message = `⚡ <b>에너지 시장 뉴스</b>\n`;
  message += `📅 ${dateStr}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 해외 에너지 뉴스
  if (international.length > 0) {
    message += `🌍 <b>국제 에너지 시장</b>\n\n`;
    international.forEach((item, i) => {
      message += formatNewsItem(item, i) + "\n\n";
    });
  }

  // 국내 에너지 뉴스
  if (domestic.length > 0) {
    message += `🇰🇷 <b>국내 에너지 시장</b>\n\n`;
    domestic.forEach((item, i) => {
      message += formatNewsItem(item, i) + "\n\n";
    });
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🤖 Energy News Bot | 매시 자동 수집`;

  // 텔레그램 메시지 길이 제한 (4096자)
  if (message.length > 4000) {
    let msg1 = `⚡ <b>에너지 시장 뉴스</b>\n`;
    msg1 += `📅 ${dateStr}\n\n`;
    msg1 += `🌍 <b>국제 에너지 시장</b>\n\n`;
    international.forEach((item, i) => {
      msg1 += formatNewsItem(item, i) + "\n\n";
    });

    await bot.sendMessage(CONFIG.channelId, msg1, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });

    let msg2 = `🇰🇷 <b>국내 에너지 시장</b>\n\n`;
    domestic.forEach((item, i) => {
      msg2 += formatNewsItem(item, i) + "\n\n";
    });
    msg2 += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg2 += `🤖 Energy News Bot | 매시 자동 수집`;

    await bot.sendMessage(CONFIG.channelId, msg2, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  } else {
    await bot.sendMessage(CONFIG.channelId, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }

  console.log("[Telegram] 뉴스 브리핑 전송 완료!");
}
