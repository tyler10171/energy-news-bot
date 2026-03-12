# Energy News Bot 개발 가이드

> 에너지 시장 뉴스를 자동 수집하여 텔레그램 채널로 매시간 발송하는 봇
> 텔레그램 채널: @tyler_enerbot_news

---

## 전체 아키텍처

```
[Google News RSS]     [Google News RSS]
   (영어/해외)            (한국어/국내)
       │                      │
       └──────┬───────────────┘
              ▼
     [ News Collector ]      ← src/news.ts
      (뉴스 수집 & 중복 제거)
              │
              ▼
     [ Telegram Sender ]     ← src/telegram.ts
      (메시지 포맷팅 & 전송)
              │
              ▼
     [ @tyler_enerbot_news ]
       텔레그램 채널에 게시
              │
       ┌──────┴──────┐
       ▼             ▼
  🌍 해외 뉴스   🇰🇷 국내 뉴스
  (영어 원문)    (한국어 기사)
```

---

## Step 1: 개발 환경 및 프로젝트 생성

### 프로젝트 초기화

```bash
mkdir -p ~/energy-news-bot/src && cd ~/energy-news-bot
npm init -y
```

> `npm init -y` = package.json(프로젝트 설정 파일)을 자동 생성합니다.

### 패키지 설치

```bash
# 핵심 패키지
npm install node-telegram-bot-api rss-parser node-cron dotenv

# 개발용 패키지
npm install -D typescript @types/node @types/node-cron @types/node-telegram-bot-api ts-node
```

| 패키지 | 역할 |
|--------|------|
| `node-telegram-bot-api` | 텔레그램 봇 API와 통신 |
| `rss-parser` | Google News RSS 피드를 파싱 |
| `dotenv` | .env 파일에서 환경변수(토큰 등) 로드 |
| `typescript` | 타입 안전성 (버그 사전 방지) |
| `ts-node` | TypeScript 파일을 직접 실행 |

---

## Step 2: 텔레그램 봇 & 채널 준비

### 2-1. 봇 생성 (BotFather)

1. 텔레그램에서 **@BotFather** 검색 → 대화 시작
2. `/newbot` 입력
3. 봇 이름 입력 (예: `에너지뉴스봇`)
4. 봇 유저네임 입력 (예: `tylerenerbot`) — 반드시 `bot`으로 끝나야 함
5. 발급된 **API Token** 메모 (예: `8773126347:AAF...`)

> 봇은 "자동으로 메시지를 보내는 프로그램"입니다. BotFather는 봇을 만들어주는 텔레그램 공식 봇입니다.

### 2-2. 채널 생성

1. 텔레그램 → 새 채널(New Channel) 생성
2. 채널 이름 설정 (예: `에너지 시장 뉴스`)
3. 공개(Public) 채널로 설정, 링크 지정 (예: `@tyler_enerbot_news`)

### 2-3. 봇을 채널 관리자로 추가

1. 채널 정보 → 관리자(Administrators) → 관리자 추가
2. 만든 봇 유저네임 검색 → 추가
3. **메시지 게시(Post Messages)** 권한 활성화

> 봇이 채널에 글을 올리려면 반드시 해당 채널의 관리자여야 합니다.

---

## Step 3: 환경변수 설정

### `.env` 파일 생성

```bash
TELEGRAM_BOT_TOKEN=8773126347:AAFDGAe6Inh-dKNE2UexkXh4WH9U8hdRBAQ
TELEGRAM_CHANNEL_ID=@tyler_enerbot_news
```

> `.env` 파일은 API 토큰 같은 민감한 정보를 코드와 분리하여 보관합니다. `.gitignore`에 등록하여 GitHub에 올라가지 않도록 합니다.

---

## Step 4: 프로젝트 구조 및 코드 작성

```
~/energy-news-bot/
├── .env                          ← 환경변수 (봇 토큰, 채널 ID)
├── .gitignore                    ← Git 제외 파일 목록
├── package.json                  ← 프로젝트 설정 & 의존성
├── tsconfig.json                 ← TypeScript 설정
├── com.energynewsbot.plist       ← Mac 백그라운드 서비스 설정
├── bot.log                       ← 실행 로그
├── bot-error.log                 ← 에러 로그
└── src/
    ├── config.ts                 ← 설정 (키워드, API URL 등)
    ├── news.ts                   ← 뉴스 수집 모듈
    ├── telegram.ts               ← 텔레그램 전송 모듈
    └── index.ts                  ← 메인 실행 파일 (스케줄러)
```

### 4-1. `config.ts` — 설정 파일

