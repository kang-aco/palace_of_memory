// 이 파일은 서버 쪽 코드입니다. (브라우저가 아니라 Cloudflare 서버에서 실행됩니다)
// 주소창에서 /api/rooms 로 요청이 오면 이 파일이 실행됩니다.
// wrangler.toml에서 binding = "DB" 로 연결해둔 D1 데이터베이스는
// 아래 context.env.DB 로 접근할 수 있습니다.

// GET /api/rooms  → 저장된 룸 목록을 가져옵니다.
// 각 룸의 핀 개수(pinCount)도 함께 세어서 돌려줍니다.
export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB
      .prepare(
        `SELECT
           r.id, r.name, r.category, r.imageUrls, r.createdAt,
           (SELECT COUNT(*) FROM Pin p WHERE p.roomId = r.id) AS pinCount
         FROM Room r
         ORDER BY r.createdAt DESC`
      )
      .all()

    // imageUrls는 JSON 문자열로 저장돼 있으므로, 목록에서는 첫 번째 사진만
    // 썸네일용으로 꺼내서 내려줍니다. (전체 목록에 큰 이미지를 다 실어보내지 않기 위함)
    const rooms = results.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      pinCount: r.pinCount,
      createdAt: r.createdAt,
      thumbnail: firstImage(r.imageUrls),
    }))

    return Response.json({ rooms })
  } catch (err) {
    // DB 연결이 안 되어 있거나 테이블이 아직 없을 때 여기로 옵니다.
    return Response.json(
      { error: '데이터베이스 연결에 실패했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

// POST /api/rooms  → 새 룸을 하나 만듭니다. (2단계 본격 사용)
// 프론트에서 아래 형태의 JSON을 보냅니다:
// {
//   name: "룸 이름",
//   category: "카테고리(선택)",
//   imageDataUrl: "data:image/jpeg;base64,....",   // 업로드한 사진 1장
//   pins: [ { x: 0.32, y: 0.51, number: 1 }, ... ]  // 사진 위에 찍은 핀들
// }
export async function onRequestPost(context) {
  try {
    const body = await context.request.json()

    const name = (body.name ?? '').trim() || '이름 없는 룸'
    const category = body.category ?? null
    const pins = Array.isArray(body.pins) ? body.pins : []

    // 사진은 imageUrls 컬럼에 JSON 배열 문자열로 저장합니다.
    // (예: ["data:image/jpeg;base64,..."]) 사진이 없으면 빈 배열로 저장합니다.
    const imageUrls = body.imageDataUrl
      ? JSON.stringify([body.imageDataUrl])
      : JSON.stringify([])

    const roomId = crypto.randomUUID()

    // 룸 1개 + 핀 여러 개를 한 번에(원자적으로) 저장하기 위해 batch를 사용합니다.
    const statements = [
      context.env.DB
        .prepare('INSERT INTO Room (id, name, imageUrls, category) VALUES (?, ?, ?, ?)')
        .bind(roomId, name, imageUrls, category),
    ]

    for (const pin of pins) {
      statements.push(
        context.env.DB
          .prepare(
            'INSERT INTO Pin (id, roomId, imageIndex, x, y, number) VALUES (?, ?, ?, ?, ?, ?)'
          )
          .bind(
            crypto.randomUUID(),
            roomId,
            pin.imageIndex ?? 0,
            pin.x,
            pin.y,
            pin.number
          )
      )
    }

    await context.env.DB.batch(statements)

    return Response.json({ id: roomId, name, pinCount: pins.length })
  } catch (err) {
    return Response.json(
      { error: '룸 저장에 실패했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

// imageUrls(JSON 문자열)에서 첫 번째 사진 URL만 안전하게 꺼내는 도우미 함수
function firstImage(imageUrls) {
  if (!imageUrls) return null
  try {
    const arr = JSON.parse(imageUrls)
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null
  } catch {
    return null
  }
}
