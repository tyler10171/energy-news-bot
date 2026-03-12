import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || "",
  channelId: process.env.TELEGRAM_CHANNEL_ID || "",

  // 뉴스 검색 키워드
  keywords: {
    international: [
      "crude oil price",
      "Brent WTI oil",
      "LNG natural gas price",
      "OPEC oil production",
      "Henry Hub natural gas",
      "Europe gas price",
      "energy market outlook",
    ],
    domestic: [
      "발전소 에너지",
      "지역난방",
      "한국가스공사",
      "한국전력",
      "전력거래",
      "신재생에너지 발전",
      "에너지 정책",
      "집단에너지",
    ],
  },

  // Google News RSS 기본 URL
  googleNewsRss: "https://news.google.com/rss/search",
  // 네이버 뉴스 RSS
  naverNewsRss: "https://news.google.com/rss/search",

  // 최대 뉴스 수
  maxNewsPerCategory: 5,
};
