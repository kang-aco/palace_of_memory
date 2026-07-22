import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

// 로그인 / 회원가입 화면입니다. (하나의 화면에서 탭으로 전환)
export default function Login() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(email, password, displayName)
      // 성공하면 AuthProvider가 user를 채우고, App이 자동으로 앱 화면으로 바뀝니다.
    } catch (err) {
      setError(String(err.message || err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>🏠 메모리룸</h1>
      <p style={styles.sub}>사진 위에 핀을 찍어 기억을 저장하세요</p>

      <div style={styles.tabs}>
        <button
          type="button"
          style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }}
          onClick={() => { setMode('login'); setError('') }}
        >
          로그인
        </button>
        <button
          type="button"
          style={{ ...styles.tab, ...(mode === 'signup' ? styles.tabActive : {}) }}
          onClick={() => { setMode('signup'); setError('') }}
        >
          회원가입
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.card}>
        {mode === 'signup' && (
          <>
            <label style={styles.label}>이름 (선택)</label>
            <input
              style={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 홍길동"
            />
          </>
        )}

        <label style={styles.label}>이메일</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <label style={styles.label}>비밀번호</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? '6자 이상' : '비밀번호'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          required
        />

        {error && <p style={styles.error}>⚠️ {error}</p>}

        <button type="submit" style={{ ...styles.submit, opacity: busy ? 0.6 : 1 }} disabled={busy}>
          {busy ? '처리 중...' : mode === 'login' ? '로그인' : '가입하고 시작하기'}
        </button>
      </form>

      <p style={styles.hint}>
        {mode === 'login' ? '처음이신가요? ' : '이미 계정이 있으신가요? '}
        <button
          type="button"
          style={styles.linkBtn}
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
        >
          {mode === 'login' ? '회원가입' : '로그인'}
        </button>
      </p>
    </div>
  )
}

const styles = {
  wrap: {
    maxWidth: 400,
    margin: '60px auto',
    padding: '0 20px',
    fontFamily: 'system-ui, sans-serif',
    textAlign: 'center',
  },
  title: { fontSize: 28, marginBottom: 4 },
  sub: { color: '#64748b', marginBottom: 28 },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    padding: '10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 15,
    color: '#64748b',
  },
  tabActive: { background: '#2563eb', color: '#fff', borderColor: '#2563eb', fontWeight: 700 },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 20,
    textAlign: 'left',
  },
  label: { display: 'block', marginTop: 12, marginBottom: 6, fontWeight: 600, fontSize: 14 },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 15,
    boxSizing: 'border-box',
  },
  error: { color: '#e11d48', marginTop: 12, fontSize: 14 },
  submit: {
    width: '100%',
    marginTop: 18,
    padding: '13px',
    borderRadius: 10,
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  hint: { marginTop: 18, color: '#64748b', fontSize: 14 },
  linkBtn: {
    border: 'none',
    background: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    padding: 0,
  },
}
