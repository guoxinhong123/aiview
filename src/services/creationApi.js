const useMock = import.meta.env.VITE_USE_MOCK !== 'false'
// 空字符串 → 走 Vite 代理（相对路径）；未设置 → 直连硬编码地址
const baseUrl = import.meta.env.VITE_API_BASE_URL != null
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://112.30.139.26:11449'
const apiKey = import.meta.env.VITE_API_KEY || ''

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/* ------------------------------------------------------------------ */
/*  默认生成参数                                                        */
/* ------------------------------------------------------------------ */
const DEFAULT_PARAMS = {
  model: 'wan2.2',
  num_frames: 81,
  width: 1280,
  height: 720,
  num_inference_steps: 50,
  guidance_scale: 5.0
}

/* ------------------------------------------------------------------ */
/*  请求头                                                            */
/* ------------------------------------------------------------------ */
function authHeaders() {
  const headers = {}
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  return headers
}

/* ------------------------------------------------------------------ */
/*  Mock 逻辑（保留以便开发调试）                                        */
/* ------------------------------------------------------------------ */
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

async function mockGenerate(payload, onProgress) {
  for (const value of [12, 34, 58, 81, 100]) {
    await wait(600)
    onProgress(value)
  }
  return createMockResult(payload)
}

/* ------------------------------------------------------------------ */
/*  真实 API：提交 → 轮询 → 下载                                        */
/* ------------------------------------------------------------------ */

/**
 * 1. 提交视频生成任务
 * @returns {Promise<string>} video_id
 */
async function submitVideoTask({ prompt, mode, uploadedImage }) {
  const formData = new FormData()
  formData.append('model', DEFAULT_PARAMS.model)
  formData.append('num_frames', String(DEFAULT_PARAMS.num_frames))
  formData.append('width', String(DEFAULT_PARAMS.width))
  formData.append('height', String(DEFAULT_PARAMS.height))
  formData.append('num_inference_steps', String(DEFAULT_PARAMS.num_inference_steps))
  formData.append('guidance_scale', String(DEFAULT_PARAMS.guidance_scale))

  // 拼接提示词（图生视频时把图片描述前置）
  let finalPrompt = prompt
  if (mode === 'imageVideo' && uploadedImage) {
    finalPrompt = `参考上传图片，${prompt}`
  }
  formData.append('prompt', finalPrompt)

  const response = await fetch(`${baseUrl}/v1/videos`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`提交任务失败 (${response.status})${text ? ': ' + text : ''}`)
  }

  const data = await response.json()
  const videoId = data.video_id || data.id || data.task_id
  if (!videoId) {
    throw new Error('服务端未返回 video_id')
  }
  return videoId
}

/**
 * 2. 轮询任务状态，直到完成或失败
 * @returns {Promise<object>} 完成后的状态数据
 */
async function pollVideoStatus(videoId, onProgress) {
  const POLL_INTERVAL = 3000 // 每 3 秒轮询一次
  const MAX_WAIT = 10 * 60 * 1000 // 最多等 10 分钟
  const startTime = Date.now()
  let lastProgress = 8

  while (true) {
    await wait(POLL_INTERVAL)

    // 超时检查
    if (Date.now() - startTime > MAX_WAIT) {
      throw new Error('任务超时，请稍后重试')
    }

    const response = await fetch(`${baseUrl}/v1/videos/${videoId}`, {
      headers: authHeaders()
    })

    if (!response.ok) {
      throw new Error(`查询状态失败 (${response.status})`)
    }

    const data = await response.json()

    // 根据实际 API 返回的状态字段判断
    const status = data.status || data.state || ''

    if (status === 'failed' || status === 'error' || data.error) {
      const errMsg = data.error || data.message || '未知错误'
      throw new Error(`视频生成失败: ${errMsg}`)
    }

    if (status === 'completed' || status === 'done' || status === 'success') {
      // 直接返回完整的响应数据
      onProgress(100)
      return data
    }

    // 报告进度（优先用 API 返回的 progress，否则模拟递增）
    const apiProgress = Number(data.progress) || 0
    if (apiProgress > 0) {
      onProgress(Math.min(apiProgress, 95))
    } else {
      lastProgress = Math.min(lastProgress + 7, 92)
      onProgress(lastProgress)
    }
  }
}

/**
 * 3. 下载视频文件，返回 Blob URL
 * @returns {Promise<string>} blob:// URL
 */
async function downloadVideoContent(videoId) {
  const response = await fetch(`${baseUrl}/v1/videos/${videoId}/content`, {
    headers: authHeaders()
  })

  if (!response.ok) {
    throw new Error(`下载视频失败 (${response.status})`)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/* ------------------------------------------------------------------ */
/*  公开 API                                                           */
/* ------------------------------------------------------------------ */

/**
 * 生成创作（文生视频 / 图生视频）
 * @param {object} payload - { mode, prompt, uploadedImage }
 * @param {function} onProgress - 进度回调 (0-100)
 * @returns {Promise<object>} 生成结果
 */
export async function generateCreation(payload, onProgress = () => {}) {
  if (useMock) {
    return mockGenerate(payload, onProgress)
  }

  const { mode, prompt, uploadedImage } = payload

  // 1. 提交任务
  onProgress(3)
  const videoId = await submitVideoTask({ prompt, mode, uploadedImage })
  onProgress(8)

  // 2. 轮询等待完成
  const result = await pollVideoStatus(videoId, onProgress)

  // 3. 下载视频并创建 blob URL
  onProgress(96)
  const videoUrl = await downloadVideoContent(videoId)

  // 估算时长（num_frames / 30fps）
  const totalSeconds = Math.round(DEFAULT_PARAMS.num_frames / 30)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  const duration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  onProgress(100)

  return {
    id: videoId,
    mode,
    prompt: result.prompt || prompt,
    title: result.prompt || prompt,
    kind: 'video',
    previewUrl: videoUrl,
    width: DEFAULT_PARAMS.width,
    height: DEFAULT_PARAMS.height,
    duration,
    downloadable: true,
    createdAt: new Date().toISOString()
  }
}

/**
 * 优化提示词（暂用本地模板，后续可对接 LLM）
 */
export async function optimizePrompt(prompt, mode) {
  if (useMock) {
    await wait(320)
    const suggestions = {
      image: '，自然柔光，温馨插画风，适合作为 PPT 首页配图，高清细节',
      textVideo: '，8秒镜头，轻微推镜，背景音乐舒缓，加入简洁字幕',
      imageVideo: '，花朵微微摆动，树叶随风飘动，镜头缓慢推进，5秒循环'
    }
    return `${prompt || '春日花园中的人物场景'}${suggestions[mode] || ''}`
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders()
    },
    body: JSON.stringify({ prompt, mode })
  })
  if (!response.ok) throw new Error('指令优化失败')
  const result = await response.json()
  return result.prompt
}
