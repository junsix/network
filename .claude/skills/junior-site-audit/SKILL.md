---
description: 사이트 *전체*의 주니어 친화도 audit. 페이지 내부 막힘이 아닌 *사이트 구조의 진입 장벽·L1↔L2↔L3 흐름·약어 정의 누락·주니어 학습 시나리오 5개*. 시니어 측 `/site-audit`의 대칭 워크플로. 4 검증 축의 마지막 칸.
---

# /junior-site-audit

`/site-audit`(시니어 측)의 대칭 워크플로. **사이트 갭 검증의 4번째 검증 축**.

## 4 검증 축 매트릭스 (워크플로 구조)

| | 페이지 단위 | 사이트 단위 |
|---|---|---|
| **시니어 시점** | `/level-review` (network-senior-reviewer) | `/site-audit` (network-topic-gap-auditor) |
| **주니어 시점** | `/level-review` (network-junior-reviewer) | **`/junior-site-audit`** (network-junior-site-auditor) ← 이 워크플로 |

4 검증 축이 *대칭*되어야 사이트가 *주니어→시니어 학습 자료*로서 완성. 시니어 측 4 사이클이 종결 도달한 시점에 주니어 측 사이클을 시작하는 것이 워크플로 비대칭(M13) 해소.

## 언제 호출하나

- 시니어 측 `/site-audit`이 종결 도달 후 (대칭 보강)
- 새 페이지 추가 후 정기 점검
- 주니어 친화도 의심 시
- 사이트 컨셉 "주니어→시니어 학습"의 *실효성 검증*이 필요할 때

## Phase 1 인벤토리 덤프

```bash
cd /Users/user/Desktop/personnel/network
RUN_ID="$(date +%Y-%m-%d)-jr-site"
mkdir -p _workspace/$RUN_ID

# 토픽 인벤토리 (level + ord + subtitle)
cp next/lib/topics.ts _workspace/$RUN_ID/00_topics_inventory.ts

# meta만 추출 (페이지 본문 의도적 제외 — 본문 막힘은 level-review 영역)
{
  for f in next/content/*.mdx next/content/advanced/*.mdx; do
    echo "=== $f ==="
    sed -n '/^export const meta/,/^};/p' "$f"
    echo
  done
} > _workspace/$RUN_ID/00_meta_dump.txt

# 약어 첫 등장 inventory (옵션)
ACRONYMS='NAT|MITM|MTU|MSS|NIC|FQDN|RTT|BGP|CDN|LB|QUIC|OAuth|JWT|mTLS|SLO|SLI|Raft|EOS|GCRA|CRDT|SPIFFE|ZTNA|DPDK|XDP|MTTR|MTTD|DORA'
echo "# 약어 첫 등장 페이지" > _workspace/$RUN_ID/00_acronym_first_appearance.txt
for kw in $(echo "$ACRONYMS" | tr '|' '\n'); do
  first=$(grep -l -- "$kw" next/content/*.mdx next/content/advanced/*.mdx 2>/dev/null | head -1)
  printf "%-12s %s\n" "$kw" "$first" >> _workspace/$RUN_ID/00_acronym_first_appearance.txt
done
```

## Phase 2 Agent 호출

```
Agent(
  subagent_type="network-junior-site-auditor",
  prompt="""
사이트 주니어 친화도 감사 (시니어 측 4 사이클 종결 도달 후 대칭 워크플로).

입력:
- 토픽 인벤토리: _workspace/<run_id>/00_topics_inventory.ts
- 페이지 meta 덤프: _workspace/<run_id>/00_meta_dump.txt
- 약어 첫 등장: _workspace/<run_id>/00_acronym_first_appearance.txt

4 검증 영역:
1. L1↔L2↔L3 진입 장벽
2. 사이트 단위 약어·전제 inventory
3. 주니어 학습 시나리오 5개
4. anchor·정의·미니 메모 누락 패턴

산출: _workspace/<run_id>/junior_site_gap_report.md
페이지 *본문*은 보지 않음 (level-review 영역).
"""
)
```

## Phase 3 후속 결정

리포트의 Tier 1 항목별 분기:

| Finding | 다음 액션 |
|---|---|
| 기초 약어 미정의 (NAT·MITM·MTU 등) | L1·기초 페이지에 정의 anchor 추가 |
| L2·L3 페이지에 *암묵적* prerequisite | meta·lead에 명시적 cross-link 추가 |
| 시나리오 답변 불가 경로 | walkthrough 페이지 보강 또는 신규 anchor |
| L1↔L2 진입 장벽 큼 | 중간 *교량 페이지* 신설 또는 기존 페이지 도입부 보강 |

## 비용

- Agent 1콜 (~30~50K tokens)
- Wall-clock 3~5분
- 인벤토리 덤프 1~2초

## 산출물

- `_workspace/<run_id>/00_topics_inventory.ts`
- `_workspace/<run_id>/00_meta_dump.txt`
- `_workspace/<run_id>/00_acronym_first_appearance.txt`
- `_workspace/<run_id>/junior_site_gap_report.md`

## 시니어 site-audit와의 분리

| | `/site-audit` | `/junior-site-audit` |
|---|---|---|
| 발산 | *없는 토픽* (시니어 자료 표준) | *진입할 수 없는 토픽* (주니어 prerequisite) |
| 시나리오 | 시니어 디자인 인터뷰 5 | 주니어 기초 질문 5 |
| 임계 | 키워드 hit (M5: ≥5 = 토픽) | 약어 정의 여부 (있다 / 없다) |
| 자매 분담 | DDoS·NAT 뒤 등 | L1↔L2↔L3 흐름 |

둘 다 종결 도달 시 사이트가 *주니어→시니어 학습 자료*로서 완성.
