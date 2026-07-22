// 이 미들웨어는 /api/* 로 오는 모든 요청보다 먼저 실행됩니다.
// 로그인(세션)을 확인해서, 로그인한 사용자만 데이터 API에 접근하도록 막습니다.
// 확인된 사용자는 context.data.user 에 담아 각 API 핸들러가 쓸 수 있게 합니다.
import { getUserFromSession } from '../_lib/auth.js'

// 로그인 없이도 접근 가능한 경로(공개 경로)
//   - /api/auth/*   : 회원가입/로그인/로그아웃/내정보
//   - /api/images/* : 사진 파일(키를 알아야만 접근, <img>로 표시하기 위함)
function isPublic(pathname) {
  return pathname.startsWith('/api/auth/') || pathname.startsWith('/api/images/')
}

export async function onRequest(context) {
  const { request, env, next, data } = context
  const { pathname } = new URL(request.url)

  if (isPublic(pathname)) return next()

  const user = await getUserFromSession(request, env)
  if (!user) {
    return Response.json(
      { error: '로그인이 필요합니다.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    )
  }

  data.user = user
  return next()
}
