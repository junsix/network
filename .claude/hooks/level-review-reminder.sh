#!/bin/bash
# Stop hook — 세션 종료 시점에 content/*.mdx가 직전 리뷰 이후 수정됐는지 확인 후 알림만.
# 자동 실행 X (비용 통제). 사용자가 /level-review 로 명시 트리거.

set -euo pipefail

WS_ROOT="/Users/user/Desktop/personnel/network"
CONTENT_DIR="$WS_ROOT/next/content"
MARKER="$WS_ROOT/.claude/.last-review-marker"

# 첫 실행이면 marker만 남기고 종료
if [ ! -e "$MARKER" ]; then
  touch "$MARKER"
  exit 0
fi

# marker 이후 수정된 mdx
CHANGED=$(find "$CONTENT_DIR" -name "*.mdx" -newer "$MARKER" 2>/dev/null || true)

if [ -n "$CHANGED" ]; then
  COUNT=$(echo "$CHANGED" | wc -l | tr -d ' ')
  echo "📝 직전 리뷰 이후 수정된 MDX: $COUNT 개"
  echo ""
  echo "$CHANGED" | sed "s|$CONTENT_DIR/||" | head -10 | sed 's/^/  - /'
  if [ "$COUNT" -gt 10 ]; then
    echo "  ... ($((COUNT - 10))개 더)"
  fi
  echo ""
  echo "💡 다음 세션에서 주니어·시니어 페르소나 교차 검토 권장:"
  echo "   /level-review                            (전체 자동 탐지)"
  echo "   /level-review docs/<slug>                (단일 페이지)"
fi
