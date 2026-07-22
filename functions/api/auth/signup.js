// POST /api/auth/signup  → 새 계정을 만들고 바로 로그인 상태로 만듭니다.
import { hashPassword, createSession, sessionCookie } from '../../_lib/auth.js'

export async function onRequestPost(context) {
  try {
    const { request, env } = context
    const body = await request.json()

    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''
    const displayName = (body.displayName ?? '').trim() || email.split('@')[0]

    if (!email || !email.includes('@')) {
      return Response.json({ error: '올바른 이메일을 입력해 주세요.' }, { status: 400 })
    }
    if (password.length < 6) {
      return Response.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }

    // 이미 가입된 이메일인지 확인
    const existing = await env.DB.prepare('SELECT id FROM User WHERE email = ?')
      .bind(email)
      .first()
    if (existing) {
      return Response.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 })
    }

    const { hashHex, saltHex } = await hashPassword(password)
    const id = crypto.randomUUID()
    await env.DB.prepare(
      'INSERT INTO User (id, email, displayName, passwordHash, passwordSalt) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(id, email, displayName, hashHex, saltHex)
      .run()

    const { token, expires } = await createSession(env.DB, id)
    return Response.json(
      { user: { id, email, displayName } },
      { headers: { 'Set-Cookie': sessionCookie(request, token, expires) } }
    )
  } catch (err) {
    return Response.json({ error: '회원가입에 실패했습니다.', detail: String(err) }, { status: 500 })
  }
}
