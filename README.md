# AI 高效创作视图工具 - Vue 3 演示项目

基于项目说明文档与界面原型实现的可运行前端项目，面向公司内部视觉内容创作场景，覆盖：

- 文生图：输入自然语言生成办公配图，支持图片预览与下载。
- 文生视频：输入脚本生成视频结果预览（演示模式展示生成流程与视频卡片）。
- 图生视频：上传静态图片后填写动态效果要求，生成视频结果预览。
- 辅助能力：指令优化、再次生成、重新编辑、历史记录缓存、侧边创作管理面板。

## 立即运行

要求 Node.js 18+。

```bash
npm install
npm run dev
```

浏览器访问 Vite 输出的本地地址（默认 `http://localhost:5173`）。

## 生产构建

```bash
npm run build
npm run preview
```

## 演示模式与真实服务对接

项目默认启用前端模拟生成服务，无需后端即可体验页面交互。复制环境变量配置：

```bash
cp .env.example .env.local
```

`.env.local` 示例：

```env
VITE_USE_MOCK=true
VITE_API_BASE_URL=http://localhost:8080
```

接入公司内网部署的 Wan 2.2 / ComfyUI 网关时，将 `VITE_USE_MOCK=false`，并在 `src/services/creationApi.js` 对接以下接口：

| 方法 | 接口 | 用途 |
| --- | --- | --- |
| POST | `/api/creation/generate` | 根据 `mode` 与 `prompt` 发起文生图/文生视频/图生视频任务 |
| POST | `/api/creation/prompt/optimize` | 生成办公场景适配的指令优化建议 |

真实生成服务建议返回字段：

```json
{
  "id": "task-id",
  "mode": "image",
  "prompt": "一个女生在花园里坐着",
  "title": "一个女生在花园里坐着",
  "kind": "image",
  "previewUrl": "/resource/generated/result.png",
  "downloadable": true,
  "createdAt": "2026-05-27T10:00:00.000Z"
}
```

## 项目目录

```text
wan-ai-creator-vue3/
├─ public/
│  ├─ demo/garden-girl-result.png
│  └─ favicon.svg
├─ src/
│  ├─ components/
│  │  ├─ ComposerBox.vue
│  │  ├─ HistoryPanel.vue
│  │  ├─ Icon.vue
│  │  └─ PreviewStage.vue
│  ├─ services/creationApi.js
│  ├─ App.vue
│  ├─ main.js
│  └─ styles.css
├─ .env.example
├─ index.html
├─ package.json
└─ vite.config.js
```

## 说明

演示版的视频生成结果是前端交互展示，真实 MP4 下载需由后端 Wan 2.2 推理服务返回生成文件地址。历史记录存储在浏览器 `localStorage` 中。
