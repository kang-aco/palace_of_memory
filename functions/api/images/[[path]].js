// GET /api/images/<키>  → R2에 저장된 이미지를 그대로 내려줍니다.
// 예: /api/images/rooms/사용자id/uuid.jpg
// [[path]]는 뒤에 오는 여러 경로 조각(rooms/.../uuid.jpg)을 통째로 받습니다.
export async function onRequestGet(context) {
  const parts = context.params.path
  const key = Array.isArray(parts) ? parts.join('/') : parts
  if (!key) return new Response('Not found', { status: 404 })

  const object = await context.env.BUCKET.get(key)
  if (!object) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  if (object.httpEtag) headers.set('ETag', object.httpEtag)
  return new Response(object.body, { headers })
}
