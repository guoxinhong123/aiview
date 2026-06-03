<script setup>
import Icon from './Icon.vue'

const props = defineProps({
  result: { type: Object, required: true },
  generating: Boolean,
  progress: Number
})
const emit = defineEmits(['download', 'regenerate', 'edit'])

const displayTitle = () => props.result?.title || '一个女生在花园里坐着'
</script>

<template>
  <main class="stage">
    <div class="result-bubble">{{ displayTitle() }}</div>

    <section class="media-frame" :class="{ video: result.kind === 'video' }">
      <img :src="result.previewUrl" :alt="displayTitle()" />
      <div v-if="result.kind === 'video'" class="video-overlay">
        <span class="play-button">▶</span>
        <span class="duration">{{ result.duration }}</span>
      </div>
      <button class="cloud-download" aria-label="下载" @click="emit('download')">
        <Icon name="download" />
      </button>

      <div v-if="generating" class="generation-overlay">
        <div class="spinner"></div>
        <strong>AI 正在创作 {{ progress }}%</strong>
        <div class="progress-track"><span :style="{ width: `${progress}%` }"></span></div>
      </div>
    </section>

    <div class="action-row">
      <button class="primary-small" @click="emit('edit')">重新编辑</button>
      <button class="primary-small" :disabled="generating" @click="emit('regenerate')">再次生成</button>
    </div>
  </main>
</template>
