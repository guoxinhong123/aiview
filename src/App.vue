<script setup>
import { computed, ref, nextTick } from 'vue'
import ComposerBox from './components/ComposerBox.vue'
import PreviewStage from './components/PreviewStage.vue'
import Icon from './components/Icon.vue'
import { generateCreation, optimizePrompt } from './services/creationApi'

const prompt = ref('')
const mode = ref('textVideo')
const generating = ref(false)
const progress = ref(0)
const hint = ref('')
const toast = ref('')
const uploadPreview = ref('')
const uploadedFile = ref(null) // 原始 File 对象，直接传给 API
const conversations = ref([])

function notify(message) {
  toast.value = message
  window.clearTimeout(notify.timer)
  notify.timer = window.setTimeout(() => (toast.value = ''), 2400)
}

async function submit() {
  if (!prompt.value.trim()) {
    notify('请先输入创作指令')
    return
  }
  if (mode.value === 'imageVideo' && !uploadPreview.value) {
    notify('图生视频需要先上传一张图片')
    return
  }

  const userMessage = {
    id: Date.now(),
    type: 'user',
    prompt: prompt.value.trim(),
    uploadedImage: uploadPreview.value,
    mode: mode.value
  }
  conversations.value.push(userMessage)

  generating.value = true
  progress.value = 0
  
  const aiMessageId = Date.now() + 1
  conversations.value.push({
    id: aiMessageId,
    type: 'ai',
    generating: true
  })

  const currentPrompt = prompt.value
  const currentUploadPreview = uploadPreview.value
  const currentUploadedFile = uploadedFile.value
  const currentMode = mode.value

  prompt.value = ''
  uploadPreview.value = ''
  uploadedFile.value = null

  try {
    const generated = await generateCreation(
      { mode: currentMode, prompt: currentPrompt, uploadedImage: currentUploadPreview, imageFile: currentUploadedFile },
      (value) => {
        progress.value = value
        const idx = conversations.value.findIndex(c => c.id === aiMessageId)
        if (idx !== -1) {
          conversations.value[idx].progress = value
        }
      }
    )
    const idx = conversations.value.findIndex(c => c.id === aiMessageId)
    if (idx !== -1) {
      conversations.value[idx] = {
        ...generated,
        id: aiMessageId,
        type: 'ai',
        generating: false,
        uploadedImage: currentUploadPreview // 保留图片以便"再次生成"
      }
    }
    notify('创作完成')
    nextTick(() => {
      const chatContainer = document.querySelector('.chat-container')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    })
  } catch (error) {
    const idx = conversations.value.findIndex(c => c.id === aiMessageId)
    if (idx !== -1) {
      conversations.value.splice(idx, 1)
    }
    notify(error.message || '创作失败，请重试')
  } finally {
    generating.value = false
    progress.value = 0
  }
}

async function handleOptimize() {
  try {
    prompt.value = await optimizePrompt(prompt.value, mode.value)
    hint.value = '已根据办公使用场景优化指令，可继续调整后生成'
    notify('指令优化完成')
  } catch (error) {
    notify(error.message)
  }
}

function editAgain(conversation) {
  prompt.value = conversation.prompt || conversation.title
  mode.value = conversation.mode || 'textVideo'
  if (conversation.uploadedImage) {
    uploadPreview.value = conversation.uploadedImage
  }
  document.querySelector('textarea')?.focus()
}

function handleUpload(file) {
  uploadedFile.value = file // 保留原始 File，直接给 API 用
  const reader = new FileReader()
  reader.onload = (event) => {
    uploadPreview.value = String(event.target.result) // 仅用于预览显示
    notify('图片上传成功，可输入动态效果描述')
  }
  reader.readAsDataURL(file)
}

function playVideo(event) {
  // 从点击的 overlay 向上找到 media-frame，再找到其下的 video 元素
  const mediaFrame = event.currentTarget.closest('.media-frame')
  if (!mediaFrame) return
  const video = mediaFrame.querySelector('video.result-video')
  if (video) video.play()
}

function downloadResult(conversation) {
  const link = document.createElement('a')
  link.href = conversation.previewUrl
  const ext = conversation.kind === 'video' ? 'mp4' : 'png'
  link.download = `AI创作-${conversation.title}.${ext}`
  link.click()
}

