#!/bin/bash
# declaration-vocab-check.sh
# meta(subtitle/lead)에 *선언*된 도메인 어휘가 본문에 0건이면 경고.
# 1차 site-audit의 메타 관찰 M2 "선언-어휘 불일치" 자동 검출 (2026-05-29).
#
# 사용: Stop event hook으로 등록. 실패해도 exit 0 (경고만).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONTENT_DIR="$NETWORK_DIR/next/content"

if [[ ! -d "$CONTENT_DIR" ]]; then
  exit 0
fi

# 알려진 도메인 어휘 (대소문자 무시 매칭).
# 다음 사이클 site-audit 키워드 매트릭스와 정합 유지 권장.
VOCAB=(
  "circuit breaker"
  "bulkhead"
  "retry budget"
  "thundering herd"
  "stampede"
  "Zero Trust"
  "mTLS"
  "Reverse Tunnel"
  "NAT Traversal"
  "ZTNA"
  "Raft"
  "Paxos"
  "consensus"
  "rate limit"
  "token bucket"
  "leaky bucket"
  "backpressure"
  "outbox"
  "saga"
  "idempotency"
  "DoT"
  "DoH"
  "DoQ"
  "DNSSEC"
  "edge compute"
  "origin shielding"
  "SLO"
  "SLI"
  "error budget"
  "burn rate"
  "Anycast"
  "scrubbing"
  "FlowSpec"
  "RTBH"
  "MITM"
  "DDoS"
)

WARNINGS=0
WARN_LINES=""

while IFS= read -r f; do
  # meta 영역만 (export const meta { ... };)
  meta=$(awk '/^export const meta/,/^};/' "$f" 2>/dev/null)
  [[ -z "$meta" ]] && continue
  # 본문 (meta 이후)
  body=$(awk '/^export const meta/,/^};/{next} {print}' "$f" 2>/dev/null)

  for v in "${VOCAB[@]}"; do
    if echo "$meta" | grep -qi -- "$v"; then
      if ! echo "$body" | grep -qi -- "$v"; then
        rel="${f#$NETWORK_DIR/}"
        WARN_LINES+="   $rel : '$v' meta에 선언, 본문 0건"$'\n'
        WARNINGS=$((WARNINGS + 1))
      fi
    fi
  done
done < <(find "$CONTENT_DIR" -name '*.mdx' -type f)

if [[ $WARNINGS -gt 0 ]]; then
  echo "⚠️  meta 선언과 본문 어휘 불일치: $WARNINGS 건"
  echo -n "$WARN_LINES"
  echo "→ 본문에 해당 어휘를 추가하거나, meta 선언을 수정하세요."
fi

exit 0