역할: 검색 키워드, API URL, 환경변수를 한 곳에서 관리

```
해외 키워드: crude oil price, Brent WTI oil, LNG natural gas price,
            OPEC oil production, Henry Hub natural gas, Europe gas price 등
국내 키워드: 발전소 에너지, 지역난방, 한국가스공사, 한국전력,
            전력거래, 신재생에너지 발전, 에너지 정책, 집단에너지
```

### 4-2. `news.ts` — 뉴스 수집 모듈

역할: Google News RSS에서 에너지 관련 뉴스를 수집하고 중복을 제거

**동작 매커니즘:**

```
1. 각 키워드별로 Google News RSS URL 생성
   - 해외: https://news.google.com/rss/search?q=crude+oil+price&hl=en&gl=US
   - 국내: https://news.google.com/rss/search?q=지역난방&hl=ko&gl=KR

2. RSS 피드 파싱 → 제목, 링크, 출처, 날짜 추출

3. 키워드별 최대 3건씩 수집 후 병합

4. 중복 제거 (제목 유사도 기반)
   - 제목에서 특수문자 제거 후 앞 30자 비교
   - 같은 뉴스가 여러 키워드에 잡히는 것 방지

5. 카테고리별 최대 5건으로 제한
```

**RSS(Really Simple Syndication)란?**
> 웹사이트가 새 콘텐츠를 XML 형식으로 제공하는 표준 포맷입니다. Google News는 검색 결과를 RSS로 제공하므로, 별도 API 키 없이 무료로 뉴스를 수집할 수 있습니다.

### 4-3. `telegram.ts` — 텔레그램 전송 모듈

역할: 수집된 뉴스를 보기 좋게 포맷하여 텔레그램 채널에 전송

**메시지 포맷:**

```
⚡ 에너지 시장 뉴스
📅 2026년 3월 12일 목요일 오전 10:00
━━━━━━━━━━━━━━━━━━━━

🌍 국제 에너지 시장

1. Oil prices fall as OPEC increases production — Reuters
2. LNG spot prices surge amid cold snap — Bloomberg
...

🇰🇷 국내 에너지 시장

1. 한국가스공사, LNG 도입단가 협상 타결 — 연합뉴스
2. 지역난방 요금 인상안 국회 통과 — 한겨레
...

━━━━━━━━━━━━━━━━━━━━
🤖 Energy News Bot | 매시 자동 수집
```

**주요 처리:**
- HTML 특수문자 이스케이프 (&, <, > 등)
- 뉴스 제목에 기사 링크 연결 (클릭하면 원문으로 이동)
- 메시지가 4000자 초과 시 해외/국내 분리하여 2회 전송 (텔레그램 제한: 4096자)

### 4-4. `index.ts` — 메인 실행 파일

역할: 뉴스 수집 → 전송을 스케줄에 따라 반복 실행

**두 가지 실행 모드:**

```bash
# 즉시 1회 실행 (테스트용)
npm run now

# 스케줄 모드 (매 시간 자동 실행)
npm start
```

**스케줄 매커니즘:**

```
1. 시작 시 즉시 1회 실행
2. 다음 정각까지 남은 시간 계산
3. setTimeout으로 다음 정각에 실행 예약
4. 실행 시 현재 시간이 07:00~22:00(KST)인지 확인
   - 범위 내: 뉴스 수집 & 전송
   - 범위 외: 스킵
5. 다시 2번으로 돌아가 반복
```

> 처음에는 `node-cron` 라이브러리를 사용했으나 타임존 처리 문제로 정각에 실행되지 않는 버그가 발생하여, 자체 타이머 방식(setTimeout + 정각 계산)으로 교체했습니다.

---

## Step 5: 테스트

### 즉시 실행 테스트

```bash
npx ts-node src/index.ts --now
```

**첫 테스트에서 발생한 문제들:**

| 문제 | 원인 | 해결 |
|------|------|------|
| TypeScript 컴파일 에러 | `@types/node-telegram-bot-api` 미설치 | `npm install -D @types/node-telegram-bot-api` |
| `chat not found` 에러 | 채널 ID가 봇 유저네임이었음 (채널이 별도로 필요) | 새 채널 생성 후 채널 ID로 변경 |
| 3시 정각 미발송 | `node-cron` 타임존 처리 버그 | 자체 타이머 방식으로 교체 |

---

## Step 6: 백그라운드 서비스 등록

터미널을 닫아도 봇이 계속 실행되도록 Mac의 `launchd` 시스템 서비스로 등록했습니다.

### `com.energynewsbot.plist` 파일 생성

