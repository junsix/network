---
description: 사이트 *전체*의 토픽 인벤토리 갭을 감사. 페이지 내부 깊이가 아닌 *없는 토픽*·자매 분담·실무 키워드 0건·인터뷰 시나리오 4가지를 점검. 페이지 단위 `/level-review`와 분리된 사이트 단위 감사.
---

# /site-audit

페이지 단위 검토(`/level-review`)와 별개로, **사이트 전체의 토픽 누락**을 잡는다.

## 언제 호출하나

- **정기**: 월 1회 또는 분기 1회
- **이벤트**: 새 페이지 3개 이상 추가된 후
- **명시**: 사용자가 `/site-audit` 호출 시

## 페이지 단위 검토와의 분리

| | `/level-review` | `/site-audit` |
|---|---|---|
| 대상 | 페이지 1~N개 | 사이트 전체 |
| 페르소나 | junior + senior 2명 (페이지마다) | topic-gap-auditor 1명 |
| 잡는 결함 | 페이지 *내부* 깊이·해설 부족 | *없는* 토픽 / 분담 모호 / 키워드 0건 |
| 주기 | 페이지 작성·수정마다 | 분기/월간 |
| 산출 | `patch_guide.md` (P0/P1/P2) | `site_gap_report.md` (Tier 1/2/3) |

## Phase 1 · 인벤토리 덤프

```bash
# run_id 결정
cd /Users/user/Desktop/personnel/network
RUN_ID="$(date +%Y-%m-%d)-site"
mkdir -p _workspace/$RUN_ID

# 1. 토픽 인벤토리
cp next/lib/topics.ts _workspace/$RUN_ID/00_topics_inventory.ts

# 2. 각 페이지의 meta 추출
for f in next/content/*.mdx next/content/advanced/*.mdx; do
  echo "=== $f ==="
  sed -n '/^export const meta/,/^};/p' "$f"
  echo
done > _workspace/$RUN_ID/00_meta_dump.txt

# 3. 외부 키워드 매트릭스 grep
KEYWORDS='ngrok|cloudflared|Cloudflare Tunnel|Tailscale|frp|bore|rathole|ssh -R|bastion|jump host|Teleport|AWS SSM|BeyondCorp|Cloudflare Access|mTLS rotation|device posture|SPIFFE|SPIRE|Istio Ambient|Cilium|ambient mesh|Waypoint|Pixie|Coroot|Hubble|Tetragon|bpftrace|libbpf|Raft|Paxos|etcd|ZooKeeper|leader lease|ReadIndex|Pre-Vote|Learner|TrueTime|Kafka|NATS|Redis Streams|SQS|exactly-once|outbox|saga|idempotency|backpressure|min.insync.replicas|Tiered Storage|KIP-405|Compacted topic|cleanup.policy|KRaft|max.poll.interval|circuit breaker|bulkhead|retry budget|thundering herd|stampede|token bucket|leaky bucket|GCRA|sliding window|fail-open|fail-closed|adaptive concurrency|Little.s Law|AIMD|PrivateLink|Transit Gateway|Hyperplane|RPKI|BGPsec|certificate transparency|Anycast scrubbing|BGP FlowSpec|RTBH|vector clock|CRDT|gossip|tombstone|XDP|DPDK|AF_XDP|DoT|DoH|DoQ|DNSSEC|DNS-over-TLS|DNS-over-HTTPS|Cloudflare Workers|Lambda@Edge|Workers KV|Durable Objects|Provisioned Concurrency|CloudFront Functions|Compute@Edge|V8 isolate|origin shielding|tiered cache|cache key|stale-while-revalidate|SLO|SLI|error budget|burn rate|four golden signals|RED method|USE method|MTTR|MTTD|MTBF|DORA|deployment frequency|change failure rate|lead time|blameless postmortem|chaos engineering|fault injection|game day|cache stampede|conntrack|nftables|eBPF map|symmetric NAT|CGNAT|hairpin|split-horizon|TCP-in-TCP'
echo "# 키워드별 사이트 검색 결과" > _workspace/$RUN_ID/00_keyword_hits.txt
for kw in $(echo "$KEYWORDS" | tr '|' '\n'); do
  count=$(grep -ric -- "$kw" next/content/ 2>/dev/null | awk -F: '{s+=$2} END{print s+0}')
  printf "%-30s %d\n" "$kw" "$count" >> _workspace/$RUN_ID/00_keyword_hits.txt
done
```

## Phase 2 · Agent 호출

```
Agent(
  subagent_type="network-topic-gap-auditor",
  description="Site-level topic gap audit",
  prompt="""
입력 3개:
- 토픽 인벤토리: _workspace/<run_id>/00_topics_inventory.ts
- 페이지 meta 덤프: _workspace/<run_id>/00_meta_dump.txt
- 키워드 매트릭스: _workspace/<run_id>/00_keyword_hits.txt

4가지 검증 수행:
1. 토픽 누락 inventory (T1/T2/T3)
2. 자매 페이지 분담
3. 외부 키워드 매트릭스 (0건 정당성 판단)
4. 인터뷰 시나리오 5개 시뮬레이션

산출: _workspace/<run_id>/site_gap_report.md
페이지 *내부 깊이* 비판 금지 (그건 senior reviewer 영역).
"""
)
```

## Phase 3 · 후속 결정

`site_gap_report.md`의 Tier 1 항목별로 분기:

| Finding | 다음 액션 |
|---|---|
| **새 페이지 권장** (예: `reverse-tunnel`) | MDX 초안 → `/humanize-korean` → `/level-review` 메인 파이프라인 진입 |
| **기존 페이지 보강** (예: `auth`에 ZTNA 한 섹션) | Edit 세션 → `/level-review <slug>` |
| **자매 분담 경고** | 인접 페이지에 cross-link 추가 + 분담 경계 명시 (Edit) |
| **키워드 0건** | T1/T2 토픽 누락의 signal로 이미 1·2 분석에 흡수됨 |

각 액션은 *메인 파이프라인 진입점*이 된다 : 새 페이지면 Phase 1부터, 기존 페이지 보강이면 Phase 4(`/level-review`)부터.

## 비용

- Agent 1콜 (~60K~100K tokens)
- Wall-clock 3~5분
- 인벤토리 덤프 자체는 1~2초

## 산출물

- `_workspace/<run_id>-site/00_topics_inventory.ts`
- `_workspace/<run_id>-site/00_meta_dump.txt`
- `_workspace/<run_id>-site/00_keyword_hits.txt`
- `_workspace/<run_id>-site/site_gap_report.md`

## 검증

리포트가 다음 조건을 만족해야 신뢰:
- T1·T2·T3 각 항목마다 *왜 시니어 자료에 필요한가* 명시
- 각 항목에 *위치 권장* (기존 / 새) 명시
- 인터뷰 시나리오 5개 모두 판정 (부분 / 완전 / 불가)
- 메타 관찰 1개 이상 (분류 휴리스틱의 함정 등)

조건 미달이면 agent를 1회 재호출.
