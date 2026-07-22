// GET /api/auth/me  → 지금 로그인한 사용자 정보를 돌려줍니다. (없으면 user: null)
// 앱이 처음 열릴 때 "로그인 상태인지"를 확인하는 데 씁니다.
import { getUserFromSession } from '../../_lib/auth.js'

export async function onRequestGet(context) {
  const user = await getUserFromSession(context.request, context.env)
  return Response.json({ user: user || null })
}
