import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// 5단계 학습 통계 대시보드입니다.
// /api/stats 가 계산해준 숫자들을 카드로 보여줍니다.
export default function Stats() {
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'error'
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => {
        if (!res.ok) throw new Error('불러오기 실패')
        return res.json()
      })
      .then((d) => {
        setData(d)
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div style={styles.wrap}>
      <div style={styles.topbar}>
        <Link to="/" style={styles.back}>
          ← 홈으로
        </Link>
      </div>

      <h1 style={styles.title}>📊 학습 통계</h1>

      {status === 'loading' && <p>⏳ 불러오는 중...</p>}
      {status === 'error' && <p style={{ color: '#e11d48' }}>⚠️ 통계를 불러오지 못했어요.</p>}

      {status === 'ok' && data && (
        <>
          <div style={styles.grid}>
            <Card label="연속 복습" value={`${data.streakDays}일`} accent="#f59e0b" hint="🔥 매일 이어가요" />
            <Card label="복습 예정" value={`${data.dueCount}개`} accent="#e11d48" hint="오늘까지 볼 항목" />
            <Card label="오늘 복습" value={`${data.reviewedToday}개`} accent="#16a34a" />
            <Card
              label="정답률"
              value={data.successRate === null ? '-' : `${data.successRate}%`}
              accent="#2563eb"
            />
            <Card label="새 항목" value={`${data.newCount}개`} accent="#7c3aed" hint="아직 복습 전" />
            <Card label="총 복습 수" value={`${data.totalReviews}회`} accent="#0891b2" />
          </div>

          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span>만든 룸</span>
              <b>{data.totalRooms}개</b>
            </div>
            <div style={styles.summaryRow}>
              <span>저장한 암기 항목</span>
              <b>{data.totalAnchors}개</b>
            </div>
          </div>

          <Link to="/" style={styles.homeBtn}>
            룸 목록으로 가서 복습하기
          </Link>
        </>
      )}
    </div>
  )
}

function Card({ label, value, accent, hint }) {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.cardValue, color: accent }}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
      {hint && <div style={styles.cardHint}>{hint}</div>}
    </div>
  )
}

const styles = {
  wrap: {
    maxWidth: 560,
    margin: '40px auto',
    padding: '0 20px',
    fontFamily: 'system-ui, sans-serif',
  },
  topbar: { marginBottom: 16 },
  back: { color: '#2563eb', textDecoration: 'none', fontSize: 14 },
  title: { fontSize: 24, margin: '8px 0 20px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 12,
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '18px 16px',
    background: '#fff',
    textAlign: 'center',
  },
  cardValue: { fontSize: 28, fontWeight: 800, lineHeight: 1.1 },
  cardLabel: { marginTop: 6, fontSize: 14, color: '#334155', fontWeight: 600 },
  cardHint: { marginTop: 2, fontSize: 12, color: '#94a3b8' },
  summary: {
    marginTop: 16,
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '6px 14px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 15,
  },
  homeBtn: {
    display: 'block',
    textAlign: 'center',
    marginTop: 24,
    padding: '14px',
    borderRadius: 10,
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    textDecoration: 'none',
  },
}
