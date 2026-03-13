import Parser from "rss-parser";
import { CONFIG } from "./config";

const parser = new Parser({
  headers: { "User-Agent": "Mozilla/5.0" },
  timeout: 10000,
});

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  snippet: string;
  category: "international" | "domestic";
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, " ")
    .trim();
}

function extractSummary(content: string): string {
  const cleaned = cleanHtml(content);
  // 첫 2문장 추출
  const sentences = cleaned.split(/(?<=[.!?。])\s+/).filter((s) => s.length > 10);
  return sentences.slice(0, 2).join(" ").substring(0, 200);
}

async function fetchGoogleNews(
  keyword: string,
  category: "international" | "domestic"
): Promise<NewsItem[]> {
  try {
    const query = encodeURIComponent(keyword);
    const isIntl = category === "international";
    const hl = isIntl ? "en" : "ko";
    const gl = isIntl ? "US" : "KR";
    const url = `${CONFIG.googleNewsRss}?q=${query}+when:1d&hl=${hl}&gl=${gl}&ceid=${gl}:${hl}`;

    const feed = await parser.parseURL(url);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

    return (feed.items || [])
      .filter((item) => {
        if (!item.pubDate) return true;
        const pubDate = new Date(item.pubDate).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
        return pubDate === today;
      })
      .slice(0, 3)
      .map((item) => ({
        title: cleanHtml(item.title || ""),
        link: item.link || "",
        source: item.creator || extractSource(item.title || ""),
        pubDate: item.pubDate || "",
        snippet: item.contentSnippet
          ? extractSummary(item.contentSnippet)
          : item.content
          ? extractSummary(item.content)
          : "",
        category,
      }));
  } catch (error) {
    console.error(`[News] ${keyword} 검색 실패:`, error);
    return [];
  }
}

function extractSource(title: string): string {
  const match = title.match(/\s-\s(.+)$/);
  return match ? match[1].trim() : "";
}

// 중복 제거 (제목 유사도 기반)
function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    // 제목에서 핵심 키워드 추출하여 중복 판단
    const key = item.title.replace(/[^가-힣a-zA-Z0-9]/g, "").substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchAllNews(): Promise<{
  international: NewsItem[];
  domestic: NewsItem[];
}> {
  console.log("[News] 뉴스 수집 시작...");

  // 해외 에너지 뉴스 (한국어로 검색)
  const intlPromises = CONFIG.keywords.international.map((kw) =>
    fetchGoogleNews(kw, "international")
  );
  const intlResults = await Promise.allSettled(intlPromises);
  const intlNews = intlResults
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // 국내 에너지 뉴스
  const domPromises = CONFIG.keywords.domestic.map((kw) =>
    fetchGoogleNews(kw, "domestic")
  );
  const domResults = await Promise.allSettled(domPromises);
  const domNews = domResults
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  const international = deduplicateNews(intlNews).slice(
    0,
    CONFIG.maxNewsPerCategory
  );
  const domestic = deduplicateNews(domNews).slice(0, CONFIG.maxNewsPerCategory);

  console.log(
    `[News] 수집 완료 - 해외: ${international.length}건, 국내: ${domestic.length}건`
  );

  return { international, domestic };
}