```xml
주요 설정:
- Label: com.energynewsbot (서비스 식별자)
- ProgramArguments: node로 ts-node를 실행하여 index.ts 구동
- RunAtLoad: true (등록 시 즉시 시작)
- KeepAlive: true (비정상 종료 시 자동 재시작)
- StandardOutPath: bot.log (로그 파일)
```

### 서비스 등록 & 시작

```bash
# plist 파일을 LaunchAgents 폴더에 복사
cp com.energynewsbot.plist ~/Library/LaunchAgents/

# 서비스 시작
launchctl load ~/Library/LaunchAgents/com.energynewsbot.plist
```

> **launchd**는 Mac의 시스템 서비스 관리자입니다. `~/Library/LaunchAgents/`에 plist 파일을 넣으면 사용자 로그인 시 자동으로 서비스를 시작합니다.

### 서비스 관리 명령어

```bash
# 상태 확인
launchctl list | grep energynewsbot

# 봇 중지
launchctl unload ~/Library/LaunchAgents/com.energynewsbot.plist

# 봇 재시작
launchctl unload ~/Library/LaunchAgents/com.energynewsbot.plist
launchctl load ~/Library/LaunchAgents/com.energynewsbot.plist

# 로그 확인 (실시간)
tail -f ~/energy-news-bot/bot.log

# 에러 로그 확인
cat ~/energy-news-bot/bot-error.log
```

---

## 전체 동작 흐름 요약

```
Mac 부팅/로그인
    │
    ▼
launchd가 com.energynewsbot 서비스 자동 시작
    │
    ▼
index.ts 실행 → 즉시 1회 뉴스 수집 & 전송
    │
    ▼
다음 정각까지 대기 (setTimeout)
    │
    ▼
매 시간 정각 (07:00 ~ 22:00 KST)
    │
    ├─ news.ts: Google News RSS에서 키워드별 뉴스 수집
    │   ├─ 해외: 영어 검색 (crude oil, LNG 등) → 7개 키워드 × 3건
    │   └─ 국내: 한국어 검색 (지역난방 등) → 8개 키워드 × 3건
    │
    ├─ 중복 제거 → 카테고리별 5건으로 필터링
    │
    ├─ telegram.ts: 메시지 포맷팅 → @tyler_enerbot_news 채널에 전송
    │
    └─ 다음 정각까지 대기 → 반복
```

---

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | v24.14.0 | 자바스크립트 런타임 |
| TypeScript | 5.9.3 | 타입 안전성 |
| node-telegram-bot-api | 0.67.0 | 텔레그램 봇 통신 |
| rss-parser | 3.13.0 | RSS 피드 파싱 |
| dotenv | 17.3.1 | 환경변수 관리 |
| launchd (macOS) | - | 백그라운드 서비스 |

---

## 검색 키워드 목록

### 해외 (영어, Google US)

| 키워드 | 대상 |
|--------|------|
| crude oil price | 원유 가격 전반 |
| Brent WTI oil | 브렌트유, WTI 유가 |
| LNG natural gas price | LNG, 천연가스 가격 |
| OPEC oil production | OPEC 생산량, 감산 |
| Henry Hub natural gas | 미국 천연가스 기준가 |
| Europe gas price | 유럽 가스 시장 (TTF 등) |
| energy market outlook | 에너지 시장 전망 |

### 국내 (한국어, Google KR)

| 키워드 | 대상 |
|--------|------|
| 발전소 에너지 | 발전 산업 |
| 지역난방 | 지역난방 시장 |
| 한국가스공사 | KOGAS 관련 |
| 한국전력 | KEPCO 관련 |
| 전력거래 | 전력 시장 |
| 신재생에너지 발전 | 재생에너지 |
| 에너지 정책 | 정부 에너지 정책 |
| 집단에너지 | 집단에너지 산업 |

---

## 향후 개선 가능 사항

- **AI 요약 추가**: Anthropic API 연동 시 각 뉴스의 2줄 요약 + 2줄 인사이트 자동 생성 가능
- **해외 뉴스 번역**: AI API 연동 시 영어 뉴스를 한국어로 자동 번역 가능
- **서버 배포**: Railway, Render 등 클라우드 서버에 배포하면 Mac을 켜두지 않아도 작동
- **뉴스 소스 확장**: 네이버 뉴스, 에너지경제신문 등 추가 가능
- **중복 뉴스 필터링 강화**: 이전 시간에 보낸 뉴스와 비교하여 새 뉴스만 발송

---

*이 프로젝트는 2026년 3월 11일 Claude Code를 사용하여 생성되었습니다.*