async function regenerate(conversation) {
  if (!conversation.prompt) {
    notify('无法重新生成')
    return
  }
  if (conversation.mode === 'imageVideo' && !conversation.uploadedImage) {
    notify('图生视频需要先上传一张图片')
    return
  }

  generating.value = true
  progress.value = 0
  
  const aiMessageId = Date.now()
  conversations.value.push({
    id: aiMessageId,
    type: 'ai',
    generating: true
  })

  try {
    const generated = await generateCreation(
      { mode: conversation.mode, prompt: conversation.prompt, uploadedImage: conversation.uploadedImage },
      (value) => {
        progress.value = value
        const idx = conversations.value.findIndex(c => c.id === aiMessageId)
        if (idx !== -1) {
          conversations.value[idx].progress = value
        }
      }
    )
    const idx = conversations.value.findIndex(c => c.id === aiMessageId)
    if (idx !== -1) {
      conversations.value[idx] = {
        ...generated,
        id: aiMessageId,
        type: 'ai',
        generating: false,
        uploadedImage: conversation.uploadedImage // 保留图片以便再次"再次生成"
      }
    }
    notify('创作完成')
  } catch (error) {
    const idx = conversations.value.findIndex(c => c.id === aiMessageId)
    if (idx !== -1) {
      conversations.value.splice(idx, 1)
    }
    notify(error.message || '创作失败，请重试')
  } finally {
    generating.value = false
    progress.value = 0
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="page-header">
      <div class="logo-group">
        <span class="logo-mark"><img style="width: 36px;height: 36px;" src="../public/assets/ai.png" alt=""></span>
        <span>AI 高效创作</span>
      </div>
    </header>

    <main class="chat-container">
      <div v-for="conversation in conversations" :key="conversation.id" class="chat-message" :class="conversation.type">
        <div v-if="conversation.type === 'user'" class="user-message">
          <div class="user-avatar">
            <img style="width: 37px;" src="../public/assets/me-logo.png" alt="">
          </div>
          <div class="user-content">
            <div class="user-prompt">{{ conversation.prompt }}</div>
            <div v-if="conversation.uploadedImage" class="user-uploaded-image">
              <img :src="conversation.uploadedImage" alt="上传图片" />
            </div>
          </div>
        </div>

        <div v-else class="ai-message">
          <div class="ai-avatar">
            <img style="width: 50px;height: 50px;" src="../public/assets/ai-logo.png" alt="">
          </div>
          <div v-if="conversation.generating" class="ai-generating">
            <img style="width: 60px;" src="../public//assets/loading.gif" alt="">
            <strong>AI 正在创作 {{ conversation.progress || 0 }}%</strong>
            <div class="progress-track"><span :style="{ width: `${conversation.progress || 0}%` }"></span></div>
          </div>
          <div v-else class="ai-content">
            <section
              class="media-frame"
              :class="{ video: conversation.kind === 'video' }"
              :style="conversation.width ? { aspectRatio: `${conversation.width} / ${conversation.height}` } : {}"
            >
              <img v-if="conversation.kind !== 'video'" :src="conversation.previewUrl" :alt="conversation.title" />
              <video
                v-else
                :src="conversation.previewUrl"
                :poster="conversation.thumbnail"
                controls
                playsinline
                class="result-video"
                @playing="conversation.videoPlaying = true"
                @pause="conversation.videoPlaying = false"
                @ended="conversation.videoPlaying = false"
              ></video>
              <div
                v-if="conversation.kind === 'video' && !conversation.videoPlaying"
                class="video-overlay"
                @click="playVideo($event)"
              >
                <span class="play-button">▶</span>
                <span class="duration">{{ conversation.duration }}</span>
              </div>
              <button class="cloud-download" aria-label="下载" @click="downloadResult(conversation)">
                <Icon name="download" />
              </button>
            </section>
            <div class="action-row">
              <button class="primary-small" @click="editAgain(conversation)">重新编辑</button>
              <button class="primary-small" @click="regenerate(conversation)">再次生成</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="conversations.length === 0" class="empty-state">
        <div class="empty-icon"><img style="width: 60px;height: 60px;" src="../public/assets/ai.png" alt=""></div>
        <p>开始输入指令，AI 为您创作</p>
      </div>
    </main>

    <ComposerBox
      v-model="prompt"
      v-model:mode="mode"
      :generating="generating"
      :optimized-hint="hint"
      :upload-preview="uploadPreview"
      @submit="submit"
      @optimize="handleOptimize"
      @upload="handleUpload"
    />

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>
