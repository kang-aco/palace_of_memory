// 로그인/세션 관련 서버 도우미 모음입니다.
// (functions/ 아래에서 밑줄(_)로 시작하는 폴더는 주소(라우트)가 되지 않고,
//  다른 함수들이 import 해서 쓰는 공용 코드로만 쓰입니다.)

const SESSION_DAYS = 30
const PBKDF2_ITERATIONS = 100000

// ---------- 바이트/문자 변환 ----------
function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}
function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16)
  return arr
}
function base64url(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return bytesToHex(new Uint8Array(digest))
}

// ---------- 비밀번호 해싱(PBKDF2) ----------
export async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  )
  return { hashHex: bytesToHex(new Uint8Array(bits)), saltHex: bytesToHex(salt) }
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  if (!saltHex || !expectedHashHex) return false
  const { hashHex } = await hashPassword(password, saltHex)
  // 길이 다르면 즉시 실패
  if (hashHex.length !== expectedHashHex.length) return false
  // 상수시간에 가깝게 비교
  let diff = 0
  for (let i = 0; i < hashHex.length; i++) diff |= hashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i)
  return diff === 0
}

// ---------- 세션 ----------
// 새 세션을 만들고 DB에 저장한 뒤, 쿠키에 담을 원본 토큰을 돌려줍니다.
export async function createSession(DB, userId) {
  const raw = crypto.getRandomValues(new Uint8Array(32))
  const token = base64url(raw)
  const tokenHash = await sha256Hex(token)
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await DB.prepare(
    'INSERT INTO Session (tokenHash, userId, expiresAt) VALUES (?, ?, ?)'
  )
    .bind(tokenHash, userId, expires.toISOString())
    .run()
  return { token, expires }
}

export async function deleteSession(DB, token) {
  if (!token) return
  const tokenHash = await sha256Hex(token)
  await DB.prepare('DELETE FROM Session WHERE tokenHash = ?').bind(tokenHash).run()
}

// 요청의 쿠키에서 세션 토큰을 꺼내 유효한 사용자면 그 사용자 정보를 돌려줍니다.
export async function getUserFromSession(request, env) {
  const token = readCookie(request, 'session')
  if (!token) return null
  const tokenHash = await sha256Hex(token)
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.displayName
       FROM Session s JOIN User u ON u.id = s.userId
      WHERE s.tokenHash = ? AND s.expiresAt > datetime('now')`
  )
    .bind(tokenHash)
    .first()
  return row || null
}

// ---------- 쿠키 ----------
export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

// 세션 쿠키를 세팅하는 Set-Cookie 문자열을 만듭니다.
// 로컬(http)에서는 Secure를 빼야 쿠키가 저장되므로, https일 때만 Secure를 붙입니다.
export function sessionCookie(request, token, expires) {
  const isHttps = new URL(request.url).protocol === 'https:'
  const attrs = [
    `session=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Expires=${expires.toUTCString()}`,
  ]
  if (isHttps) attrs.push('Secure')
  return attrs.join('; ')
}

export function clearCookie(request) {
  const isHttps = new URL(request.url).protocol === 'https:'
  const attrs = ['session=', 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0']
  if (isHttps) attrs.push('Secure')
  return attrs.join('; ')
}
