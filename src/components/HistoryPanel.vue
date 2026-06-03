<script setup>
import Icon from './Icon.vue'
import { modeLabels } from '../services/creationApi'

defineProps({
  open: Boolean,
  records: { type: Array, required: true }
})

const emit = defineEmits(['close', 'reuse', 'clear'])

function dateText(value) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
</script>

<template>
  <div v-if="open" class="drawer-mask" @click.self="emit('close')">
    <aside class="drawer">
      <div class="drawer-title">
        <div>
          <p class="caption">创作管理</p>
          <h2>历史记录</h2>
        </div>
        <button class="icon-button" aria-label="关闭" @click="emit('close')">
          <Icon name="close" />
        </button>
      </div>

      <div class="profile-card">
        <div class="avatar">AI</div>
        <div>
          <strong>公司内部创作账号</strong>
          <p>Wan 2.2 本地服务 · 安全可控</p>
        </div>
      </div>

      <div class="record-list" v-if="records.length">
        <article class="record" v-for="record in records" :key="record.id" @click="emit('reuse', record)">
          <img :src="record.previewUrl" alt="" />
          <div>
            <strong>{{ record.title }}</strong>
            <p>{{ modeLabels[record.mode] }} · {{ dateText(record.createdAt) }}</p>
          </div>
        </article>
      </div>
      <div class="empty-history" v-else>
        <Icon name="history" />
        <p>暂无历史创作，开始输入指令吧</p>
      </div>

      <button v-if="records.length" class="plain-button danger" @click="emit('clear')">清空记录</button>

      <section class="safe-tip">
        <strong>本地部署说明</strong>
        <p>生成素材仅通过公司内部服务流转，适合 PPT 配图、宣传视频与培训内容制作。</p>
      </section>
    </aside>
  </div>
</template>
