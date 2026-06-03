<script setup>
import { computed, ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: String,
  mode: { type: String, default: 'textVideo' },
  generating: Boolean,
  optimizedHint: String,
  uploadPreview: String
})

const emit = defineEmits(['update:modelValue', 'update:mode', 'submit', 'optimize', 'upload'])
const textareaRef = ref(null)
const fileInput = ref(null)
const showModes = ref(false)

const modeLabels = {
  textVideo: '文生视频',
  imageVideo: '图生视频'
}

const placeholder = computed(() => {
  const map = {
    textVideo: '请输入视频脚本，如：春日花园中，镜头慢慢推进…',
    imageVideo: '上传图片后，描述希望产生的动态效果'
  }
  return map[props.mode]
})

function chooseMode(value) {
  emit('update:mode', value)
  showModes.value = false
}

function handleKeydown(event) {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault()
    emit('submit')
  }
}

function handleFile(event) {
  const file = event.target.files?.[0]
  if (file) emit('upload', file)
}
</script>

<template>
  <section class="composer">
    <div class="input-row">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        :placeholder="placeholder"
        @input="emit('update:modelValue', $event.target.value)"
        @keydown="handleKeydown"
      ></textarea>
      <button class="send-button" :disabled="generating" aria-label="开始生成" @click="emit('submit')">
        <Icon name="send" />
      </button>
    </div>

    <div v-if="optimizedHint" class="optimized-hint">
      <Icon name="sparkle" />
      <span>{{ optimizedHint }}</span>
    </div>

    <div v-if="mode === 'imageVideo' && uploadPreview" class="uploaded-mini">
      <img :src="uploadPreview" alt="上传的参考图片" />
      <span>已上传参考图片</span>
    </div>

    <footer class="composer-footer">
      <div class="footer-left">
        <div class="mode-select">
          <button class="mode-current" @click="showModes = !showModes">
            {{ modeLabels[mode] }} <span>⌄</span>
          </button>
          <div v-if="showModes" class="mode-menu">
            <button
              v-for="(label, value) in modeLabels"
              :key="value"
              :class="{ active: mode === value }"
              @click="chooseMode(value)"
            >{{ label }}</button>
          </div>
        </div>

        <button v-if="mode === 'imageVideo'" class="inline-tool" @click="fileInput.click()">
          <Icon name="upload" /> 上传图片
        </button>
        <input ref="fileInput" class="hidden-input" type="file" accept="image/*" @change="handleFile" />

        <button class="inline-tool" :disabled="generating" @click="emit('optimize')">
          <Icon name="sparkle" /> 优化指令
        </button>
      </div>
    </footer>
  </section>
</template>
