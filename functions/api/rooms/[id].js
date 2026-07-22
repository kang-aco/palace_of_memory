// GET /api/rooms/:id  → 룸 1개와 그 룸에 속한 핀들을 함께 가져옵니다.
// Cloudflare Pages Functions는 파일명 [id].js 의 대괄호 부분을
// 주소의 실제 값으로 채워서 context.params.id 로 전달해 줍니다.
export async function onRequestGet(context) {
  try {
    const roomId = context.params.id

    const room = await context.env.DB
      .prepare('SELECT id, name, category, imageUrls, createdAt FROM Room WHERE id = ?')
      .bind(roomId)
      .first()

    if (!room) {
      return Response.json({ error: '룸을 찾을 수 없습니다.' }, { status: 404 })
    }

    const { results: pins } = await context.env.DB
      .prepare(
        'SELECT id, imageIndex, x, y, number FROM Pin WHERE roomId = ? ORDER BY number ASC'
      )
      .bind(roomId)
      .all()

    // 3단계: 각 핀에 연결된 암기 내용(Anchor)을 함께 붙여서 내려줍니다.
    // 한 룸의 모든 앵커를 한 번에 가져와, 핀 id 기준으로 짝지어 줍니다.
    const { results: anchors } = await context.env.DB
      .prepare(
        `SELECT a.id, a.pinId, a.content, a.techniqueType, a.associationText, a.inputMethod
         FROM Anchor a
         JOIN Pin p ON p.id = a.pinId
         WHERE p.roomId = ?`
      )
      .bind(roomId)
      .all()

    const anchorByPin = {}
    for (const a of anchors) anchorByPin[a.pinId] = a

    // 4단계: 각 앵커의 "가장 최근 복습 기록"을 붙여줍니다.
    // reviewedAt 오름차순으로 훑으면서 마지막 값이 최신이 되도록 덮어씁니다.
    const { results: reviews } = await context.env.DB
      .prepare(
        `SELECT rv.anchorId, rv.recallSuccess, rv.difficulty, rv.reviewedAt, rv.nextReviewDate
         FROM ReviewLog rv
         JOIN Anchor a ON a.id = rv.anchorId
         JOIN Pin p ON p.id = a.pinId
         WHERE p.roomId = ?
         ORDER BY rv.reviewedAt ASC`
      )
      .bind(roomId)
      .all()

    const lastReviewByAnchor = {}
    for (const rv of reviews) {
      lastReviewByAnchor[rv.anchorId] = {
        recallSuccess: rv.recallSuccess,
        difficulty: rv.difficulty,
        reviewedAt: rv.reviewedAt,
        nextReviewDate: rv.nextReviewDate,
      }
    }
    for (const a of anchors) a.lastReview = lastReviewByAnchor[a.id] ?? null

    for (const pin of pins) pin.anchor = anchorByPin[pin.id] ?? null

    // imageUrls는 JSON 문자열 → 실제 배열로 바꿔서 내려줍니다.
    let imageUrls = []
    try {
      imageUrls = room.imageUrls ? JSON.parse(room.imageUrls) : []
    } catch {
      imageUrls = []
    }

    return Response.json({
      room: {
        id: room.id,
        name: room.name,
        category: room.category,
        imageUrls,
        createdAt: room.createdAt,
      },
      pins,
    })
  } catch (err) {
    return Response.json(
      { error: '룸을 불러오는 데 실패했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}
