import { useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fileToResizedDataUrl, sampleUrlToDataUrl } from '../lib/image.js'
import { SAMPLE_IMAGES } from '../data/samples.js'
import theme, { floatUp } from '../theme.js'

// 2단계 핵심 화면입니다.
//  1) 룸 이름을 적고
//  2) 사진을 한 장 올리고
//  3) 사진 위를 클릭해서 핀(번호)을 여러 개 찍은 다음
//  4) 저장하면 D1에 Room + Pin들이 함께 저장됩니다.
export default function NewRoom() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState(null)
  const [pins, setPins] = useState([]) // [{ x, y, number }]  x,y는 0~1 비율
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const imgRef = useRef(null)

  // 사진 선택 → 축소 후 미리보기로 표시. 사진을 바꾸면 기존 핀은 초기화합니다.
  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const dataUrl = await fileToResizedDataUrl(file)
      setImageDataUrl(dataUrl)
      setPins([])
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  // 예시 이미지 하나를 골라 룸 사진으로 사용합니다. (업로드와 동일한 저장 방식)
  async function useSample(sample) {
    setError('')
    try {
      const dataUrl = await sampleUrlToDataUrl(sample.file)
      setImageDataUrl(dataUrl)
      setPins([])
      if (!name.trim()) setName(sample.label) // 이름이 비어 있으면 장소 이름을 기본값으로
    } catch (err) {
      setError(String(err.message || err))
    }
  }

  // 사진 위를 클릭하면 그 위치에 새 핀을 추가합니다.
  // 클릭 좌표를 이미지 크기로 나눠 0~1 비율로 저장 → 화면 크기가 달라져도 위치가 유지됩니다.
  function handleImageClick(e) {
    const rect = imgRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    if (x < 0 || x > 1 || y < 0 || y > 1) return

    setPins((prev) => [...prev, { x, y, number: prev.length + 1 }])
  }

  // 핀을 클릭하면 그 핀을 지우고 나머지 번호를 다시 매깁니다.
  function removePin(indexToRemove, e) {
    e.stopPropagation() // 사진 클릭(=핀 추가)으로 번지지 않게 막습니다.
    setPins((prev) =>
      prev
        .filter((_, i) => i !== indexToRemove)
        .map((p, i) => ({ ...p, number: i + 1 }))
    )
  }

  function undoLastPin() {
    setPins((prev) => prev.slice(0, -1))
  }

  function clearPins() {
    setPins([])
  }

  async function handleSave() {
    setError('')
    if (!imageDataUrl) {
      setError('사진을 먼저 한 장 올려주세요.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category: category.trim() || null,
          imageDataUrl,
          pins,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '저장에 실패했습니다.')
      }
      const data = await res.json()
      // 저장 성공 → 방금 만든 룸 상세 화면으로 이동
      navigate(`/rooms/${data.id}`)
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.wrap}>
      <Link to="/" style={styles.back}>
        ← 홈으로
      </Link>
      <div style={styles.title}>새 룸 만들기</div>

      <div style={styles.label}>룸 이름</div>
      <input
        style={styles.input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="예: 조선 왕 순서 외우기"
      />

      <div style={styles.label}>카테고리 (선택)</div>
      <input
        style={styles.input}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="예: 한국사"
      />

      <div style={styles.label}>사진</div>
      <input type="file" accept="image/*" onChange={handleFile} style={styles.fileInput} />

      <div style={styles.sampleHead}>
        <span>사진이 없다면 예시 장소에서 골라보세요</span>
        <Link to="/guide" style={styles.guideLink}>
          📖 기억법 가이드
        </Link>
      </div>
      <div style={styles.sampleGrid}>
        {SAMPLE_IMAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            style={styles.sampleCard}
            onClick={() => useSample(s)}
            title={`${s.label} 예시 사용`}
          >
            <div style={styles.sampleThumbWrap}>
              <img src={s.file} alt={s.label} style={styles.sampleThumb} />
              <span style={styles.sampleLabel}>
                {s.emoji} {s.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {imageDataUrl && (
        <>
          <p style={styles.hint}>
            사진 위를 <b>클릭</b>하면 번호 핀이 찍힙니다. 핀을 <b>다시 클릭</b>하면
            지워집니다. (현재 {pins.length}개)
          </p>

          <div style={styles.imageBox}>
            <img
              ref={imgRef}
              src={imageDataUrl}
              alt="업로드한 사진"
              style={styles.image}
              onClick={handleImageClick}
              draggable={false}
            />
            {pins.map((pin, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => removePin(i, e)}
                title="클릭하면 이 핀을 지웁니다"
                style={{
                  ...styles.pin,
                  left: `${pin.x * 100}%`,
                  top: `${pin.y * 100}%`,
                }}
              >
                {pin.number}
              </button>
            ))}
          </div>

          <div style={styles.pinButtons}>
            <button type="button" style={styles.smallBtn} onClick={undoLastPin} disabled={!pins.length}>
              마지막 핀 취소
            </button>
            <button type="button" style={styles.smallBtn} onClick={clearPins} disabled={!pins.length}>
              전체 지우기
            </button>
          </div>
        </>
      )}

      {error && <p style={styles.error}>⚠️ {error}</p>}

      <button
        type="button"
        style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '저장 중...' : '룸 저장하고 핀 찍으러 가기 →'}
      </button>
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
  label: { fontSize: 12, fontWeight: 700, color: theme.textMuted2, marginBottom: 6, marginTop: 16 },
  input: {
    width: '100%',
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    padding: '13px 14px',
    color: theme.text,
    fontSize: 14,
    fontFamily: 'inherit',
  },
  fileInput: {
    width: '100%',
    color: theme.textMuted2,
    fontSize: 13,
  },
  hint: { marginTop: 16, color: theme.textMuted3, fontSize: 13, lineHeight: 1.6 },
  sampleHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    color: theme.textMuted,
  },
  guideLink: { color: theme.accent, whiteSpace: 'nowrap', fontWeight: 600 },
  sampleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 20,
  },
  sampleCard: {
    cursor: 'pointer',
    borderRadius: theme.radiusSm,
    overflow: 'hidden',
    border: `2px solid ${theme.border}`,
    position: 'relative',
    padding: 0,
    background: 'none',
  },
  sampleThumbWrap: { position: 'relative', width: '100%', height: 64 },
  sampleThumb: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  sampleLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'oklch(0.1 0.02 264 / 0.7)',
    padding: '3px 5px',
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'center',
    color: theme.text,
  },
  imageBox: {
    position: 'relative',
    display: 'block',
    lineHeight: 0,
    borderRadius: theme.radiusLg,
    overflow: 'hidden',
    border: `1px solid ${theme.border}`,
    cursor: 'crosshair',
    width: '100%',
  },
  image: { width: '100%', display: 'block', userSelect: 'none' },
  pin: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: theme.dangerBg,
    color: theme.text,
    border: `3px solid ${theme.danger}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  pinButtons: { display: 'flex', gap: 8, marginTop: 12 },
  smallBtn: {
    padding: '8px 12px',
    borderRadius: theme.radiusInput,
    border: `1px solid ${theme.border}`,
    background: theme.card,
    color: theme.textMuted2,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
  },
  error: { color: theme.dangerText, marginTop: 16, fontSize: 14 },
  saveBtn: {
    display: 'block',
    width: '100%',
    marginTop: 24,
    background: theme.accent,
    border: 'none',
    borderRadius: theme.radiusMd,
    padding: 16,
    color: theme.accentText,
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
