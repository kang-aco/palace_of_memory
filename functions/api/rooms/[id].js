// GET /api/rooms/:id  → 내 룸 1개 + 핀들(+ 각 핀의 암기 내용/최근 복습) 가져오기
// 다른 사람의 룸 id로 접근하면 404가 나도록 userId로 소유권을 확인합니다.
import { toImageUrl } from '../../_lib/images.js'

export async function onRequestGet(context) {
  try {
    const userId = context.data.user.id
    const roomId = context.params.id

    const room = await context.env.DB
      .prepare(
        'SELECT id, name, category, imageUrls, createdAt FROM Room WHERE id = ? AND userId = ?'
      )
      .bind(roomId, userId)
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

    const { results: anchors } = await context.env.DB
      .prepare(
        `SELECT a.id, a.pinId, a.content, a.techniqueType, a.associationText, a.inputMethod
         FROM Anchor a JOIN Pin p ON p.id = a.pinId
         WHERE p.roomId = ?`
      )
      .bind(roomId)
      .all()

    const anchorByPin = {}
    for (const a of anchors) anchorByPin[a.pinId] = a

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

    let stored = []
    try {
      stored = room.imageUrls ? JSON.parse(room.imageUrls) : []
    } catch {
      stored = []
    }
    const imageUrls = stored.map(toImageUrl)

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
