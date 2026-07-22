-- 이미 만들어진 데이터베이스(로컬/원격)에 로그인 기능을 추가하기 위한 마이그레이션입니다.
-- 이미 schema.sql로 테이블을 만든 뒤 이 파일을 한 번 실행하세요.
--   로컬:  npx wrangler d1 execute memoryroom_db --file=./migrations/0002_auth.sql
--   원격:  npx wrangler d1 execute memoryroom_db --file=./migrations/0002_auth.sql --remote

-- User 테이블에 비밀번호 컬럼 추가 (이미 있으면 에러가 날 수 있으니, 새 DB엔 schema.sql만으로 충분)
ALTER TABLE User ADD COLUMN passwordHash TEXT;
ALTER TABLE User ADD COLUMN passwordSalt TEXT;

-- 로그인 세션 테이블
CREATE TABLE IF NOT EXISTS Session (
  tokenHash TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
