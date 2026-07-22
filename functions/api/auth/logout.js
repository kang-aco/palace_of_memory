// POST /api/auth/logout  → 현재 세션을 없애고 쿠키를 지웁니다.
import { readCookie, deleteSession, clearCookie } from '../../_lib/auth.js'

export async function onRequestPost(context) {
  const { request, env } = context
  const token = readCookie(request, 'session')
  await deleteSession(env.DB, token)
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': clearCookie(request) } })
}
