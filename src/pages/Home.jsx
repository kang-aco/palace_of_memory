import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

// 홈 화면입니다.
//  - 상단: DB 연결 상태 확인 (1단계에서 하던 것 그대로 유지)
//  - 아래: 저장된 룸 목록 + "새 룸 만들기" 버튼 (2단계에서 추가)
export default function Home() {
  const { user, logout } = useAuth()
  // status: 'checking' | 'ok' | 'error'
  const [status, setStatus] = useState('checking')
  const [rooms, setRooms] = useState([])

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
  }, [])

  return (
    <div style={styles.wrap}>
      <div style={styles.userBar}>
        <span style={styles.hello}>👤 {user?.displayName || user?.email}</span>
        <button type="button" style={styles.logoutBtn} onClick={logout}>
          로그아웃
        </button>
      </div>

      <h1 style={styles.title}>🏠 메모리룸 (MemoryRoom)</h1>
      <p style={styles.sub}>
        사진 위에 핀을 찍어 기억을 저장하세요 ·{' '}
        <Link to="/guide" style={styles.guideInline}>
          📖 기억법 가이드
        </Link>
      </p>

      {status === 'checking' && <p>⏳ 데이터베이스 연결을 확인하는 중...</p>}

      {status === 'error' && (
        <div style={styles.card}>
          <p style={{ color: '#e11d48' }}>
            ⚠️ 아직 D1 연결이 안 되어 있어요. <br />
            README.md의 "D1 데이터베이스 만들기" 순서를 먼저 따라해 주세요.
          </p>
        </div>
      )}

      {status === 'ok' && (
        <>
          <div style={styles.actions}>
            <Link to="/rooms/new" style={styles.newBtn}>
              + 새 룸 만들기
            </Link>
            <Link to="/stats" style={styles.statsBtn}>
              📊 학습 통계
            </Link>
          </div>

          {rooms.length === 0 ? (
            <p style={styles.empty}>아직 만든 룸이 없어요. 위 버튼으로 첫 룸을 만들어 보세요.</p>
          ) : (
            <div style={styles.grid}>
              {rooms.map((room) => (
                <Link key={room.id} to={`/rooms/${room.id}`} style={styles.roomCard}>
                  <div style={styles.thumbWrap}>
                    {room.thumbnail ? (
                      <img src={room.thumbnail} alt={room.name} style={styles.thumb} />
                    ) : (
                      <div style={styles.noThumb}>사진 없음</div>
                    )}
                  </div>
                  <div style={styles.roomInfo}>
                    <div style={styles.roomName}>{room.name}</div>
                    <div style={styles.roomMeta}>
                      {room.category ? `${room.category} · ` : ''}핀 {room.pinCount ?? 0}개
                    </div>
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
  wrap: {
    maxWidth: 600,
    margin: '48px auto',
    padding: '0 20px',
    fontFamily: 'system-ui, sans-serif',
  },
  userBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    fontSize: 14,
  },
  hello: { color: '#334155', fontWeight: 600 },
  logoutBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    color: '#64748b',
  },
  title: { fontSize: 26, marginBottom: 4, textAlign: 'center' },
  sub: { color: '#64748b', marginBottom: 24, textAlign: 'center' },
  guideInline: { color: '#2563eb', textDecoration: 'none', fontWeight: 600 },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 20,
    lineHeight: 1.8,
  },
  actions: { display: 'flex', gap: 10, marginBottom: 24 },
  newBtn: {
    flex: 1,
    textAlign: 'center',
    padding: '14px',
    borderRadius: 10,
    background: '#2563eb',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    textDecoration: 'none',
  },
  statsBtn: {
    textAlign: 'center',
    padding: '14px 18px',
    borderRadius: 10,
    background: '#fff',
    color: '#334155',
    border: '1px solid #cbd5e1',
    fontSize: 15,
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  empty: { color: '#64748b', textAlign: 'center' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 14,
  },
  roomCard: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    textDecoration: 'none',
    color: 'inherit',
    background: '#fff',
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: '4 / 3',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  noThumb: { color: '#94a3b8', fontSize: 13 },
  roomInfo: { padding: '10px 12px' },
  roomName: { fontWeight: 700, fontSize: 15, marginBottom: 2 },
  roomMeta: { color: '#64748b', fontSize: 13 },
}
