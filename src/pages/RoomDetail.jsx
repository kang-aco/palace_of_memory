import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { isSpeechSupported, startDictation } from '../lib/speech.js'
import theme, { floatUp } from '../theme.js'

// 암기 기법 목록 (schema.sql의 techniqueType 주석과 동일)
const TECHNIQUES = ['숫자변환법', '문자변환법', '연상기억법', '기초결합법']

// 3단계 화면입니다.
//  - 저장된 사진 위에 핀들을 보여주고
//  - 핀을 클릭하면 그 핀의 "암기 내용(앵커)"을 아래 편집 패널에서 입력/수정/삭제합니다.
//  - 내용이 저장된 핀은 초록색, 아직 비어있는 핀은 빨간색으로 구분됩니다.
export default function RoomDetail() {
  const { id } = useParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'ok' | 'error'
  const [room, setRoom] = useState(null)
  const [pins, setPins] = useState([])
  const [selectedPinId, setSelectedPinId] = useState(null)

  useEffect(() => {
    loadRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function loadRoom() {
    fetch(`/api/rooms/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('불러오기 실패')
        return res.json()
      })
      .then((data) => {
        setRoom(data.room)
        setPins(data.pins || [])
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }

  // 편집 패널에서 저장/삭제가 끝나면, 해당 핀의 앵커만 갱신해 화면에 반영합니다.
  function applyAnchorChange(pinId, anchor) {
    setPins((prev) => prev.map((p) => (p.id === pinId ? { ...p, anchor } : p)))
  }

  const image = room?.imageUrls?.[0] || null
  const selectedPin = pins.find((p) => p.id === selectedPinId) || null
  const filledCount = pins.filter((p) => p.anchor).length

  return (
    <div style={styles.wrap}>
      <Link to="/" style={styles.back}>
        ← 홈으로
      </Link>

      {status === 'loading' && <p style={styles.loading}>⏳ 불러오는 중...</p>}
      {status === 'error' && <p style={styles.errorText}>⚠️ 룸을 불러오지 못했어요.</p>}

      {status === 'ok' && room && (
        <>
          <div style={styles.titleRow}>
            <div style={styles.title}>{room.name}</div>
            {room.category && <div style={styles.categoryBadge}>{room.category}</div>}
          </div>
          <p style={styles.sub}>
            핀 {pins.length}개 · 내용 채움 {filledCount}/{pins.length}
          </p>

          {filledCount > 0 && (
            <Link to={`/rooms/${room.id}/review`} style={styles.reviewBtn}>
              🧠 복습 시작하기 ({filledCount}개)
            </Link>
          )}

          {image ? (
            <div style={styles.imageBox}>
              <img src={image} alt={room.name} style={styles.image} draggable={false} />
              {pins.map((pin) => {
                const filled = !!pin.anchor
                const selected = pin.id === selectedPinId
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => setSelectedPinId(pin.id)}
                    title={filled ? pin.anchor.content : '내용을 입력하려면 클릭'}
                    style={{
                      ...styles.pin,
                      left: `${pin.x * 100}%`,
                      top: `${pin.y * 100}%`,
                      ...(selected
                        ? styles.pinSelected
                        : filled
                        ? styles.pinFilled
                        : styles.pinEmpty),
                    }}
                  >
                    {pin.number}
                  </button>
                )
              })}
            </div>
          ) : (
            <p style={styles.sub}>이 룸에는 저장된 사진이 없습니다.</p>
          )}

          {selectedPin ? (
            <AnchorEditor
              key={selectedPin.id}
              pin={selectedPin}
              onSaved={(anchor) => applyAnchorChange(selectedPin.id, anchor)}
              onDeleted={() => applyAnchorChange(selectedPin.id, null)}
              onClose={() => setSelectedPinId(null)}
            />
          ) : (
            pins.length > 0 && (
              <p style={styles.help}>
                👆 사진 위의 번호 핀을 클릭하면 그 핀의 암기 내용을 입력할 수 있어요.
              </p>
            )
          )}

          <Link to="/rooms/new" style={styles.link}>
            + 새 룸 하나 더 만들기
          </Link>
        </>
      )}
    </div>
  )
}

// 핀 하나의 암기 내용을 입력/수정/삭제하는 편집 패널
function AnchorEditor({ pin, onSaved, onDeleted, onClose }) {
  const a = pin.anchor
  const [content, setContent] = useState(a?.content ?? '')
  const [techniqueType, setTechniqueType] = useState(a?.techniqueType ?? '')
  const [associationText, setAssociationText] = useState(a?.associationText ?? '')
  const [inputMethod, setInputMethod] = useState(a?.inputMethod ?? 'text')
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function handleDictate() {
    setError('')
    setListening(true)
    startDictation({
      onResult: (text) => {
        // 인식된 문장을 기존 내용 뒤에 이어붙이고, 입력 방식을 'voice'로 표시합니다.
        setContent((prev) => (prev ? prev + ' ' + text : text))
        setInputMethod('voice')
      },
      onEnd: () => setListening(false),
      onError: (err) => {
        setError(String(err.message || err))
        setListening(false)
      },
    })
  }

  async function handleSave() {
    setError('')
    if (!content.trim()) {
      setError('암기 내용을 입력해 주세요.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/pins/${pin.id}/anchor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          techniqueType: techniqueType || null,
          associationText,
          inputMethod,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '저장 실패')
      }
      const data = await res.json()
      onSaved(data.anchor)
      onClose()
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/pins/${pin.id}/anchor`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      onDeleted()
      onClose()
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={styles.editor}>
      <div style={styles.editorHead}>
        <div style={styles.editorHeadTitle}>{pin.number}번 핀의 암기 내용</div>
        <button type="button" onClick={onClose} style={styles.closeBtn} aria-label="닫기">
          ✕
        </button>
      </div>

      {a?.lastReview && (
        <div style={styles.reviewStatus}>
          최근 복습: {a.lastReview.recallSuccess ? '✅ 성공' : '❌ 실패'}
          {a.lastReview.difficulty ? ` (${a.lastReview.difficulty})` : ''}
          {a.lastReview.nextReviewDate ? ` · 다음 예정 ${a.lastReview.nextReviewDate}` : ''}
        </div>
      )}

      <div style={styles.labelRow}>
        <span style={styles.label}>암기 내용 *</span>
        {isSpeechSupported() && (
          <button
            type="button"
            onClick={handleDictate}
            disabled={listening}
            style={styles.micBtn}
          >
            {listening ? '🎙️ 듣는 중...' : '🎙️ 음성으로 입력'}
          </button>
        )}
      </div>
      <textarea
        style={styles.textarea}
        rows={2}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setInputMethod('text')
        }}
        placeholder="이 핀에 외울 내용을 직접 적어주세요."
      />

      <div style={styles.label}>암기 기법 (선택)</div>
      <div style={styles.pillRow}>
        {TECHNIQUES.map((t) => {
          const active = techniqueType === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTechniqueType(active ? '' : t)}
              style={{ ...styles.pill, ...(active ? styles.pillActive : {}) }}
            >
              {t}
            </button>
          )
        })}
      </div>

      <div style={styles.label}>연상 스토리 (선택)</div>
      <textarea
        style={styles.textarea}
        rows={2}
        value={associationText}
        onChange={(e) => setAssociationText(e.target.value)}
        placeholder="어떻게 연상해서 외웠는지 메모해두면 복습에 도움이 됩니다."
      />

      {error && <p style={styles.error}>⚠️ {error}</p>}

      <div style={styles.editorButtons}>
        <button
          type="button"
          style={{ ...styles.saveBtn, opacity: busy ? 0.6 : 1 }}
          onClick={handleSave}
          disabled={busy}
        >
          {busy ? '처리 중...' : '저장'}
        </button>
        {a && (
          <button type="button" style={styles.deleteBtn} onClick={handleDelete} disabled={busy}>
            내용 삭제
          </button>
        )}
      </div>
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
  titleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 },
  title: { fontSize: 22, fontWeight: 800 },
  categoryBadge: {
    fontSize: 11,
    fontWeight: 700,
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: '4px 9px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  sub: { fontSize: 12, color: theme.textMuted, marginBottom: 14 },
  imageBox: {
    position: 'relative',
    display: 'block',
    lineHeight: 0,
    width: '100%',
    height: 340,
    borderRadius: theme.radiusMd,
    overflow: 'hidden',
    marginBottom: 14,
    background: '#333',
  },
  image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' },
  pin: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    width: 34,
    height: 34,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    padding: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
  },
  pinEmpty: { background: theme.dangerBg, border: `3px solid ${theme.danger}`, color: theme.text },
  pinFilled: { background: theme.successBg, border: `3px solid ${theme.success}`, color: theme.text },
  pinSelected: {
    background: theme.accent,
    border: '3px solid white',
    color: theme.accentText,
    boxShadow: `0 0 0 5px ${theme.accentGlow}`,
  },
  help: { color: theme.textMuted3, fontSize: 12, marginTop: 0, marginBottom: 16, lineHeight: 1.6 },
  reviewBtn: {
    display: 'block',
    textAlign: 'center',
    background: theme.success,
    border: 'none',
    borderRadius: theme.radiusMd,
    padding: 15,
    color: theme.successDarkText,
    fontWeight: 800,
    fontSize: 14,
    marginBottom: 14,
  },
  reviewStatus: {
    marginTop: 4,
    marginBottom: 10,
    padding: '8px 10px',
    borderRadius: 8,
    background: theme.cardAlt,
    color: theme.accentSoftText2,
    fontSize: 13,
  },
  editor: {
    background: theme.card,
    border: `1px solid ${theme.accent}`,
    borderRadius: theme.radiusMd,
    padding: 18,
  },
  editorHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  editorHeadTitle: { fontSize: 14, fontWeight: 800 },
  closeBtn: { background: 'none', border: 'none', color: theme.textMuted, fontSize: 16, cursor: 'pointer' },
  labelRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  label: { fontSize: 11, fontWeight: 700, color: theme.textMuted2, marginBottom: 6, display: 'block' },
  micBtn: {
    marginLeft: 'auto',
    padding: '4px 10px',
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: theme.cardAlt,
    color: theme.textMuted2,
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    background: theme.cardAlt,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusInput,
    padding: '10px 12px',
    color: theme.text,
    fontSize: 13,
    marginBottom: 12,
    fontFamily: 'inherit',
    resize: 'none',
  },
  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  pill: {
    cursor: 'pointer',
    padding: '6px 11px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: theme.cardAlt,
    color: 'oklch(0.75 0.02 264)',
    border: `1px solid oklch(0.32 0.025 264)`,
    fontFamily: 'inherit',
  },
  pillActive: { background: theme.accent, color: theme.accentText, border: `1px solid ${theme.accent}` },
  error: { color: theme.dangerText, marginTop: 4, marginBottom: 4, fontSize: 13 },
  editorButtons: { display: 'flex', gap: 8, marginTop: 4 },
  saveBtn: {
    flex: 1,
    padding: 13,
    borderRadius: theme.radiusSm,
    border: 'none',
    background: theme.accent,
    color: theme.accentText,
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  deleteBtn: {
    padding: '13px 16px',
    borderRadius: theme.radiusSm,
    border: `1px solid ${theme.dangerBorder}`,
    background: 'none',
    color: theme.dangerText,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  link: {
    display: 'inline-block',
    marginTop: 20,
    color: theme.accent,
    fontWeight: 600,
    fontSize: 13,
  },
}
