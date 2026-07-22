// 핀 하나에 연결된 "암기 내용(Anchor)"을 다루는 API입니다.
// 주소: /api/pins/:pinId/anchor
//   - GET    : 이 핀에 저장된 앵커를 가져옵니다. (없으면 anchor: null)
//   - PUT    : 앵커를 저장합니다. 이미 있으면 수정, 없으면 새로 만듭니다. (upsert)
//   - DELETE : 이 핀의 앵커를 지웁니다.
//
// ※ 이번 버전 원칙: 암기 내용은 항상 사용자가 직접(텍스트 또는 음성으로) 입력합니다.
//   외부 API가 내용을 자동으로 채워주지 않습니다.

export async function onRequestGet(context) {
  try {
    const pinId = context.params.pinId
    const anchor = await getAnchor(context.env.DB, pinId)
    return Response.json({ anchor })
  } catch (err) {
    return Response.json(
      { error: '앵커를 불러오지 못했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

export async function onRequestPut(context) {
  try {
    const pinId = context.params.pinId
    const body = await context.request.json()

    const content = (body.content ?? '').trim()
    const techniqueType = body.techniqueType ?? null
    const associationText = (body.associationText ?? '').trim() || null
    // inputMethod는 'text' 또는 'voice'만 허용합니다.
    const inputMethod = body.inputMethod === 'voice' ? 'voice' : 'text'

    if (!content) {
      return Response.json({ error: '암기 내용을 입력해 주세요.' }, { status: 400 })
    }

    const existing = await getAnchor(context.env.DB, pinId)

    if (existing) {
      await context.env.DB
        .prepare(
          `UPDATE Anchor
             SET content = ?, techniqueType = ?, associationText = ?, inputMethod = ?
           WHERE id = ?`
        )
        .bind(content, techniqueType, associationText, inputMethod, existing.id)
        .run()

      return Response.json({
        anchor: { ...existing, content, techniqueType, associationText, inputMethod },
      })
    }

    const id = crypto.randomUUID()
    await context.env.DB
      .prepare(
        `INSERT INTO Anchor (id, pinId, content, techniqueType, associationText, inputMethod)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(id, pinId, content, techniqueType, associationText, inputMethod)
      .run()

    return Response.json({
      anchor: { id, pinId, content, techniqueType, associationText, inputMethod },
    })
  } catch (err) {
    return Response.json(
      { error: '앵커 저장에 실패했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

export async function onRequestDelete(context) {
  try {
    const pinId = context.params.pinId
    await context.env.DB.prepare('DELETE FROM Anchor WHERE pinId = ?').bind(pinId).run()
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json(
      { error: '앵커 삭제에 실패했습니다.', detail: String(err) },
      { status: 500 }
    )
  }
}

// 한 핀의 앵커를 가져오는 도우미. (핀당 1개로 다루되, 혹시 여러 개면 가장 최근 것)
async function getAnchor(DB, pinId) {
  return await DB
    .prepare(
      `SELECT id, pinId, content, techniqueType, associationText, inputMethod
       FROM Anchor WHERE pinId = ? ORDER BY createdAt DESC LIMIT 1`
    )
    .bind(pinId)
    .first()
}
