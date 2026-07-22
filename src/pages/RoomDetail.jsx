import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { isSpeechSupported, startDictation } from '../lib/speech.js'

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
      <div style={styles.topbar}>
        <Link to="/" style={styles.back}>
          ← 홈으로
        </Link>
      </div>

      {status === 'loading' && <p>⏳ 불러오는 중...</p>}
      {status === 'error' && <p style={{ color: '#e11d48' }}>⚠️ 룸을 불러오지 못했어요.</p>}

      {status === 'ok' && room && (
        <>
          <h1 style={styles.title}>{room.name}</h1>
          <p style={styles.sub}>
            {room.category ? `${room.category} · ` : ''}핀 {pins.length}개 · 내용 채움{' '}
            {filledCount}/{pins.length}
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
                      background: filled ? '#16a34a' : '#e11d48',
                      outline: selected ? '3px solid #fbbf24' : 'none',
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
        <b>{pin.number}번 핀</b>의 암기 내용
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

      <label style={styles.label}>
        암기 내용 *
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
      </label>
      <textarea
        style={styles.textarea}
        rows={3}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          setInputMethod('text')
        }}
        placeholder="이 핀에 외울 내용을 직접 적어주세요."
      />

      <label style={styles.label}>암기 기법 (선택)</label>
      <select
        style={styles.input}
        value={techniqueType}
        onChange={(e) => setTechniqueType(e.target.value)}
      >
        <option value="">선택 안 함</option>
        {TECHNIQUES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <label style={styles.label}>연상 스토리 (선택)</label>
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
  wrap: {
    maxWidth: 520,
    margin: '40px auto',
    padding: '0 20px',
    fontFamily: 'system-ui, sans-serif',
  },
  topbar: { marginBottom: 16 },
  back: { color: '#2563eb', textDecoration: 'none', fontSize: 14 },
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
    transform: 'translate(-50%, -50%)',
    width: 30,
    height: 30,
    borderRadius: '50%',
    color: '#fff',
    border: '2px solid #fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  help: { color: '#475569', fontSize: 14, marginTop: 16, lineHeight: 1.6 },
  reviewBtn: {
    display: 'block',
    textAlign: 'center',
    padding: '12px',
    borderRadius: 10,
    background: '#16a34a',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    textDecoration: 'none',
    marginBottom: 18,
  },
  reviewStatus: {
    marginTop: 10,
    padding: '8px 10px',
    borderRadius: 8,
    background: '#eff6ff',
    color: '#1e40af',
    fontSize: 13,
  },
  editor: {
    marginTop: 20,
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 16,
    background: '#f8fafc',
  },
  editorHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 15,
    marginBottom: 8,
  },
  closeBtn: {
    border: 'none',
    background: 'transparent',
    fontSize: 16,
    cursor: 'pointer',
    color: '#64748b',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
    fontWeight: 600,
    fontSize: 14,
  },
  micBtn: {
    marginLeft: 'auto',
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #cbd5e1',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 15,
    boxSizing: 'border-box',
    background: '#fff',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 15,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  error: { color: '#e11d48', marginTop: 12, fontSize: 14 },
  editorButtons: { display: 'flex', gap: 8, marginTop: 16 },
  saveBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid #fecaca',
    background: '#fff',
    color: '#e11d48',
    fontSize: 15,
    cursor: 'pointer',
  },
  link: {
    display: 'inline-block',
    marginTop: 24,
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 600,
  },
}
