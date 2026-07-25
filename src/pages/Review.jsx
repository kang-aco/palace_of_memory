import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import theme, { floatUp } from '../theme.js'

// 4단계 복습 화면입니다.
//  - 내용(앵커)이 있는 핀만 하나씩 보여줍니다.
//  - 먼저 스스로 떠올려 본 뒤 "정답 보기"로 내용을 확인하고,
//    기억했는지 + 얼마나 쉬웠는지를 눌러 복습 결과를 기록합니다.
//  - 다 끝나면 요약(성공/실패 개수)을 보여줍니다.
export default function Review() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'error'
  const [room, setRoom] = useState(null)
  const [items, setItems] = useState([]) // 복습 대상 핀들(앵커 있는 핀)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState([]) // { number, recallSuccess, difficulty, days }
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/rooms/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('불러오기 실패')
        return res.json()
      })
      .then((data) => {
        setRoom(data.room)
        setItems((data.pins || []).filter((p) => p.anchor))
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [id])

  const image = room?.imageUrls?.[0] || null
  const current = items[index] || null
  const finished = status === 'ok' && index >= items.length && items.length > 0
  const successRate =
    results.length > 0
      ? Math.round((results.filter((r) => r.recallSuccess).length / results.length) * 100)
      : 0

  async function grade(recallSuccess, difficulty) {
    if (!current || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/anchors/${current.anchor.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recallSuccess, difficulty }),
      })
      const data = await res.json().catch(() => ({}))
      setResults((prev) => [
        ...prev,
        { number: current.number, recallSuccess, difficulty, days: data.days },
      ])
      setRevealed(false)
      setIndex((i) => i + 1)
    } catch {
      // 저장에 실패해도 흐름은 이어가되, 결과에는 남기지 않습니다.
      setRevealed(false)
      setIndex((i) => i + 1)
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setIndex(0)
    setRevealed(false)
    setResults([])
  }

  return (
    <div style={styles.wrap}>
      <Link to={`/rooms/${id}`} style={styles.back}>
        ← 룸으로
      </Link>

      {status === 'loading' && <p style={styles.loading}>⏳ 불러오는 중...</p>}
      {status === 'error' && <p style={styles.errorText}>⚠️ 불러오지 못했어요.</p>}

      {status === 'ok' && items.length === 0 && (
        <div style={styles.center}>
          <h1 style={styles.title}>복습할 내용이 없어요</h1>
          <p style={styles.sub}>먼저 룸에서 핀에 암기 내용을 저장해 주세요.</p>
          <Link to={`/rooms/${id}`} style={styles.primaryLink}>
            룸으로 돌아가기
          </Link>
        </div>
      )}

      {status === 'ok' && !finished && current && (
        <>
          <div style={styles.headTitle}>{room.name} · 복습</div>
          <p style={styles.sub}>
            {index + 1} / {items.length}
          </p>

          <div style={styles.dotsRow}>
            {items.map((pin, i) => (
              <div
                key={pin.id}
                style={{
                  ...styles.dot,
                  background: i < index ? theme.success : i === index ? theme.accent : theme.progressTrack,
                }}
              />
            ))}
          </div>

          {image && (
            <div style={styles.imageBox}>
              <img src={image} alt={room.name} style={styles.image} draggable={false} />
              {items.map((pin) => {
                const isCurrent = pin.id === current.id
                return (
                  <div
                    key={pin.id}
                    style={{
                      ...styles.pin,
                      left: `${pin.x * 100}%`,
                      top: `${pin.y * 100}%`,
                      ...(isCurrent ? styles.pinCurrent : styles.pinIdle),
                    }}
                  >
                    {pin.number}
                  </div>
                )
              })}
            </div>
          )}

          <div style={styles.card}>
            <p style={styles.q}>
              <span style={styles.qAccent}>{current.number}번 핀</span>의 내용을 떠올려 보세요.
            </p>

            {!revealed ? (
              <button type="button" style={styles.revealBtn} onClick={() => setRevealed(true)}>
                정답 보기
              </button>
            ) : (
              <>
                <div style={styles.answer}>
                  <div style={styles.answerContent}>{current.anchor.content}</div>
                  {current.anchor.techniqueType && (
                    <div style={styles.meta}>기법: {current.anchor.techniqueType}</div>
                  )}
                  {current.anchor.associationText && (
                    <div style={styles.meta}>연상: {current.anchor.associationText}</div>
                  )}
                </div>

                <p style={styles.gradeLabel}>기억나셨나요?</p>
                <div style={styles.gradeRow}>
                  <button
                    type="button"
                    style={{ ...styles.gradeBtn, ...styles.fail }}
                    onClick={() => grade(0, '어려움')}
                    disabled={busy}
                  >
                    😵 기억 안 남
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.gradeBtn, ...styles.hard }}
                    onClick={() => grade(1, '어려움')}
                    disabled={busy}
                  >
                    😮‍💨 어려웠음
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.gradeBtn, ...styles.normal }}
                    onClick={() => grade(1, '보통')}
                    disabled={busy}
                  >
                    🙂 보통
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.gradeBtn, ...styles.easy }}
                    onClick={() => grade(1, '쉬움')}
                    disabled={busy}
                  >
                    😎 쉬웠음
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {finished && (
        <div style={styles.center}>
          <div style={styles.doneEmoji}>🎉</div>
          <h1 style={styles.doneTitle}>복습 완료!</h1>
          <p style={styles.doneSub}>
            총 {results.length}개 · 정답률 {successRate}%
          </p>

          <div style={styles.summaryList}>
            {results.map((r, i) => (
              <div key={i} style={styles.summaryRow}>
                <div style={styles.summaryLeft}>
                  <div
                    style={{
                      ...styles.summaryDot,
                      background: r.recallSuccess ? theme.success : theme.danger,
                    }}
                  />
                  {r.number}번 ({r.difficulty})
                </div>
                {typeof r.days === 'number' && (
                  <span style={styles.summaryDays}>다음 복습 {r.days}일 뒤</span>
                )}
              </div>
            ))}
          </div>

          <div style={styles.finishButtons}>
            <button type="button" style={styles.revealBtn} onClick={restart}>
              다시 복습
            </button>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate(`/rooms/${id}`)}
            >
              룸으로 돌아가기
            </button>
          </div>
        </div>
      )}
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
    marginBottom: 12,
  },
  loading: { color: theme.textMuted },
  errorText: { color: theme.dangerText },
  center: { textAlign: 'center', marginTop: 20 },
  title: { fontSize: 22, fontWeight: 800, margin: '8px 0 4px' },
  headTitle: { fontSize: 20, fontWeight: 800, marginBottom: 4 },
  sub: { color: theme.textMuted, marginBottom: 14, fontSize: 12 },
  dotsRow: { display: 'flex', gap: 5, marginBottom: 16 },
  dot: { flex: 1, height: 5, borderRadius: 3 },
  imageBox: {
    position: 'relative',
    display: 'block',
    lineHeight: 0,
    width: '100%',
    height: 280,
    borderRadius: theme.radiusMd,
    overflow: 'hidden',
    marginBottom: 16,
    background: '#333',
  },
  image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' },
  pin: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    color: theme.text,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // 배경은 투명하게 두고, 테두리와 글자 그림자로 숫자를 읽히게 합니다.
    textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.8)',
  },
  pinIdle: {
    width: 30,
    height: 30,
    background: 'transparent',
    border: `2px solid ${theme.text}`,
    opacity: 0.5,
    fontSize: 13,
  },
  pinCurrent: {
    width: 40,
    height: 40,
    background: 'transparent',
    border: `3px solid ${theme.accent}`,
    color: theme.text,
    fontSize: 16,
    boxShadow: `0 0 0 6px ${theme.accentGlow}`,
  },
  card: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusMd,
    padding: 20,
  },
  q: { fontSize: 14, fontWeight: 700, marginBottom: 14, marginTop: 0 },
  qAccent: { color: theme.accent },
  revealBtn: {
    width: '100%',
    padding: 15,
    borderRadius: theme.radiusSm,
    border: 'none',
    background: theme.accent,
    color: theme.accentText,
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  answer: {
    background: theme.cardAlt,
    borderRadius: theme.radiusSm,
    padding: 14,
    marginBottom: 16,
  },
  answerContent: { fontSize: 16, fontWeight: 800, marginBottom: 6, lineHeight: 1.5 },
  meta: { color: theme.textMuted, fontSize: 12, marginTop: 6 },
  gradeLabel: { fontWeight: 700, fontSize: 12, marginBottom: 8, color: theme.textMuted },
  gradeRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  gradeBtn: {
    padding: 13,
    borderRadius: theme.radiusSm,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  fail: { background: theme.dangerBgAlt, border: `1px solid ${theme.dangerBorder}`, color: theme.dangerText },
  hard: { background: theme.warningBg, border: `1px solid ${theme.warningBorder}`, color: theme.warningText },
  normal: { background: 'oklch(0.24 0.02 264)', border: '1px solid oklch(0.4 0.02 264)', color: 'oklch(0.85 0.01 264)' },
  easy: { background: theme.successBgAlt, border: `1px solid ${theme.successBorder}`, color: theme.successText },
  doneEmoji: { fontSize: 44, marginBottom: 8 },
  doneTitle: { fontSize: 24, fontWeight: 900, marginBottom: 6, marginTop: 0 },
  doneSub: { fontSize: 13, color: theme.textMuted, marginBottom: 22 },
  summaryList: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 22,
  },
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: '12px 16px',
  },
  summaryLeft: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 },
  summaryDot: { width: 8, height: 8, borderRadius: '50%' },
  summaryDays: { color: theme.textMuted, fontSize: 12 },
  finishButtons: { display: 'flex', flexDirection: 'column', gap: 10 },
  secondaryBtn: {
    width: '100%',
    padding: 15,
    borderRadius: theme.radiusMd,
    border: `1px solid ${theme.border}`,
    background: 'none',
    color: 'oklch(0.85 0.01 264)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  primaryLink: {
    display: 'inline-block',
    marginTop: 12,
    padding: '14px 22px',
    borderRadius: theme.radiusSm,
    background: theme.accent,
    color: theme.accentText,
    fontWeight: 700,
  },
}
