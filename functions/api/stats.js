// GET /api/stats  → 로그인한 사용자의 학습 통계
// 모든 숫자는 현재 사용자(userId) 기준으로만 계산됩니다.
export async function onRequestGet(context) {
  try {
    const DB = context.env.DB
    const userId = context.data.user.id

    // 1) 전체 개수
    const counts = await DB
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM Room WHERE userId = ?1) AS totalRooms,
           (SELECT COUNT(*) FROM Anchor a JOIN Pin p ON p.id=a.pinId JOIN Room r ON r.id=p.roomId WHERE r.userId = ?1) AS totalAnchors,
           (SELECT COUNT(*) FROM ReviewLog rv JOIN Anchor a ON a.id=rv.anchorId JOIN Pin p ON p.id=a.pinId JOIN Room r ON r.id=p.roomId WHERE r.userId = ?1) AS totalReviews`
      )
      .bind(userId)
      .first()

    // 2) 오늘 복습 수 + 정답률
    const today = await DB
      .prepare(
        `SELECT
           SUM(CASE WHEN date(rv.reviewedAt) = date('now') THEN 1 ELSE 0 END) AS reviewedToday,
           SUM(rv.recallSuccess) AS successes,
           COUNT(*) AS total
         FROM ReviewLog rv
         JOIN Anchor a ON a.id=rv.anchorId JOIN Pin p ON p.id=a.pinId JOIN Room r ON r.id=p.roomId
         WHERE r.userId = ?`
      )
      .bind(userId)
      .first()

    const successes = today?.successes ?? 0
    const total = today?.total ?? 0
    const successRate = total > 0 ? Math.round((successes / total) * 100) : null

    // 3) 연속 복습 일수
    const { results: dateRows } = await DB
      .prepare(
        `SELECT DISTINCT date(rv.reviewedAt) AS d
         FROM ReviewLog rv
         JOIN Anchor a ON a.id=rv.anchorId JOIN Pin p ON p.id=a.pinId JOIN Room r ON r.id=p.roomId
         WHERE r.userId = ?
         ORDER BY d DESC`
      )
      .bind(userId)
      .all()
    const streakDays = computeStreak(dateRows.map((r) => r.d))

    // 4) 복습 예정(due) / 신규(new)
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
           FROM Anchor a JOIN Pin p ON p.id=a.pinId JOIN Room r ON r.id=p.roomId
           WHERE r.userId = ?
         )`
      )
      .bind(userId)
      .first()

    return Response.json({
      totalRooms: counts?.totalRooms ?? 0,
      totalAnchors: counts?.totalAnchors ?? 0,
      totalReviews: counts?.totalReviews ?? 0,
      reviewedToday: today?.reviewedToday ?? 0,
      successRate,
      streakDays,
      dueCount: dueRow?.dueCount ?? 0,
      newCount: dueRow?.newCount ?? 0,
    })
  } catch (err) {
    return Response.json({ error: '통계를 불러오지 못했습니다.', detail: String(err) }, { status: 500 })
  }
}

function computeStreak(dates) {
  if (!dates || dates.length === 0) return 0
  const set = new Set(dates)
  const toKey = (d) => d.toISOString().slice(0, 10)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

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
