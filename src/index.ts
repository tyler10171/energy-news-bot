import { fetchAllNews } from "./news";
import { initBot, sendNewsDigest } from "./telegram";
import { CONFIG } from "./config";

async function runOnce(): Promise<void> {
  console.log("=".repeat(50));
  console.log(`[${new Date().toLocaleString("ko-KR")}] 뉴스 브리핑 시작`);

  try {
    const { international, domestic } = await fetchAllNews();

    if (international.length === 0 && domestic.length === 0) {
      console.log("[Info] 수집된 뉴스가 없습니다.");
      return;
    }

    await sendNewsDigest(international, domestic);
    console.log("[완료] 브리핑 전송 성공!");
  } catch (error) {
    console.error("[에러] 브리핑 전송 실패:", error);
  }
}

function getKSTHour(): number {
  return new Date().toLocaleString("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: "Asia/Seoul",
  }) as unknown as number;
}

function msUntilNextHour(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return next.getTime() - now.getTime();
}

async function scheduleLoop(): Promise<void> {
  const hour = getKSTHour();

  if (hour >= 7 && hour <= 22) {
    await runOnce();
  } else {
    console.log(`[${new Date().toLocaleString("ko-KR")}] 야간 시간 (07~22시 외) - 스킵`);
  }

  const wait = msUntilNextHour();
  const minutes = Math.round(wait / 60000);
  console.log(`[다음 실행] ${minutes}분 후\n`);

  setTimeout(scheduleLoop, wait);
}

// 실행 모드 분기
const args = process.argv.slice(2);

if (args.includes("--now")) {
  console.log("🚀 즉시 실행 모드");
  initBot();
  runOnce().then(() => process.exit(0));
} else {
  console.log("⏰ 스케줄 모드로 시작합니다.");
  console.log(`   봇 토큰: ${CONFIG.telegramToken.substring(0, 10)}...`);
  console.log(`   채널: ${CONFIG.channelId}`);
  console.log("   발송 시간: 매 시간 정각 (07:00 ~ 22:00 KST)");
  console.log("=".repeat(50));

  initBot();

  // 시작 시 즉시 1회 실행 후 매 시간 반복
  scheduleLoop();
}
