@echo off
chcp 65001 >nul
echo 正在启动 AI 高效创作视图工具...
where node >nul 2>nul || (echo 未检测到 Node.js，请先安装 Node.js 18+ & pause & exit /b 1)
if not exist node_modules (
  echo 首次运行，正在安装依赖...
  call npm install
)
call npm run dev
pause
