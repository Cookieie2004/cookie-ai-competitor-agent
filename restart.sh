#!/usr/bin/env bash
# 曲奇 Cookie 一键启动 / 重启脚本
# 解决「Python 已断开 / 整站卡死」：先杀掉占用端口的旧进程，再以稳定模式重启。
# 用法：在项目根目录执行  ./restart.sh   （或在 Codex 终端里运行）
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 本项目独立端口（与同机其它副本项目隔离，避免端口冲突）
BACKEND_PORT=8010
FRONTEND_PORT=3400
LOG_DIR="$ROOT/.run-logs"
mkdir -p "$LOG_DIR"

# ---- 定位 Node（系统 PATH 没有时，回退到 Codex 自带的 Node）----
# 可选：在项目根目录创建 .node-path 文件，写入本机 Node 的 bin 目录绝对路径，
# 即可在系统 PATH 找不到 node 时自动回退（适配 Codex 内置 Node 等场景）。
NODE_BIN=""
if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(dirname "$(command -v node)")"
elif [ -f "$ROOT/.node-path" ]; then
  c="$(cat "$ROOT/.node-path")"
  [ -x "$c/node" ] && NODE_BIN="$c"
fi
if [ -n "$NODE_BIN" ]; then export PATH="$NODE_BIN:$PATH"; fi

# ---- 通用：杀掉占用某端口的进程 ----
kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null)"
  if [ -n "$pids" ]; then
    echo "  端口 $port 被占用，正在结束进程: $pids"
    kill $pids 2>/dev/null
    sleep 1
    pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null)"
    [ -n "$pids" ] && { echo "  强制结束: $pids"; kill -9 $pids 2>/dev/null; sleep 1; }
  fi
}

echo "==> 1/4 清理旧进程"
# 仅按本项目端口精确清理，避免误杀同机其它副本项目的服务
kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"

echo "==> 2/4 启动后端 (FastAPI :$BACKEND_PORT，稳定模式，不开 --reload)"
cd "$ROOT/backend"
# 关键：不使用 --reload。写库会改动被监视目录，--reload 会反复重启导致请求卡死。
nohup .venv/bin/python -m uvicorn app.main:app \
  --host 127.0.0.1 --port "$BACKEND_PORT" \
  > "$LOG_DIR/backend.log" 2>&1 &
echo "  后端日志: $LOG_DIR/backend.log"

echo "==> 3/4 等待后端就绪"
ok=0
for i in $(seq 1 30); do
  if curl -s -o /dev/null --max-time 3 "http://127.0.0.1:$BACKEND_PORT/health"; then
    ok=1; break
  fi
  sleep 1
done
if [ "$ok" = "1" ]; then
  echo "  后端已就绪 ✅  http://127.0.0.1:$BACKEND_PORT/health"
  echo "  LLM 自检: $(curl -s --max-time 60 "http://127.0.0.1:$BACKEND_PORT/api/llm/ping")"
else
  echo "  ⚠️ 后端 30s 内未就绪，请查看日志: $LOG_DIR/backend.log"
fi

echo "==> 4/4 启动前端 (Vite :$FRONTEND_PORT)"
if [ -z "$NODE_BIN" ] && ! command -v npm >/dev/null 2>&1; then
  echo "  ⚠️ 未找到 Node/npm，跳过前端。请手动指定 Node 路径后重试。"
else
  cd "$ROOT/frontend"
  [ -d node_modules ] || { echo "  安装前端依赖..."; npm install; }
  nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
  echo "  前端日志: $LOG_DIR/frontend.log"
  echo ""
  echo "============================================================"
  echo "  ✅ 启动完成"
  echo "  预览地址:  http://localhost:$FRONTEND_PORT/"
  echo "  后端接口:  http://127.0.0.1:$BACKEND_PORT/"
  echo "  关闭服务:  ./stop.sh"
  echo "============================================================"
fi
