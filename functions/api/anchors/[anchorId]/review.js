// 앵커(암기 내용) 하나에 대한 "복습 기록(ReviewLog)"을 다루는 API입니다.
// 주소: /api/anchors/:anchorId/review  (POST / GET)
// 자기 룸의 앵커에만 접근할 수 있도록 소유권을 확인합니다.

async function ownsAnchor(env, userId, anchorId) {
  const row = await env.DB
    .prepare(
      `SELECT a.id FROM Anchor a
       JOIN Pin p ON p.id = a.pinId
       JOIN Room r ON r.id = p.roomId
       WHERE a.id = ? AND r.userId = ?`
    )
    .bind(anchorId, userId)
    .first()
  return !!row
}

export async function onRequestPost(context) {
  try {
    const anchorId = context.params.anchorId
    if (!(await ownsAnchor(context.env, context.data.user.id, anchorId))) {
      return Response.json({ error: '접근 권한이 없습니다.' }, { status: 404 })
    }
    const body = await context.request.json()

    const recallSuccess = body.recallSuccess ? 1 : 0
    const difficulty = ['쉬움', '보통', '어려움'].includes(body.difficulty) ? body.difficulty : '보통'
    const { nextReviewDate, days } = computeNextReview(recallSuccess, difficulty)

    const id = crypto.randomUUID()
    await context.env.DB
      .prepare(
        `INSERT INTO ReviewLog (id, anchorId, recallSuccess, difficulty, nextReviewDate)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(id, anchorId, recallSuccess, difficulty, nextReviewDate)
      .run()

    return Response.json({
      reviewLog: { id, anchorId, recallSuccess, difficulty, nextReviewDate },
      nextReviewDate,
      days,
    })
  } catch (err) {
    return Response.json({ error: '복습 기록 저장에 실패했습니다.', detail: String(err) }, { status: 500 })
  }
}

export async function onRequestGet(context) {
  try {
    const anchorId = context.params.anchorId
    if (!(await ownsAnchor(context.env, context.data.user.id, anchorId))) {
      return Response.json({ error: '접근 권한이 없습니다.' }, { status: 404 })
    }
    const { results } = await context.env.DB
      .prepare(
        `SELECT id, recallSuccess, difficulty, reviewedAt, nextReviewDate
         FROM ReviewLog WHERE anchorId = ? ORDER BY reviewedAt DESC`
      )
      .bind(anchorId)
      .all()
    return Response.json({ reviews: results })
  } catch (err) {
    return Response.json({ error: '복습 기록을 불러오지 못했습니다.', detail: String(err) }, { status: 500 })
  }
}

// 간단한 간격 반복 규칙 (실패/어려움=1일, 보통=3일, 쉬움=7일)
function computeNextReview(recallSuccess, difficulty) {
  let days = 3
  if (!recallSuccess) days = 1
  else if (difficulty === '쉬움') days = 7
  else if (difficulty === '어려움') days = 1
  else days = 3
  const d = new Date()
  d.setDate(d.getDate() + days)
  return { nextReviewDate: d.toISOString().slice(0, 10), days }
}
