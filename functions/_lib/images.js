// R2 이미지 저장/조회 관련 서버 도우미입니다.

// 브라우저가 보낸 data URL(예: "data:image/jpeg;base64,....")을
// 실제 바이트 + 콘텐츠 타입으로 분해합니다.
export function dataUrlToBytes(dataUrl) {
  const comma = dataUrl.indexOf(',')
  const meta = dataUrl.substring(0, comma) // "data:image/jpeg;base64"
  const b64 = dataUrl.substring(comma + 1)
  const contentType = meta.substring(meta.indexOf(':') + 1, meta.indexOf(';')) || 'image/jpeg'
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { bytes, contentType }
}

// data URL을 R2에 저장하고, DB에 보관할 "키"를 돌려줍니다. (예: "rooms/uuid.jpg")
export async function putImage(bucket, userId, dataUrl) {
  const { bytes, contentType } = dataUrlToBytes(dataUrl)
  const ext = contentType.includes('png')
    ? 'png'
    : contentType.includes('svg')
      ? 'svg'
      : contentType.includes('webp')
        ? 'webp'
        : 'jpg'
  const key = `rooms/${userId}/${crypto.randomUUID()}.${ext}`
  await bucket.put(key, bytes, { httpMetadata: { contentType } })
  return key
}

// DB에 저장된 값(imageUrls의 각 항목)을 브라우저에서 바로 <img src>로 쓸 URL로 바꿉니다.
//   - "data:..."(옛 방식)나 "http", "/"로 시작하면 그대로 사용
//   - 그 외에는 R2 키로 보고 /api/images/키 로 만들어 줍니다.
export function toImageUrl(stored) {
  if (!stored) return null
  if (stored.startsWith('data:') || stored.startsWith('http') || stored.startsWith('/')) {
    return stored
  }
  return `/api/images/${stored}`
}
