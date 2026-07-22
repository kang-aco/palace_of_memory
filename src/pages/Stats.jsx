import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import theme, { floatUp } from '../theme.js'

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
      <Link to="/" style={styles.back}>
        ← 홈으로
      </Link>

      <div style={styles.title}>📊 학습 통계</div>

      {status === 'loading' && <p style={styles.loading}>⏳ 불러오는 중...</p>}
      {status === 'error' && <p style={styles.errorText}>⚠️ 통계를 불러오지 못했어요.</p>}

      {status === 'ok' && data && (
        <>
          <div style={styles.streakCard}>
            <div style={styles.streakLabel}>🔥 연속 복습 일수</div>
            <div style={styles.streakValue}>
              {data.streakDays}
              <span style={styles.streakUnit}> 일</span>
            </div>
          </div>

          <div style={styles.grid}>
            <Card label="복습 예정" value={`${data.dueCount}개`} accent={theme.danger} hint="오늘까지 볼 항목" />
            <Card label="오늘 복습" value={`${data.reviewedToday}개`} accent={theme.success} />
            <Card
              label="정답률"
              value={data.successRate === null ? '-' : `${data.successRate}%`}
              accent={theme.accent}
            />
            <Card label="새 항목" value={`${data.newCount}개`} accent={theme.warning} hint="아직 복습 전" />
          </div>

          <div style={styles.sectionLabel}>누적 기록</div>
          <div style={styles.summary}>
            <div style={styles.summaryRow}>
              <span style={styles.summaryKey}>만든 룸</span>
              <b>{data.totalRooms}개</b>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryKey}>저장한 암기 항목</span>
              <b>{data.totalAnchors}개</b>
            </div>
            <div style={{ ...styles.summaryRow, borderBottom: 'none' }}>
              <span style={styles.summaryKey}>총 복습 수</span>
              <b>{data.totalReviews}회</b>
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
      <div style={styles.cardLabel}>{label}</div>
      <div style={{ ...styles.cardValue, color: accent }}>{value}</div>
      {hint && <div style={styles.cardHint}>{hint}</div>}
    </div>
  )
}

const styles = {
  wrap: floatUp,
  back: {
    display: 'inline-block',
    background: 'none',
    border: 'none',
    color: theme.textMuted2,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 18 },
  loading: { color: theme.textMuted },
  errorText: { color: theme.dangerText },
  streakCard: {
    background: `linear-gradient(135deg, ${theme.accentSoftBg}, oklch(0.2 0.03 264))`,
    border: `1px solid ${theme.accentSoftBorder}`,
    borderRadius: theme.radiusXl,
    padding: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  streakLabel: { fontSize: 12, color: theme.accentSoftText, fontWeight: 700, marginBottom: 6 },
  streakValue: { fontSize: 48, fontWeight: 900, letterSpacing: '-0.02em' },
  streakUnit: { fontSize: 18, fontWeight: 700, color: theme.textMuted },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 16,
  },
  card: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusMd,
    padding: 16,
  },
  cardValue: { fontSize: 22, fontWeight: 800 },
  cardLabel: { fontSize: 11, color: theme.textMuted, fontWeight: 600, marginBottom: 6 },
  cardHint: { marginTop: 2, fontSize: 11, color: theme.textFaint },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: theme.textMuted3,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 10,
  },
  summary: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusMd,
    padding: '4px 16px',
    marginBottom: 20,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: `1px solid ${theme.borderSubtle}`,
    fontSize: 14,
  },
  summaryKey: { color: theme.textMuted2 },
  homeBtn: {
    display: 'block',
    textAlign: 'center',
    padding: 15,
    borderRadius: theme.radiusMd,
    background: theme.accent,
    color: theme.accentText,
    fontWeight: 800,
    fontSize: 14,
  },
}
