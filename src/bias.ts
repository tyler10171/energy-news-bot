// AllSides Media Bias Chart 기반 해외 언론사 성향
// https://www.allsides.com/media-bias/media-bias-chart (Version 11, 2025)
//
// 국내 언론사는 일반적으로 알려진 경향 기반

type BiasRating = "Left" | "Lean Left" | "Center" | "Lean Right" | "Right" | "unknown";

interface BiasInfo {
  rating: BiasRating;
  label: string; // 한국어 라벨
  emoji: string;
}

// 해외 언론사 (AllSides 기준)
const INTL_BIAS: Record<string, BiasRating> = {
  // Left
  "msnbc": "Left",
  "the guardian": "Left",
  "huffpost": "Left",
  "huffington post": "Left",
  "vox": "Left",
  "slate": "Left",
  "the intercept": "Left",
  "associated press": "Left",
  "ap news": "Left",
  "ap": "Left",
  "mother jones": "Left",
  "daily beast": "Left",

  // Lean Left
  "cnn": "Lean Left",
  "nbc news": "Lean Left",
  "abc news": "Lean Left",
  "cbs news": "Lean Left",
  "bloomberg": "Lean Left",
  "washington post": "Lean Left",
  "the washington post": "Lean Left",
  "new york times": "Lean Left",
  "the new york times": "Lean Left",
  "nyt": "Lean Left",
  "npr": "Lean Left",
  "politico": "Lean Left",
  "time": "Lean Left",
  "usa today": "Lean Left",
  "axios": "Lean Left",
  "business insider": "Lean Left",
  "insider": "Lean Left",
  "the atlantic": "Lean Left",
  "pbs": "Lean Left",

  // Center
  "reuters": "Center",
  "bbc": "Center",
  "bbc news": "Center",
  "cnbc": "Center",
  "the wall street journal": "Center",
  "wall street journal": "Center",
  "wsj": "Center",
  "newsweek": "Center",
  "the hill": "Center",
  "realclearpolitics": "Center",
  "financial times": "Center",
  "ft": "Center",
  "marketwatch": "Center",
  "forbes": "Center",

  // Lean Right
  "new york post": "Lean Right",
  "the dispatch": "Lean Right",
  "washington times": "Lean Right",
  "the washington times": "Lean Right",
  "washington examiner": "Lean Right",
  "the epoch times": "Lean Right",

  // Right
  "fox news": "Right",
  "fox business": "Right",
  "breitbart": "Right",
  "daily wire": "Right",
  "the daily wire": "Right",
  "newsmax": "Right",
  "new york sun": "Right",

  // 에너지/원자재 전문 매체 (일반적 중립)
  "oilprice.com": "Center",
  "crude oil prices today | oilprice.com": "Center",
  "s&p global": "Center",
  "platts": "Center",
  "rigzone": "Center",
  "energy voice": "Center",
};

// 국내 언론사 (일반적 경향)
const KR_BIAS: Record<string, BiasRating> = {
  // 진보 성향
  "한겨레": "Left",
  "경향신문": "Left",
  "오마이뉴스": "Left",
  "프레시안": "Left",
  "미디어오늘": "Left",

  // 진보~중도진보
  "kbs": "Lean Left",
  "kbs뉴스": "Lean Left",
  "mbc": "Lean Left",
  "mbc뉴스": "Lean Left",
  "jtbc": "Lean Left",
  "sbs": "Lean Left",
  "sbs뉴스": "Lean Left",
  "뉴스1": "Lean Left",
  "뉴시스": "Lean Left",
  "the bell": "Lean Left",
  "시사인": "Lean Left",

  // 중도
  "연합뉴스": "Center",
  "ytn": "Center",
  "채널a": "Center",
  "중앙일보": "Center",
  "서울신문": "Center",
  "국민일보": "Center",
  "세계일보": "Center",
  "머니투데이": "Center",
  "이투데이": "Center",
  "아시아경제": "Center",
  "헤럴드경제": "Center",
  "뉴스핌": "Center",

  // 중도보수~보수
  "조선일보": "Lean Right",
  "동아일보": "Lean Right",
  "문화일보": "Lean Right",
  "매일경제": "Lean Right",
  "한국경제": "Lean Right",
  "서울경제": "Lean Right",
  "파이낸셜뉴스": "Lean Right",
  "아주경제": "Lean Right",
  "이데일리": "Lean Right",
  "마켓인": "Lean Right",
  "mstoday.co.kr": "Lean Right",

  // 보수
  "tv조선": "Right",
  "펜앤드마이크": "Right",
  "뉴데일리": "Right",
  "미래한국": "Right",

  // 전문/업계 매체 (중립)
  "전기신문": "Center",
  "에너지신문": "Center",
  "에너지경제": "Center",
  "가스신문": "Center",
  "전력거래소": "Center",
  "인베스트조선": "Center",
};

const BIAS_INFO: Record<BiasRating, BiasInfo> = {
  "Left":       { rating: "Left",       label: "진보",     emoji: "🔵" },
  "Lean Left":  { rating: "Lean Left",  label: "중도진보", emoji: "🔹" },
  "Center":     { rating: "Center",     label: "중도",     emoji: "⚪" },
  "Lean Right": { rating: "Lean Right", label: "중도보수", emoji: "🔸" },
  "Right":      { rating: "Right",      label: "보수",     emoji: "🔴" },
  "unknown":    { rating: "unknown",    label: "",         emoji: "" },
};

export function getMediaBias(sourceName: string): BiasInfo {
  const normalized = sourceName.toLowerCase().trim();

  // 해외 매체 확인
  for (const [key, rating] of Object.entries(INTL_BIAS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return BIAS_INFO[rating];
    }
  }

  // 국내 매체 확인
  for (const [key, rating] of Object.entries(KR_BIAS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return BIAS_INFO[rating];
    }
  }

  return BIAS_INFO["unknown"];
}

// 범례 텍스트
export function getBiasLegend(): string {
  return `🔵진보 🔹중도진보 ⚪중도 🔸중도보수 🔴보수`;
}
