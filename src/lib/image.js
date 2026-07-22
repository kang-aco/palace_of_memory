// 이미지를 data URL로 바꾸는 도우미들입니다.
// 왜 data URL로 바꾸나요?
//   - 이번 버전은 별도 이미지 저장소(R2) 없이, 사진을 data URL(글자로 바뀐 이미지)
//     형태로 D1 데이터베이스에 바로 저장합니다.
//   - 원본 사진(수 MB)을 그대로 저장하면 DB 한 줄이 너무 커지므로,
//     가로/세로를 maxSize 이하로 줄이고 JPEG로 다시 압축해서 용량을 낮춥니다.

// 파일(또는 Blob)을 data URL 문자열로 읽습니다.
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'))
    reader.readAsDataURL(blob)
  })
}

// data URL(또는 이미지 주소)을 <img>로 불러옵니다.
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 여는 데 실패했습니다.'))
    img.src = src
  })
}

// 불러온 이미지를 긴 변 maxSize 이하로 축소해 JPEG data URL로 만듭니다.
function resizeToJpegDataUrl(img, maxSize, quality) {
  let { width, height } = img
  if (width > height && width > maxSize) {
    height = Math.round((height * maxSize) / width)
    width = maxSize
  } else if (height >= width && height > maxSize) {
    width = Math.round((width * maxSize) / height)
    height = maxSize
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

// 사용자가 올린 사진 파일 → 축소된 JPEG data URL
export async function fileToResizedDataUrl(file, maxSize = 1200, quality = 0.8) {
  const dataUrl = await blobToDataUrl(file)
  const img = await loadImage(dataUrl)
  return resizeToJpegDataUrl(img, maxSize, quality)
}

// 앱에 내장된 예시 이미지(/samples/...) → data URL
//   - SVG(벡터)는 아주 가벼우므로 축소 없이 그대로 저장합니다.
//   - JPG/PNG(예: 나노바나나로 만든 사진)는 업로드와 똑같이 축소해서 저장합니다.
export async function sampleUrlToDataUrl(url, maxSize = 1200, quality = 0.8) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('예시 이미지를 불러오지 못했습니다.')
  const blob = await res.blob()
  const rawDataUrl = await blobToDataUrl(blob)

  const type = blob.type || ''
  if (type.includes('svg')) return rawDataUrl

  const img = await loadImage(rawDataUrl)
  return resizeToJpegDataUrl(img, maxSize, quality)
}
