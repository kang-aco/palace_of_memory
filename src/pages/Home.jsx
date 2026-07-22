import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import theme, { floatUp } from '../theme.js'

// 홈 화면입니다.
//  - 상단: DB 연결 상태 확인 (1단계에서 하던 것 그대로 유지)
//  - 아래: 저장된 룸 목록 + "새 룸 만들기" 버튼 (2단계에서 추가)
//  - 연속 학습(streak) 카드: /api/stats가 실제로 계산해주는 streakDays만 사용합니다.
//    (레벨/XP는 백엔드에 없는 값이라 지어내지 않고 표시하지 않습니다.)
export default function Home() {
  const { user, logout } = useAuth()
  // status: 'checking' | 'ok' | 'error'
  const [status, setStatus] = useState('checking')
  const [rooms, setRooms] = useState([])
  const [streakDays, setStreakDays] = useState(null)

  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => {
        if (!res.ok) throw new Error('API 응답 실패')
        return res.json()
      })
      .then((data) => {
        setRooms(Array.isArray(data.rooms) ? data.rooms : [])
        setStatus('ok')
      })
      .catch(() => setStatus('error'))

    // 연속 학습 일수는 /api/stats가 실제로 계산해주는 값을 그대로 가져다 씁니다.
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.streakDays === 'number') setStreakDays(data.streakDays)
      })
      .catch(() => {})
  }, [])

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>M</div>
          <div>
            <div style={styles.brand}>메모리룸</div>
            <div style={styles.tagline}>기억의 궁전, 게임처럼 익히기</div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button type="button" style={styles.logoutBtn} onClick={logout}>
            로그아웃
          </button>
          <Link to="/stats" style={styles.statsBtn}>
            <div style={styles.statsDot} />
            <span>통계</span>
          </Link>
        </div>
      </div>

      <p style={styles.helloSub}>👤 {user?.displayName || user?.email}</p>

      {status === 'checking' && <p style={styles.checking}>⏳ 데이터베이스 연결을 확인하는 중...</p>}

      {status === 'error' && (
        <div style={styles.errorCard}>
          <p style={{ margin: 0 }}>
            ⚠️ 아직 D1 연결이 안 되어 있어요. <br />
            README.md의 "D1 데이터베이스 만들기" 순서를 먼저 따라해 주세요.
          </p>
        </div>
      )}

      {status === 'ok' && (
        <>
          {streakDays !== null && (
            <div style={styles.streakCard}>
              <div>
                <div style={styles.streakLabel}>🔥 연속 학습</div>
                <div style={styles.streakValue}>
                  {streakDays}
                  <span style={styles.streakUnit}> 일째</span>
                </div>
              </div>
            </div>
          )}

          <div style={styles.actions}>
            <Link to="/rooms/new" style={styles.newBtn}>
              + 새 룸 만들기
            </Link>
            <Link to="/guide" style={styles.guideBtn} title="기억법 가이드">
              📖
            </Link>
          </div>

          <div style={styles.sectionLabel}>내 룸 · {rooms.length}개</div>

          {rooms.length === 0 ? (
            <p style={styles.empty}>아직 만든 룸이 없어요. 위 버튼으로 첫 룸을 만들어 보세요.</p>
          ) : (
            <div style={styles.list}>
              {rooms.map((room) => (
                <Link key={room.id} to={`/rooms/${room.id}`} style={styles.roomCard}>
                  <div style={styles.thumbWrap}>
                    {room.thumbnail ? (
                      <img src={room.thumbnail} alt={room.name} style={styles.thumb} />
                    ) : (
                      <div style={styles.noThumb}>사진 없음</div>
                    )}
                    {room.category && <div style={styles.categoryBadge}>{room.category}</div>}
                  </div>
                  <div style={styles.roomInfo}>
                    <div style={styles.roomName}>{room.name}</div>
                    <div style={styles.roomMeta}>핀 {room.pinCount ?? 0}개</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  wrap: floatUp,
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentEnd})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 16,
    color: theme.accentText,
    flexShrink: 0,
  },
  brand: { fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' },
  tagline: { fontSize: 11, color: theme.textMuted },
  headerActions: { display: 'flex', gap: 8, flexShrink: 0 },
  logoutBtn: {
    background: 'none',
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: '8px 12px',
    color: theme.textMuted,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  statsBtn: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: '8px 12px',
    color: theme.text,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  statsDot: { width: 8, height: 8, borderRadius: '50%', background: theme.accent, flexShrink: 0 },
  helloSub: { fontSize: 12, color: theme.textMuted3, margin: '0 0 20px' },
  checking: { color: theme.textMuted, fontSize: 14 },
  errorCard: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusLg,
    padding: 20,
    lineHeight: 1.8,
    color: theme.dangerText,
    fontSize: 14,
  },
  streakCard: {
    background: `linear-gradient(135deg, ${theme.accentSoftBg}, oklch(0.2 0.03 264))`,
    border: `1px solid ${theme.accentSoftBorder}`,
    borderRadius: theme.radiusXl,
    padding: 20,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLabel: { fontSize: 12, color: theme.accentSoftText, fontWeight: 600, marginBottom: 4 },
  streakValue: { fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' },
  streakUnit: { fontSize: 15, fontWeight: 700, color: theme.textMuted },
  actions: { display: 'flex', gap: 10, marginBottom: 24 },
  newBtn: {
    flex: 1,
    textAlign: 'center',
    background: theme.accent,
    border: 'none',
    borderRadius: theme.radiusMd,
    padding: 16,
    color: theme.accentText,
    fontWeight: 800,
    fontSize: 15,
    boxShadow: `0 8px 24px -8px ${theme.accent}`,
  },
  guideBtn: {
    width: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusMd,
    fontSize: 20,
    flexShrink: 0,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: theme.textMuted3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 10,
  },
  empty: { color: theme.textMuted, fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  roomCard: {
    background: theme.card,
    border: `1px solid ${theme.borderSubtle}`,
    borderRadius: theme.radiusXl,
    overflow: 'hidden',
    color: theme.text,
    display: 'block',
  },
  thumbWrap: {
    position: 'relative',
    width: '100%',
    height: 150,
    background: '#333',
  },
  thumb: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  noThumb: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.textMuted,
    fontSize: 13,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: 'oklch(0.15 0.02 264 / 0.75)',
    backdropFilter: 'blur(4px)',
    borderRadius: 8,
    padding: '4px 9px',
    fontSize: 11,
    fontWeight: 700,
  },
  roomInfo: { padding: '14px 16px' },
  roomName: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  roomMeta: { fontSize: 12, color: theme.textMuted },
}
