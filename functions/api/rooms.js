// /api/rooms — 룸 목록/생성 API
// 로그인 미들웨어(functions/api/_middleware.js)가 먼저 실행되므로,
// 여기서는 context.data.user 로 "현재 로그인한 사용자"를 항상 얻을 수 있습니다.
// 모든 조회/생성은 이 사용자(userId) 기준으로만 이뤄집니다.
import { putImage, toImageUrl } from '../_lib/images.js'

// GET /api/rooms  → 내 룸 목록 (핀 개수 + 썸네일 포함)
export async function onRequestGet(context) {
  try {
    const userId = context.data.user.id
    const { results } = await context.env.DB
      .prepare(
        `SELECT
           r.id, r.name, r.category, r.imageUrls, r.createdAt,
           (SELECT COUNT(*) FROM Pin p WHERE p.roomId = r.id) AS pinCount
         FROM Room r
         WHERE r.userId = ?
         ORDER BY r.createdAt DESC`
      )
      .bind(userId)
      .all()

    const rooms = results.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      pinCount: r.pinCount,
      createdAt: r.createdAt,
      thumbnail: toImageUrl(firstImage(r.imageUrls)),
    }))

    return Response.json({ rooms })
  } catch (err) {
    return Response.json(
      { error: '데이터베이스 연결에 실패했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

// POST /api/rooms  → 새 룸 생성
// 사진(imageDataUrl)은 R2에 저장하고, DB에는 그 "키"만 저장합니다.
export async function onRequestPost(context) {
  try {
    const userId = context.data.user.id
    const body = await context.request.json()

    const name = (body.name ?? '').trim() || '이름 없는 룸'
    const category = body.category ?? null
    const pins = Array.isArray(body.pins) ? body.pins : []

    // 사진을 R2에 올리고 키를 받아 imageUrls(JSON 배열)에 저장
    let imageUrls = JSON.stringify([])
    if (body.imageDataUrl) {
      const key = await putImage(context.env.BUCKET, userId, body.imageDataUrl)
      imageUrls = JSON.stringify([key])
    }

    const roomId = crypto.randomUUID()
    const statements = [
      context.env.DB
        .prepare(
          'INSERT INTO Room (id, userId, name, imageUrls, category) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(roomId, userId, name, imageUrls, category),
    ]
    for (const pin of pins) {
      statements.push(
        context.env.DB
          .prepare(
            'INSERT INTO Pin (id, roomId, imageIndex, x, y, number) VALUES (?, ?, ?, ?, ?, ?)'
          )
          .bind(crypto.randomUUID(), roomId, pin.imageIndex ?? 0, pin.x, pin.y, pin.number)
      )
    }
    await context.env.DB.batch(statements)

    return Response.json({ id: roomId, name, pinCount: pins.length })
  } catch (err) {
    return Response.json({ error: '룸 저장에 실패했습니다.', detail: String(err) }, { status: 500 })
  }
}

function firstImage(imageUrls) {
  if (!imageUrls) return null
  try {
    const arr = JSON.parse(imageUrls)
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null
  } catch {
    return null
  }
}
