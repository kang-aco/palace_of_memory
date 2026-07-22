import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

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
      <div style={styles.topbar}>
        <Link to={`/rooms/${id}`} style={styles.back}>
          ← 룸으로
        </Link>
      </div>

      {status === 'loading' && <p>⏳ 불러오는 중...</p>}
      {status === 'error' && <p style={{ color: '#e11d48' }}>⚠️ 불러오지 못했어요.</p>}

      {status === 'ok' && items.length === 0 && (
        <div style={styles.center}>
          <h1 style={styles.title}>복습할 내용이 없어요</h1>
          <p style={styles.sub}>
            먼저 룸에서 핀에 암기 내용을 저장해 주세요.
          </p>
          <Link to={`/rooms/${id}`} style={styles.primaryLink}>
            룸으로 돌아가기
          </Link>
        </div>
      )}

      {status === 'ok' && !finished && current && (
        <>
          <h1 style={styles.title}>{room.name} · 복습</h1>
          <p style={styles.sub}>
            {index + 1} / {items.length}
          </p>

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
                      background: isCurrent ? '#2563eb' : '#cbd5e1',
                      opacity: isCurrent ? 1 : 0.5,
                      transform: `translate(-50%, -50%) scale(${isCurrent ? 1.25 : 1})`,
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
              <b>{current.number}번 핀</b>의 내용을 떠올려 보세요.
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
          <h1 style={styles.title}>복습 완료! 🎉</h1>
          <p style={styles.sub}>
            총 {results.length}개 · 성공{' '}
            {results.filter((r) => r.recallSuccess).length}개 · 실패{' '}
            {results.filter((r) => !r.recallSuccess).length}개
          </p>

          <div style={styles.summaryList}>
            {results.map((r, i) => (
              <div key={i} style={styles.summaryRow}>
                <span>
                  {r.recallSuccess ? '✅' : '❌'} {r.number}번 ({r.difficulty})
                </span>
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
  wrap: {
    maxWidth: 520,
    margin: '40px auto',
    padding: '0 20px',
    fontFamily: 'system-ui, sans-serif',
  },
  topbar: { marginBottom: 16 },
  back: { color: '#2563eb', textDecoration: 'none', fontSize: 14 },
  center: { textAlign: 'center', marginTop: 40 },
  title: { fontSize: 24, margin: '8px 0 4px' },
  sub: { color: '#64748b', marginBottom: 20 },
  imageBox: {
    position: 'relative',
    display: 'inline-block',
    lineHeight: 0,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    width: '100%',
  },
  image: { width: '100%', display: 'block', userSelect: 'none' },
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: '50%',
    color: '#fff',
    border: '2px solid #fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    fontWeight: 700,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: 20,
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 20,
    background: '#f8fafc',
  },
  q: { fontSize: 16, marginBottom: 16 },
  revealBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 10,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  answer: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  answerContent: { fontSize: 18, fontWeight: 700, lineHeight: 1.5 },
  meta: { color: '#64748b', fontSize: 14, marginTop: 6 },
  gradeLabel: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
  gradeRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  gradeBtn: {
    padding: '12px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  fail: { background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' },
  hard: { background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' },
  normal: { background: '#f8fafc', borderColor: '#cbd5e1', color: '#334155' },
  easy: { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' },
  summaryList: {
    textAlign: 'left',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 6px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 14,
  },
  summaryDays: { color: '#64748b' },
  finishButtons: { display: 'flex', flexDirection: 'column', gap: 10 },
  secondaryBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    background: '#fff',
    fontSize: 15,
    cursor: 'pointer',
  },
  primaryLink: {
    display: 'inline-block',
    marginTop: 12,
    padding: '12px 20px',
    borderRadius: 10,
    background: '#2563eb',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 700,
  },
}
