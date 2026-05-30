---
name: level-review
description: 네트워크 교재 페이지를 주니어·시니어 두 페르소나로 동시 검토하는 워크플로. 한 페이지 또는 여러 페이지를 받아 두 에이전트의 발견을 종합해 우선순위 패치 가이드를 산출한다. 한 시점에서는 안 보이는 결함이 다른 시점에서 잡힌다.
---

# Level Review — 주니어·시니어 페르소나 교차 검토

## 작동 모드

| 모드 | 호출 |
|---|---|
| 단일 페이지 | `/level-review docs/dns` |
| 다수 페이지 | `/level-review docs/advanced/k8s-net docs/advanced/cloud-deep` |
| 자동 (수정 감지) | `/level-review` — `content/*.mdx` 중 직전 세션에서 수정된 것 자동 탐지 |

## Phase 1 — 입력 정규화

- 인자로 받은 슬러그들을 `content/<slug>.mdx`에 매핑
- 인자 없으면 `find content -name '*.mdx' -newer .last-review-marker` 로 최근 수정분 탐지
- 각 파일에 대해 `_workspace/<run_id>/<slug>_input.txt` 산문 추출 (기존 python 스크립트 패턴 활용 — JSX/코드 placeholder 처리)

## Phase 2 — 병렬 발사 (페르소나 × 페이지)

각 페이지마다 두 에이전트를 동시 background 발사:

- `network-junior-reviewer` ← 산문 추출본 경로
- `network-senior-reviewer` ← 같은 추출본 경로

N 페이지 × 2 페르소나 = 2N 동시 에이전트.

## Phase 3 — 교차 결과 종합

각 페이지에 대해:

| 발견 | 우선순위 |
|---|---|
| 주니어가 막혔고 + 시니어도 부족 지적 | **P0** (최우선 패치) |
| 시니어만 부족 지적 | **P1** (시니어 깊이 보강) |
| 주니어만 막힘 | **P2** (해설 보강) |
| 양쪽 다 통과 | — |

산출물:
- `_workspace/<run_id>/review_<slug>.md` — 페이지별 종합 리뷰
- `_workspace/<run_id>/patch_guide.md` — 전체 우선순위 패치 가이드 (P0 → P1 → P2)

## Phase 4 — 사용자 보고

```
완료. N개 페이지 × 2 페르소나 = 2N 리뷰.
P0 (긴급): X건 — 주니어 막힘 + 시니어 부족 모두
P1 (시니어 보강): Y건
P2 (해설 보강): Z건

상세: _workspace/<run_id>/patch_guide.md
```

## 호출 후 후속 명령

| 사용자 신호 | 처리 |
|---|---|
| "P0만 적용" | patch_guide.md의 P0 항목만 Edit으로 적용 |
| "특정 페이지만 적용" | 해당 page의 finding 적용 |
| "재리뷰" | Edit 적용 후 동일 페이지에 대해 다시 Phase 2~3 실행 |

## 페르소나 정의 위치

- `<cwd>/.claude/agents/network-junior-reviewer.md`
- `<cwd>/.claude/agents/network-senior-reviewer.md`

이번 세션에서는 에이전트가 새로 등록돼 있어 `Agent` 도구로 `subagent_type: network-junior-reviewer` / `network-senior-reviewer`로 직접 호출 가능. 호환을 위해 `general-purpose`에 페르소나 프롬프트 박는 fallback도 지원.

## 주의

- 페르소나 톤 유지가 핵심. 주니어가 시니어 흉내, 시니어가 주니어 흉내내면 검토 가치 없음.
- 모르는 영역은 모른다고 — 추측·꾸며냄 금지.
- 산문 외 표·코드는 추출 시 placeholder로 치환 후 무시.
- 검토 결과는 *조언*이지 *강제*가 아니다. 작가의 의도와 충돌하면 작가가 우선.
