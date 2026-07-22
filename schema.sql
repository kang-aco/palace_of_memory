-- 메모리룸(MemoryRoom) 데이터베이스 스키마
-- PRD 8번 "데이터 모델" 섹션을 실제 SQL 테이블로 옮긴 파일입니다.
-- 이 파일은 D1 데이터베이스를 처음 만들 때 한 번 실행합니다. (README.md 참고)

-- 1) User: 사용자 정보 (로그인 계정)
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  displayName TEXT,
  passwordHash TEXT,        -- PBKDF2로 해싱한 비밀번호 (원문 저장 안 함)
  passwordSalt TEXT,        -- 사용자별 소금값
  settings TEXT,            -- JSON 문자열로 저장 (예: {"darkMode": true})
  streakCount INTEGER DEFAULT 0,
  totalReviewCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

-- 1-1) Session: 로그인 세션 (HttpOnly 쿠키의 토큰을 해시해서 보관)
CREATE TABLE IF NOT EXISTS Session (
  tokenHash TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- 2) Room: 로먼룸(기억 세트) 하나
CREATE TABLE IF NOT EXISTS Room (
  id TEXT PRIMARY KEY,
  userId TEXT,
  name TEXT NOT NULL,
  imageUrls TEXT,            -- 사진 URL 여러 개를 JSON 배열 문자열로 저장 (예: ["url1","url2"])
  category TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- 3) Pin: 사진 위의 번호 하나 (한 사진에 여러 개 가능 = 다중 핀)
CREATE TABLE IF NOT EXISTS Pin (
  id TEXT PRIMARY KEY,
  roomId TEXT NOT NULL,
  imageIndex INTEGER,         -- 룸 안에서 몇 번째 사진인지 (사진이 여러 장일 경우)
  x REAL,                     -- 사진 위 가로 위치 (0~1 사이 비율로 저장 권장)
  y REAL,                     -- 사진 위 세로 위치
  number INTEGER,              -- 화면에 보여줄 번호
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (roomId) REFERENCES Room(id)
);

-- 4) Anchor: 핀 하나에 연결된 실제 기억 내용
--    ※ 이번 버전은 API 자동연결 없이, 사용자가 직접(텍스트 또는 음성으로) 입력한 내용만 저장합니다.
CREATE TABLE IF NOT EXISTS Anchor (
  id TEXT PRIMARY KEY,
  pinId TEXT NOT NULL,
  content TEXT,                -- 실제 암기 내용 (사용자가 직접 입력)
  techniqueType TEXT,           -- 숫자변환법 / 문자변환법 / 연상기억법 / 기초결합법
  associationText TEXT,         -- 연상 스토리 설명
  inputMethod TEXT,             -- 'text' 또는 'voice'
  voiceAudioUrl TEXT,           -- 음성 원본 보관 시 (선택)
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (pinId) REFERENCES Pin(id)
);

-- 5) ReviewLog: 복습 기록
CREATE TABLE IF NOT EXISTS ReviewLog (
  id TEXT PRIMARY KEY,
  anchorId TEXT NOT NULL,
  reviewedAt TEXT DEFAULT (datetime('now')),
  recallSuccess INTEGER,        -- 1(성공) / 0(실패)
  difficulty TEXT,              -- 쉬움 / 보통 / 어려움
  nextReviewDate TEXT,
  FOREIGN KEY (anchorId) REFERENCES Anchor(id)
);
