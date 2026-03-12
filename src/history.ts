import fs from "fs";
import path from "path";

const HISTORY_FILE = path.join(__dirname, "..", "sent-today.json");

interface SentHistory {
  date: string; // YYYY-MM-DD
  titles: string[];
}

function getToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function loadHistory(): SentHistory {
  try {
    const data = fs.readFileSync(HISTORY_FILE, "utf-8");
    const history: SentHistory = JSON.parse(data);
    // 날짜가 다르면 초기화
    if (history.date !== getToday()) {
      return { date: getToday(), titles: [] };
    }
    return history;
  } catch {
    return { date: getToday(), titles: [] };
  }
}

function saveHistory(history: SentHistory): void {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function titleKey(title: string): string {
  return title.replace(/[^가-힣a-zA-Z0-9]/g, "").substring(0, 40);
}

// 이미 보낸 뉴스인지 확인
export function isAlreadySent(title: string): boolean {
  const history = loadHistory();
  return history.titles.includes(titleKey(title));
}

// 보낸 뉴스 목록에 추가
export function markAsSent(titles: string[]): void {
  const history = loadHistory();
  for (const title of titles) {
    const key = titleKey(title);
    if (!history.titles.includes(key)) {
      history.titles.push(key);
    }
  }
  saveHistory(history);
}

// 이미 보낸 뉴스를 필터링
export function filterNewOnly<T extends { title: string }>(items: T[]): T[] {
  const history = loadHistory();
  return items.filter((item) => !history.titles.includes(titleKey(item.title)));
}
