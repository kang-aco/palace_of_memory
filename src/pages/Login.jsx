import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import theme, { floatUp } from '../theme.js'

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
      <div style={styles.logo}>M</div>
      <div style={styles.title}>메모리룸</div>
      <p style={styles.sub}>사진 위에 핀을 찍고, 게임처럼 복습하세요</p>

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
              placeholder="닉네임"
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
    ...floatUp,
    paddingTop: 40,
    textAlign: 'center',
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 15,
    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentEnd})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 22,
    margin: '0 auto 14px',
    color: theme.accentText,
  },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 6 },
  sub: { fontSize: 13, color: theme.textMuted, marginBottom: 28 },
  tabs: {
    display: 'flex',
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    border: 'none',
    borderRadius: 11,
    padding: 11,
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    background: 'transparent',
    color: theme.textMuted2,
    fontFamily: 'inherit',
  },
  tabActive: { background: theme.accent, color: theme.accentText },
  card: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 18,
    padding: 22,
    textAlign: 'left',
  },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: theme.textMuted2, marginBottom: 6, marginTop: 14 },
  input: {
    width: '100%',
    background: theme.cardAlt,
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    padding: '12px 13px',
    color: theme.text,
    fontSize: 13,
    fontFamily: 'inherit',
  },
  error: { color: theme.dangerText, marginTop: 12, fontSize: 13 },
  submit: {
    width: '100%',
    marginTop: 20,
    background: theme.accent,
    border: 'none',
    borderRadius: 12,
    padding: 14,
    color: theme.accentText,
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  hint: { fontSize: 12, color: theme.textMuted3, marginTop: 18 },
  linkBtn: {
    border: 'none',
    background: 'none',
    color: theme.accent,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    padding: 0,
    fontFamily: 'inherit',
  },
}
