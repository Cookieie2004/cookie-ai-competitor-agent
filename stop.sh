#!/usr/bin/env bash
# 关闭曲奇 Cookie 的后端(:8010)与前端(:3400)
# 注意：仅按本项目端口精确清理，避免误杀同机其它副本项目的服务。
set -u
echo "停止本项目后端/前端进程..."
for port in 8010 3400; do
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null)"
  [ -n "$pids" ] && { echo "  释放端口 $port: $pids"; kill $pids 2>/dev/null; sleep 1; kill -9 $pids 2>/dev/null || true; }
done
echo "已停止。"
