// POST /api/auth/login  → 이메일/비밀번호로 로그인합니다.
import { verifyPassword, createSession, sessionCookie } from '../../_lib/auth.js'

export async function onRequestPost(context) {
  try {
    const { request, env } = context
    const body = await request.json()
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    const user = await env.DB.prepare(
      'SELECT id, email, displayName, passwordHash, passwordSalt FROM User WHERE email = ?'
    )
      .bind(email)
      .first()

    // 이메일이 없거나 비밀번호가 틀리면 동일한 메시지 (어느 쪽이 틀렸는지 알려주지 않음)
    const ok = user && (await verifyPassword(password, user.passwordSalt, user.passwordHash))
    if (!ok) {
      return Response.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    const { token, expires } = await createSession(env.DB, user.id)
    return Response.json(
      { user: { id: user.id, email: user.email, displayName: user.displayName } },
      { headers: { 'Set-Cookie': sessionCookie(request, token, expires) } }
    )
  } catch (err) {
    return Response.json({ error: '로그인에 실패했습니다.', detail: String(err) }, { status: 500 })
  }
}
