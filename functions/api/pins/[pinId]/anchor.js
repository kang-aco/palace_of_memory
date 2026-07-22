// 핀 하나에 연결된 "암기 내용(Anchor)"을 다루는 API입니다.
// 주소: /api/pins/:pinId/anchor  (GET / PUT / DELETE)
// 로그인한 사용자가 "자기 룸의 핀"에만 접근할 수 있도록 소유권을 확인합니다.

// 이 핀이 현재 사용자 소유인지 확인. 맞으면 pinId, 아니면 null.
async function ownsPin(env, userId, pinId) {
  const row = await env.DB
    .prepare(
      `SELECT p.id FROM Pin p JOIN Room r ON r.id = p.roomId
       WHERE p.id = ? AND r.userId = ?`
    )
    .bind(pinId, userId)
    .first()
  return !!row
}

export async function onRequestGet(context) {
  try {
    const pinId = context.params.pinId
    if (!(await ownsPin(context.env, context.data.user.id, pinId))) {
      return Response.json({ error: '접근 권한이 없습니다.' }, { status: 404 })
    }
    const anchor = await getAnchor(context.env.DB, pinId)
    return Response.json({ anchor })
  } catch (err) {
    return Response.json({ error: '앵커를 불러오지 못했습니다.', detail: String(err) }, { status: 500 })
  }
}

export async function onRequestPut(context) {
  try {
    const pinId = context.params.pinId
    if (!(await ownsPin(context.env, context.data.user.id, pinId))) {
      return Response.json({ error: '접근 권한이 없습니다.' }, { status: 404 })
    }
    const body = await context.request.json()

    const content = (body.content ?? '').trim()
    const techniqueType = body.techniqueType ?? null
    const associationText = (body.associationText ?? '').trim() || null
    const inputMethod = body.inputMethod === 'voice' ? 'voice' : 'text'

    if (!content) {
      return Response.json({ error: '암기 내용을 입력해 주세요.' }, { status: 400 })
    }

    const existing = await getAnchor(context.env.DB, pinId)
    if (existing) {
      await context.env.DB
        .prepare(
          `UPDATE Anchor SET content = ?, techniqueType = ?, associationText = ?, inputMethod = ?
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
    return Response.json({ error: '앵커 저장에 실패했습니다.', detail: String(err) }, { status: 500 })
  }
}

export async function onRequestDelete(context) {
  try {
    const pinId = context.params.pinId
    if (!(await ownsPin(context.env, context.data.user.id, pinId))) {
      return Response.json({ error: '접근 권한이 없습니다.' }, { status: 404 })
    }
    await context.env.DB.prepare('DELETE FROM Anchor WHERE pinId = ?').bind(pinId).run()
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: '앵커 삭제에 실패했습니다.', detail: String(err) }, { status: 500 })
  }
}

async function getAnchor(DB, pinId) {
  return await DB
    .prepare(
      `SELECT id, pinId, content, techniqueType, associationText, inputMethod
       FROM Anchor WHERE pinId = ? ORDER BY createdAt DESC LIMIT 1`
    )
    .bind(pinId)
    .first()
}
