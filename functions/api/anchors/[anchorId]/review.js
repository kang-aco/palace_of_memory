// 앵커(암기 내용) 하나에 대한 "복습 기록(ReviewLog)"을 다루는 API입니다.
// 주소: /api/anchors/:anchorId/review
//   - POST : 복습 결과 1건을 기록합니다. 다음 복습 예정일은 서버가 계산합니다.
//   - GET  : 이 앵커의 복습 기록 목록(최신순)을 가져옵니다.

export async function onRequestPost(context) {
  try {
    const anchorId = context.params.anchorId
    const body = await context.request.json()

    // recallSuccess: 1(기억함) / 0(기억 못함)
    const recallSuccess = body.recallSuccess ? 1 : 0
    // difficulty: 쉬움 / 보통 / 어려움 (없으면 보통)
    const difficulty = ['쉬움', '보통', '어려움'].includes(body.difficulty)
      ? body.difficulty
      : '보통'

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
    return Response.json(
      { error: '복습 기록 저장에 실패했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

export async function onRequestGet(context) {
  try {
    const anchorId = context.params.anchorId
    const { results } = await context.env.DB
      .prepare(
        `SELECT id, recallSuccess, difficulty, reviewedAt, nextReviewDate
         FROM ReviewLog WHERE anchorId = ? ORDER BY reviewedAt DESC`
      )
      .bind(anchorId)
      .all()
    return Response.json({ reviews: results })
  } catch (err) {
    return Response.json(
      { error: '복습 기록을 불러오지 못했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

// 아주 단순한 간격 반복(spaced repetition) 규칙입니다.
//   - 기억 못하면        → 1일 뒤 다시
//   - 기억함 + 어려움    → 1일 뒤
//   - 기억함 + 보통      → 3일 뒤
//   - 기억함 + 쉬움      → 7일 뒤
// 반환: { nextReviewDate: 'YYYY-MM-DD', days }
function computeNextReview(recallSuccess, difficulty) {
  let days = 3
  if (!recallSuccess) {
    days = 1
  } else if (difficulty === '쉬움') {
    days = 7
  } else if (difficulty === '어려움') {
    days = 1
  } else {
    days = 3
  }
  const d = new Date()
  d.setDate(d.getDate() + days)
  return { nextReviewDate: d.toISOString().slice(0, 10), days }
}
