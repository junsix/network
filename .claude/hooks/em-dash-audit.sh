#!/bin/bash
# Stop hook — content/*.mdx에서 잔여 em-dash 산문 사용 검사 (사후 감사용)
# PreToolUse가 새 도입을 차단해도, 기존 파일에 남은 ' — '를 한 번 더 보고.

set -euo pipefail

CONTENT_DIR="/Users/user/Desktop/personnel/network/next/content"

# 공백 둘러싸인 em-dash만 검출 (표 빈 셀 등 단독 — 는 제외)
FOUND=$(grep -rn ' — ' "$CONTENT_DIR" --include='*.mdx' 2>/dev/null || true)

if [ -n "$FOUND" ]; then
  COUNT=$(echo "$FOUND" | wc -l | tr -d ' ')
  echo "⚠️  산문 내 em-dash(' — ') 잔존: $COUNT 곳"
  echo "$FOUND" | head -5 | sed "s|$CONTENT_DIR/||" | sed 's/^/   /'
  if [ "$COUNT" -gt 5 ]; then
    echo "   ... ($((COUNT - 5))곳 더)"
  fi
  echo "→ 콜론(:)·쉼표(,)·줄바꿈으로 대체 권장."
fi
