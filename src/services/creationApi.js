const useMock = import.meta.env.VITE_USE_MOCK !== 'false'
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const modeLabels = {
  image: '文生图',
  textVideo: '文生视频',
  imageVideo: '图生视频'
}

function createMockResult({ mode, prompt, uploadedImage }) {
  const now = new Date()
  if (mode === 'image') {
    return {
      id: crypto.randomUUID(),
      mode,
      prompt,
      title: prompt || '一个女生在花园里坐着',
      kind: 'image',
      previewUrl: '/demo/garden-girl-result.png',
      downloadable: true,
      createdAt: now.toISOString()
    }
  }

  return {
    id: crypto.randomUUID(),
    mode,
    prompt,
    title: prompt || (mode === 'textVideo' ? '春日花园品牌宣传短片' : '让图片轻轻动起来'),
    kind: 'video',
    previewUrl: uploadedImage || '/demo/garden-girl-result.png',
    duration: mode === 'textVideo' ? '00:08' : '00:05',
    downloadable: false,
    createdAt: now.toISOString()
  }
}

export async function generateCreation(payload, onProgress = () => {}) {
  if (useMock) {
    for (const value of [12, 34, 58, 81, 100]) {
      await wait(180)
      onProgress(value)
    }
    return createMockResult(payload)
  }

  const response = await fetch(`${baseUrl}/api/creation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    throw new Error(`生成失败：${response.status}`)
  }
  return response.json()
}

export async function optimizePrompt(prompt, mode) {
  if (useMock) {
    await wait(320)
    const suggestions = {
      image: '，自然柔光，温馨插画风，适合作为 PPT 首页配图，高清细节',
      textVideo: '，8秒镜头，轻微推镜，背景音乐舒缓，加入简洁字幕',
      imageVideo: '，花朵微微摆动，树叶随风飘动，镜头缓慢推进，5秒循环'
    }
    return `${prompt || '春日花园中的人物场景'}${suggestions[mode]}`
  }

  const response = await fetch(`${baseUrl}/api/creation/prompt/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mode })
  })
  if (!response.ok) throw new Error('指令优化失败')
  const result = await response.json()
  return result.prompt
}
