// GET /api/stats  → 학습 통계 대시보드에 쓰는 숫자들을 한 번에 계산해서 돌려줍니다.
//
// ※ 이 앱은 아직 로그인(사용자 구분)이 없으므로, 통계는 "이 데이터베이스 전체"
//   기준으로 계산합니다. (1인 사용 가정) 나중에 로그인이 생기면 userId로 필터링만
//   추가하면 됩니다.
export async function onRequestGet(context) {
  try {
    const DB = context.env.DB

    // 1) 전체 개수: 룸 / 암기 항목(앵커) / 복습 횟수
    const counts = await DB
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM Room)      AS totalRooms,
           (SELECT COUNT(*) FROM Anchor)    AS totalAnchors,
           (SELECT COUNT(*) FROM ReviewLog) AS totalReviews`
      )
      .first()

    // 2) 오늘 복습 수 + 전체 정답 수 (정답률 계산용)
    const today = await DB
      .prepare(
        `SELECT
           SUM(CASE WHEN date(reviewedAt) = date('now') THEN 1 ELSE 0 END) AS reviewedToday,
           SUM(recallSuccess) AS successes,
           COUNT(*) AS total
         FROM ReviewLog`
      )
      .first()

    const successes = today?.successes ?? 0
    const total = today?.total ?? 0
    const successRate = total > 0 ? Math.round((successes / total) * 100) : null

    // 3) 복습한 날짜(중복 제거) → 연속 복습 일수(streak) 계산
    const { results: dateRows } = await DB
      .prepare(`SELECT DISTINCT date(reviewedAt) AS d FROM ReviewLog ORDER BY d DESC`)
      .all()
    const streakDays = computeStreak(dateRows.map((r) => r.d))

    // 4) 복습 예정(due) / 신규(아직 한 번도 복습 안 함) 개수
    //    각 앵커의 "가장 최근 복습"의 다음 예정일(nextReviewDate)을 기준으로 셉니다.
    const dueRow = await DB
      .prepare(
        `SELECT
           SUM(CASE WHEN nextDate IS NULL THEN 1 ELSE 0 END) AS newCount,
           SUM(CASE WHEN nextDate IS NOT NULL AND nextDate <= date('now') THEN 1 ELSE 0 END) AS dueCount
         FROM (
           SELECT (
             SELECT rv.nextReviewDate FROM ReviewLog rv
             WHERE rv.anchorId = a.id ORDER BY rv.reviewedAt DESC LIMIT 1
           ) AS nextDate
           FROM Anchor a
         )`
      )
      .first()

    return Response.json({
      totalRooms: counts?.totalRooms ?? 0,
      totalAnchors: counts?.totalAnchors ?? 0,
      totalReviews: counts?.totalReviews ?? 0,
      reviewedToday: today?.reviewedToday ?? 0,
      successRate, // 0~100 또는 null(복습 기록 없음)
      streakDays,
      dueCount: dueRow?.dueCount ?? 0,
      newCount: dueRow?.newCount ?? 0,
    })
  } catch (err) {
    return Response.json(
      { error: '통계를 불러오지 못했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

// 연속 복습 일수: 오늘(또는 어제)부터 하루도 안 빠지고 이어진 날 수.
// 오늘도 어제도 복습이 없으면 streak은 0입니다.
function computeStreak(dates) {
  if (!dates || dates.length === 0) return 0
  const set = new Set(dates)

  const toKey = (d) => d.toISOString().slice(0, 10)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  // 시작점: 오늘 복습했으면 오늘부터, 아니면 어제부터(오늘은 아직 안 했을 수 있으니 관대하게).
  let cursor
  if (set.has(toKey(today))) cursor = today
  else if (set.has(toKey(yesterday))) cursor = yesterday
  else return 0

  let streak = 0
  while (set.has(toKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
