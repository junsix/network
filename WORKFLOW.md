# 콘텐츠 생성 워크플로

네트워크/인프라 교재 사이트(`next/`)의 콘텐츠를 만들고 검증하는 전체 흐름.
주니어→시니어 학습 자료로서의 *정확도·깊이·가독성*을 자동으로 끌어올리는 게 목표.

---

## 0. 시스템 자산 맵

| 위치 | 역할 |
|---|---|
| `next/content/*.mdx` | 콘텐츠 원본 (18개 페이지 + 신규) |
| `next/lib/topics.ts` | 사이드바·레벨(L1/L2/L3) 메타데이터 |
| `next/components/{layout,ui,visual}/` | Hero, Card, Lane 등 시각화 컴포넌트 |
| `.claude/agents/network-junior-reviewer.md` | 2~3년차 SRE 페르소나 (1인칭 막힘 진단, *페이지 단위*) |
| `.claude/agents/network-senior-reviewer.md` | 10년차+ SRE/면접관 페르소나 (운영 디테일·사실 검증, *페이지 단위*) |
| `.claude/agents/network-topic-gap-auditor.md` | 시니어 인프라 site-architect 페르소나 (*사이트 전체*의 없는 토픽·자매 분담 발산) |
| `.claude/agents/network-junior-site-auditor.md` | 주니어 SRE site 시점 페르소나 (*사이트 전체*의 진입 장벽·약어 정의 누락·L1↔L2↔L3 흐름) |
| `.claude/skills/level-review/SKILL.md` | `/level-review` : 페이지 단위 검토 |
| `.claude/skills/site-audit/SKILL.md` | `/site-audit` : 사이트 단위 *시니어* 갭 감사 |
| `.claude/skills/junior-site-audit/SKILL.md` | `/junior-site-audit` : 사이트 단위 *주니어* 친화도 감사 |
| `.claude/hooks/forbid-em-dash.py` | PreToolUse hook: Write/Edit/MultiEdit 입력의 ` — ` 차단 |
| `.claude/hooks/em-dash-audit.sh` | Stop hook: 잔존 ` — ` grep + 위치 보고 |
| `.claude/hooks/level-review-reminder.sh` | Stop hook: 수정된 mdx 안내 |
| `.claude/hooks/declaration-vocab-check.sh` | Stop hook: meta(subtitle/lead)에 *선언*된 도메인 어휘가 본문에 0건이면 경고 (M3 자동화) |
| `.claude/settings.local.json` | hook 등록 (PreToolUse + Stop) |
| `~/.claude/skills/humanize-korean/` | (글로벌) AI 티 윤문 스킬 — `/humanize-korean` |
| `_workspace/<run_id>/` | 각 사이클의 추출본·리뷰·patch_guide |

---

## 1. 메인 파이프라인

워크플로는 두 개의 수직 사이클로 구성된다:

- **페이지 단위 사이클** (Phase 1~6): 새 페이지 작성·기존 페이지 수정마다 실행
- **사이트 단위 사이클** (Phase 7): 분기/월간 또는 새 페이지 ≥3개 후 실행. *없는 토픽*을 발산해 페이지 단위 사이클의 진입점이 됨.

```
[페이지 단위 사이클]                          [사이트 단위 사이클]
                                                   (분기/월간)
[새 콘텐츠 아이디어] ←─────────────────────────  [7] /site-audit
       ↓                                              │   ├─ topic-gap-auditor
[1] MDX 초고 작성                                     │   ├─ 토픽 누락 발산
       │   └─ Write/Edit (PreToolUse가 em-dash 차단)  │   ├─ 자매 분담 점검
       ↓                                              │   ├─ 키워드 0건 매트릭스
[2] 빌드 + 시각 확인                                  │   └─ 인터뷰 시나리오
       │   └─ npm run dev → headless 스크린샷         │           ↓
       ↓                                              │   [site_gap_report.md]
[3] /humanize-korean — AI 티 윤문 (선택)              │   ├─ Tier 1: 새 페이지 권장 ──┐
       │   └─ 입력: 산문 추출 / 산출: final.md        │   ├─ Tier 1: 기존 보강 ──────┤
       ↓                                              │   └─ 자매 cross-link 추가 ────┤
[4] /level-review — 페르소나 교차 검토 ←──────────────┘                                │
       │   └─ junior + senior 병렬 → P0/P1/P2 ←──────────────────────────────────────┘
       ↓
[5] 패치 적용 (Edit)
       │   └─ 즉시 정정 → P0 보강 → P1/P2
       ↓
[6] 검증
       │   └─ Stop hook 자동:
       │       - em-dash-audit.sh
       │       - level-review-reminder.sh
       ↓
[완료]
```

---

## 2. 단계별 상세

### Phase 1 · 작성

| 항목 | 값 |
|---|---|
| 입력 | 빈 MDX 또는 기존 페이지 |
| 도구 | Write / Edit / MultiEdit |
| 자동화 | **PreToolUse hook**이 ` — ` (em-dash + 양쪽 공백)을 입력에서 발견 시 차단 + 대체안(`:`, `,`, 줄바꿈) 안내 |
| 산출 | `next/content/<slug>.mdx` |
| 새 페이지면 추가 작업 | `lib/topics.ts`에 메타 등록 (slug, title, subtitle, level, ord) |

**MDX 구조 표준**:
```mdx
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Callout } from "@/components/ui/Callout";
// 필요한 컴포넌트 import

export const meta = {
  eyebrow: "NN · 카테고리",
  title: "토픽명",
  subtitle: <>
    <Accent>핵심 어구</Accent>의 요약
  </>,
  lead: <>도입 한 단락</>,
};

<Eyebrow>섹션 라벨</Eyebrow>

## 본문 H2

산문 + Callout + KV + DataTable + Lane(애니메이션) 등 조합
```

### Phase 2 · 시각 확인

```bash
# 개발 서버 (백그라운드)
cd next && npm run dev

# headless Chrome 스크린샷
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,1400 \
  --screenshot=/tmp/page.png \
  --virtual-time-budget=4000 \
  http://localhost:3000/docs/<slug>
```

레벨 뱃지·사이드바 active·spotlight·Lane 애니메이션·그래디언트 타이틀 검증.

### Phase 3 · AI 티 윤문 (선택)

```
/humanize-korean   (글로벌 스킬)
```

- 입력: 자동 산문 추출 (JSX/코드 placeholder 처리)
- 출력: `_workspace/<run_id>/final.md` + summary (등급 A/B/C/D)
- 적용 패턴: `**동사구 강조**` 해제, `~의 본질은` 단언 약화, 비유 톤다운, 콜론 어법 정리
- 변경률 목표: 5~15% (>30% 경고, >50% 강제 중단)

### Phase 4 · 레벨 리뷰 (핵심)

```
/level-review <slug>           # 단일
/level-review <slug1> <slug2>  # 복수
/level-review                  # 직전 세션 수정분 자동 탐지
```

**병렬 발사**: 페이지마다 `network-junior-reviewer` + `network-senior-reviewer` 동시 실행.

| 페르소나 | 관점 | 잡는 결함 |
|---|---|---|
| **Junior** (2~3년차 SRE) | 1인칭 "여기서 막혔습니다" | 약어 정의 부재, prerequisite 가정, 비약, "왜" 부재, 비유 출처 |
| **Senior** (10년차+ + 면접관) | 실전 경험 기반 단호 | 운영 디테일 누락, 수치 부정확, 트레이드오프 부재, 면접 단골 누락, 사실 검증 |

**교차 분석 P0/P1/P2 매트릭스**:

| Finding | 우선순위 |
|---|---|
| 주니어 막힘 + 시니어 부족 동시 | **P0** (최우선) |
| 시니어만 부족 | **P1** (깊이 보강) |
| 주니어만 막힘 | **P2** (해설 보강) |

**산출**: `_workspace/<run_id>/patch_guide_*.md` — 페이지별 등급 + Top 5 finding + 면접 후속 질문 + 잘 쓴 부분.

### Phase 5 · 패치 적용

```
즉시 정정 (사실 오류·수치 부정확)
   ↓
P0 영역 (교차 결함) — 가장 큰 ROI
   ↓
P1 (시니어 깊이 보강) — 등급 B → A
   ↓
P2 (주니어 친화) — 진입 장벽 ↓
```

각 정정은 **컴파일 200** + **em-dash audit 0** 두 검증을 통과해야 commit.

### Phase 6 · 검증

세션 종료 시 Stop hook이 자동 실행:

```
.claude/hooks/level-review-reminder.sh
  → 직전 마커 이후 수정된 *.mdx 목록 보고
  → "/level-review 권장" 안내

.claude/hooks/em-dash-audit.sh
  → content/**/*.mdx 에서 ' — ' grep
  → 잔존 위치 보고 (sed 일괄 정리 권장)

.claude/hooks/declaration-vocab-check.sh
  → 각 mdx의 meta(subtitle/lead)에 *선언*된 도메인 어휘(36개)가
    본문에 0건이면 경고. 1차 site-audit 메타 관찰 M2 자동 검출.
  → 경고만, fail은 아님 (exit 0)
```

수동 audit:
```bash
.claude/hooks/em-dash-audit.sh
grep -rn ' — ' next/content --include='*.mdx'
```

### 4 검증 축 매트릭스 (Phase 4 + 7 + 7.5 통합 구조)

| | **페이지 단위** | **사이트 단위** |
|---|---|---|
| **시니어 시점** | `/level-review` (network-senior-reviewer) | `/site-audit` (network-topic-gap-auditor) |
| **주니어 시점** | `/level-review` (network-junior-reviewer) | **`/junior-site-audit`** (network-junior-site-auditor) |

사이트가 *주니어→시니어 학습 자료*로서 완성되려면 4 칸 모두 종결 조건 충족해야 함. 4차 site-audit 종결 시점(2026-05-30)에는 *시니어 측 두 칸*만 종결, *주니어 사이트 단위*는 빈 측정이었음(M13 함정 식별).

### Phase 7 · 사이트 갭 감사 (`/site-audit`)

**페이지 단위 검토(Phase 4)와 분리된 사이트 단위 사이클**. 페이지 *내부 깊이*가 아니라 *없는 토픽*을 발산한다.

```
/site-audit
```

**호출 시점**:
- 정기 (월 1회 / 분기 1회)
- 새 페이지 3개 이상 추가 후
- 사이트 누락 의심 시 (예: "이 도구가 사이트에 0건이네")

**4가지 검증**:

| # | 검증 | 출력 |
|---|---|---|
| 1 | 토픽 누락 inventory | T1·T2·T3 누락 토픽 + 위치 권장 (새 페이지 / 기존 보강) |
| 2 | 자매 페이지 분담 | 분담 모호·cross-link 누락·중복 경고 |
| 3 | 외부 키워드 매트릭스 | 실무 키워드 0건 → 정당성 판단 (갭 신호 vs 도메인 밖) |
| 4 | 인터뷰 시나리오 5개 | 사이트 토픽 목록만으로 답 가능한가 (부분/완전/불가) |

**산출**: `_workspace/<YYYY-MM-DD>-site/site_gap_report.md`

**페르소나**: `network-topic-gap-auditor` (10년차+ 시니어 인프라 + 채용 인터뷰어). 페이지 본문은 안 보고 `topics.ts` + 페이지 `meta` + 키워드 grep 결과만 본다 (의도적: 본문 깊이는 senior reviewer 영역).

**다음 액션**: 리포트의 Tier 1 항목별로 페이지 단위 사이클에 진입.
- 새 페이지 권장 → Phase 1 (MDX 초고)부터
- 기존 페이지 보강 → Phase 4 (`/level-review`)부터
- 자매 cross-link → Phase 5 (Edit 직행)

**왜 분리했나**: 페이지 단위 페르소나(junior+senior)는 *제시된 본문 안에서* 결함을 잡도록 설계됐기 때문에, 본문에 없는 토픽은 보고할 수 없다. `/level-review`만 반복해서는 사이트의 토픽 인벤토리 자체에 구멍이 있는 걸 못 잡는다 (예: 2026-05-29의 `reverse tunnel` 누락 사례).

---

## 3. 새 페이지 추가 체크리스트

1. **`next/content/<slug>.mdx` 작성**
   - meta export (eyebrow, title, subtitle, lead)
   - 본문: Eyebrow + H2 반복, Callout·KV·DataTable·Lane 활용
2. **`next/lib/topics.ts`에 항목 추가**
   - slug, title, subtitle, ord, level (1/2/3)
   - 해당 그룹(L1·L2·L3) items 배열에 push
3. **`next/app/page.tsx` 홈 벤토에 카드 추가** (선택)
   - 같은 그룹의 비대칭 grid 안에 `<Card href="/docs/<slug>">`
4. **자매 페이지 cross-link 점검**
   - 인접 토픽(예: vpn ↔ inbound-outbound ↔ ip-routing)이 새 페이지를 가리키는 한 줄 추가
   - 분담 경계 명시 (`이 페이지는 X를, 인접 페이지는 Y를 다룹니다`)
5. **개발 서버 + 스크린샷으로 시각 확인**
   - Hero 레벨 뱃지·사이드바 active·spotlight 동작
6. **`/humanize-korean`** (AI 패턴 잡기)
7. **`/level-review <slug>`** (페르소나 교차)
8. **patch_guide 기반 Edit**
9. **Stop hook으로 최종 audit**

> 3개 이상 추가 후 **`/site-audit`** 1회 권장 (Phase 7) : 새 페이지가 또 다른 갭을 노출시키는지 확인.

---

## 4. 기존 페이지 수정 사이클

```
Edit → PreToolUse가 em-dash 자동 차단
     → 컴파일 확인 (curl localhost:3000)
     → /level-review <slug> (페이지 1개라 비용 작음)
     → patch 적용
     → Stop hook audit
```

소규모 수정(오타·문장 개선)은 humanize-korean 생략 가능.
**구조 변경·새 섹션 추가**는 humanize → level-review 풀 사이클 권장.

---

## 5. 명령어 Cheatsheet

| 작업 | 명령 |
|---|---|
| 개발 서버 | `cd next && npm run dev` |
| 단일 페이지 컴파일 확인 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs/<slug>` |
| 스크린샷 | `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=1440,1400 --screenshot=/tmp/x.png URL` |
| AI 티 윤문 | `/humanize-korean` |
| 페이지 레벨 리뷰 | `/level-review <slug...>` |
| 사이트 갭 감사 | `/site-audit` |
| 키워드 매트릭스 즉석 점검 | `grep -ric '<keyword>' next/content/` |
| em-dash 잔존 검사 | `.claude/hooks/em-dash-audit.sh` |
| em-dash 일괄 청소 | `find next/content -name '*.mdx' -exec sed -i '' 's/ — /: /g' {} +` |
| 산문 추출 (Python) | `_workspace/extract.py` 패턴 (각 run_id 디렉토리에 보관) |

---

## 6. 자주 마주치는 함정

| 증상 | 원인 | 해결 |
|---|---|---|
| PreToolUse hook이 ` — ` 안 막음 | 같은 세션 내에서 hook 설정이 후-등록됐을 때 picking up 못함 | 다음 세션 또는 sed로 일괄 청소 후 진행 |
| MDX 컴파일 실패 (`{#anchor}` 등) | MDX가 `{...}`를 JSX 표현식으로 해석 | `<h2 id="anchor">제목</h2>` raw HTML 사용 |
| `<code>RateLimit-*</code>` 컴파일 실패 (`Expected closing tag </code>... emphasis`) | MDX가 `<code>` 안의 `*`를 emphasis 시작으로 해석해 태그 역중첩 | 백틱 `` `RateLimit-*` `` 또는 JSX expression `<code>{`RateLimit-*`}</code>` |
| Lane component RSC 직렬화 오류 | `sequence` 함수 prop은 서버→클라이언트 직렬화 불가 | 선언적 `steps={[{ say }, { fly: {...} }]}` 배열 사용 |
| 산문 추출본에 JSX 파편 노출 | 정규식이 단일 컴포넌트(`<Lane meta={...}>`)의 속성을 부분 추출 | Python 스크립트의 정규식 강화 또는 추출 후 수동 검수 |
| reviewer가 `[BLOCK]/[CODE]`를 "본문 비어있음"으로 오해 | placeholder 의도 못 알아챔 | 결과 종합 시 *실제 본문 부재만* P0/P1로 분류, placeholder는 무시 |
| 사이드바 그룹에 새 페이지 안 보임 | `lib/topics.ts` 등록 누락 | items 배열에 push + level/ord 채우기 |
| 홈 페이지에 카드 안 보임 | `app/page.tsx` 벤토에 미추가 | 해당 레벨 섹션의 `<Bento>` 안에 추가 |
| 시니어 자료에 *너무 자주 쓰는 도구*가 통째로 빠짐 | 분류 휴리스틱 ("이름 비슷한 토픽을 같은 페이지로 묶기") + 페이지 단위 리뷰만 반복 | Phase 7 `/site-audit` 도입 — 사이트 단위 갭 감사로 토픽 인벤토리 자체 점검 |
| 4+3 사이클 종결 후 *기초 토픽 9개*(DHCP·ICMP·SLAAC·VLAN·STP·WiFi 인증·PPPoE·이더넷·mDNS)가 통째로 누락 발견 | M16 카테고리 사각지대 — 매트릭스에 *없는 카테고리* 자체가 5 검증 메커니즘 모두에서 사각 | Phase 0 카테고리 발산 + 외부 reference 비교 + 카테고리별 매트릭스 |
| 시나리오 5/5 완전 판정 후에도 *주니어 입문 첫 단계*가 답 안 됨 | M17 시나리오 사각지대 — 5 시나리오가 *우리가 선정한 5*에만 한정, 기초 운영 cover 자체에 사각 | 시나리오 N+1 발산 + 카테고리 cover 점검 + 기초 시나리오 풀 |
| `/level-review` 36개 돌려도 누락 토픽 안 잡힘 | 페르소나가 본문 안에서만 결함 발견하도록 설계 (의도적) | 페이지 단위 ≠ 사이트 단위. Phase 7로 분리 |
| 키워드 hit이 1건인데 토픽으로 인정해 버림 | 1-hit 임계 미정의 (M5 함정) | **N=1 name-drop / N=2~3 단락 / N≥5 토픽 인정** 임계로 일괄 재판정 |
| `declaration-vocab-check`가 잡지 못한 선언-어휘 갭 | 자동 검사 어휘 매트릭스에 *없는* 단어는 사각지대 (M6 함정) | 매 사이클 매트릭스 확장 (SRE base·DORA·카오스·캐시 운영 등) |
| 시나리오 "완전" 판정 후 다음 사이클에서 실제로는 부분 | 좁은 키워드 매트릭스에 의한 과대 평가 (M7 사이클 정직성) | 시나리오 답에 필요한 *모든 표준 어휘*를 매트릭스에 사전 명시 |
| meta subtitle에 "Circuit"·"Zero Trust"·"DDoS" 등 *선언*은 있는데 본문 grep 0건 | 페이지가 *제목으로만* 존재하고 본문이 흡수 안 함 | `declaration-vocab-check.sh` Stop hook이 자동 경고 (M3 자동화) |
| use-case 중심으로 분리한 새 페이지가 자동 L3로 배치됨 | "use-case 페이지 = 시니어 토픽" 무의식적 휴리스틱 | site-audit 회귀 후 *L2 실무 어휘 빈도*를 기준으로 재분류 검토 (M2 학습) |

---

## 7. 비용 모델 (시간·토큰)

| 작업 | 시간 (5,000자 페이지 기준) | 비용 |
|---|---|---|
| MDX 작성 | 사람 시간 의존 | — |
| 시각 확인 | 30초 (스크린샷 1장) | — |
| `/humanize-korean` (Fast 모드) | 2~3분 | 1 agent call (~25K tokens) |
| `/level-review <slug>` 1 페이지 | 2~3분 | 2 agent calls (~30K tokens) |
| `/level-review <slug...>` 18 페이지 병렬 | 5~10분 wall-clock | 36 agent calls (~600K tokens) |
| **`/site-audit`** (사이트 전체) | 3~5분 | 1 agent call (~60~100K tokens) |
| 패치 적용 (Edit) | 사람 + 5~10분 | — |
| Audit (Stop hook) | 1초 | — |

**18페이지 풀 사이클 (작성→윤문→리뷰→패치)**: 1~2일 분량의 작업이 ~30분 wall-clock으로 압축.

---

## 7.5. 사이트 갭 감사 정책 (Phase 7 보강 — 5차 사이클 학습)

세 차례 `/site-audit` 사이클을 거치며 정착한 *임계·승격 정책*. 다음 사이클부터 일관 적용.

### 키워드 hit 임계 (M5)

| Hit | 의미 | 워크플로 처리 |
|---|---|---|
| **0** | 토픽 부재 | T1/T2 후보 (다른 조건과 결합) |
| **1** | name-drop (토픽 아님) | 페이지에서 *언급만* — 깊이 미확보. *2 사이클 연속 1-hit*면 T3로 격하하거나 보강 결정 필요 |
| **2~4** | 단락 1개 수준 | 토픽 시작. 자매 분담 명시 시 충분 |
| **≥5** | 토픽으로 인정 | 페이지에서 정식 다룸 |

**예시 적용**: 3차 시점 `vector clock` 1→1→1 정체 (3 사이클) = name-drop → consensus의 vector clock을 *단락 수준*으로 보강하거나, "본 페이지의 본진은 *strong consistency*. Vector clock은 자매 페이지 또는 외부 참고" 식으로 *분담 격하*.

### T2 → T1 자동 승격 트리거 (M8)

다음 셋 모두 충족 시 T2를 T1으로 승격:

1. **2 사이클 이상 미해소** (그 사이 워크플로의 의도적 보강 결정 없음)
2. **3차 매트릭스 검증에서 표준 어휘의 절반 이상이 0건**
3. **해당 토픽이 시니어 인터뷰 시나리오 5개 중 *답의 필수 layer*에 포함**

**예시 적용**: 3차 시점 1.9 edge compute가 2 사이클 미해소(2차·3차) + Workers/Lambda@Edge/Workers KV/tiered cache/cache key 5/6 0건 + 시나리오 #2 (글로벌 API p99 -50%) 답의 edge layer = **T1 승격**.

### 자동 검사 매트릭스 확장 (M6)

`declaration-vocab-check.sh`의 어휘 매트릭스(hook 내 `VOCAB` 배열)와 `/site-audit`의 `KEYWORDS` 변수를 *매 사이클 함께 확장*. 확장 후보 풀:

- **SRE base**: golden signals, MTTD, MTBF, blameless postmortem, DORA, deployment frequency, change failure rate, toil
- **카오스**: chaos engineering, fault injection, game day, failure injection
- **캐시 운영**: cache stampede, cache aside, write-through, write-behind, stale-while-revalidate
- **edge compute**: Workers KV, Durable Objects, Provisioned Concurrency, CloudFront Functions, Compute@Edge, V8 isolate
- **합의 운영**: ReadIndex, Pre-Vote, Learner, TrueTime, commit-wait
- **Kafka 깊이**: min.insync.replicas, Tiered Storage, KIP-405, Compacted topic, KRaft, max.poll.interval
- **NAT 메커니즘**: symmetric NAT, CGNAT, hairpin, split-horizon, TCP-in-TCP

각 사이클 후 *새로 발견된 갭 어휘*를 추가하면 다음 사이클 검증력이 누적 향상.

### 사이클 정직성 원칙 (M7)

시나리오 *완전* 판정은 *키워드 매트릭스가 완비된 사이클에서만 진실*. 좁은 매트릭스 = 과대 평가 누적 위험.

→ 5개 인터뷰 시나리오의 *모든 표준 답*에 필요한 어휘를 매트릭스에 사전 명시. 새 시나리오 추가 시 어휘도 함께 등록.

### 카테고리 사각지대 정책 (M16) — 6차 사이클에서 입증

**진단**: M3·M5·M6·M7 정책이 *매트릭스에 있는 키워드*에 대해선 정직성을 보장하지만, **매트릭스에 *없는 카테고리* 자체는 5 검증 메커니즘 모두에서 동일하게 사각**. 네트워크 사이트는 4+3 사이클 종결 후 *DHCP·ICMP·SLAAC·VLAN·STP·WiFi 인증·PPPoE·이더넷·mDNS* 9 토픽이 *기초 인프라 운영* 카테고리 사각지대로 발견됨.

**대응 메커니즘**:

#### M16-a 카테고리 매트릭스 명시화

매트릭스를 *flat 키워드 list*가 아닌 *카테고리별 묶음*으로 구조화:

| 매트릭스 형식 | 함정 |
|---|---|
| flat: `ngrok|cloudflared|Raft|...` | 카테고리 자체가 보이지 않음 |
| **categorical**: *물리 → 자동 구성 → 이름 → 신뢰 → 전달 → 정책 → ...* | 빠진 *카테고리*가 한눈에 드러남 |

각 매트릭스 갱신 시 *카테고리 표*로 정리:

```
물리·L2:      이더넷 · WiFi 인증 · VLAN · STP · 802.1Q · MAC 학습
자동 구성:    DHCP · DHCPv6 · SLAAC · RA · mDNS · LLMNR
연결성 점검:  ICMP · ping · traceroute · MTR · path MTU discovery
이름:         DNS · DoT · DoH · DNSSEC · split-horizon
신뢰:         TLS · mTLS · PKI · OCSP · CT
전달:         TCP · UDP · QUIC · SCTP · MPTCP
정책:         BGP · RPKI · FlowSpec · RTBH
...
```

#### M16-b 외부 reference 카테고리 비교

매 사이클 *외부 표준 교재·기관*의 *카테고리 목차*를 reference로 비교. 네트워크 도메인 예:
- *Tanenbaum, Computer Networks* 5판 목차
- *Kurose & Ross, Computer Networking: A Top-Down Approach*
- RFC index 카테고리 (Internet Standard·BCP·Informational)
- IETF Working Group 분류 (DHCP·6MAN·DNSOP·HTTPbis·QUIC·TLS·...)

내 매트릭스의 *카테고리*가 reference에 있는 *기초 카테고리* 대비 빠진 게 있나 매 사이클 점검.

#### M16-c Phase 0 카테고리 발산

`/site-audit`·`/junior-site-audit` 시작 *전*에 페르소나가 1회 발산:

> "이 사이트의 도메인에서 *내 매트릭스에 카테고리 자체*가 빠진 게 무엇인가?"

빠진 카테고리에 키워드 N개 추가 → 그 다음 Phase 1 인벤토리 덤프.

### 시나리오 사각지대 정책 (M17) — 6차 동시 발견

**진단**: 시나리오 5개가 *우리가 선정한 5개에만 한정* — 사이트 컨셉이 *주니어→시니어 학습*인데 *주니어 입문 시나리오*가 표준 *기초 운영*을 cover 안 함. 예: 네트워크 사이트의 주니어 시나리오 5개에 "내가 처음 인터넷 연결할 때 무슨 일?"이 빠져 있어 DHCP·이더넷·WiFi 인증 카테고리가 *시나리오 cover*에서도 사각.

**대응 메커니즘**:

#### M17-a 시나리오 카테고리 cover 점검

시나리오 N개(보통 5)가 사이트의 *모든 카테고리*를 cover하는지 매트릭스 frame과 대조. cover 안 되는 카테고리가 있으면 *시나리오 추가* (정규 5 → 6·7).

#### M17-b 6번째 시나리오 발산

매 사이클 1회: "이 5 시나리오에 *빠진* 시나리오 1개를 추가한다면?"
- 답이 *기존 5의 변형*이면 추가 안 함
- 답이 *새 카테고리*를 cover하면 정식 추가

#### M17-c 사이트 컨셉별 기초 시나리오 풀

*주니어→시니어 학습* 사이트는 다음 *기초 시나리오 풀*에서 최소 1개를 시나리오에 포함:
- "내가 처음 X를 시작할 때 무슨 일?" (X = 인터넷 연결 / 컴퓨터 부팅 / 앱 사용 / ...)
- "왜 안 되나?" (가장 흔한 실패 모드)
- "어떻게 측정하나?" (관측·진단)

→ 도메인별 변형: 네트워크는 "내 PC가 어떻게 IP를 받나" / 경제는 "물가 발표는 어떻게 측정되나" / DB는 "데이터가 어디 저장되나" 등.

---

## 8. 발전 방향

이미 검증된 워크플로의 다음 단계 후보:

- **자동 patch 적용**: patch_guide/site_gap_report의 즉시 정정·T1을 LLM이 자동 Edit (현재는 수동)
- **회귀 검증**: 패치 후 같은 페이지 재리뷰로 등급 변화 측정 + 같은 site-audit 재실행으로 갭 해소 확인
- **메타 검토 자동화**: 페르소나 자체의 페일 모드 점검 (placeholder 오해, 추측 추가, 시야 사각지대)
- **자매 분담 자동화**: `/site-audit` Phase 2 결과의 *분담 경고*를 자동으로 cross-link 패치
- **다른 콘텐츠 도메인**: 동일 시스템(페이지 단위 + 사이트 단위 두 사이클)을 *다른 교재*(예: 시스템 디자인, ML 인프라, DB)에 이식
- **외부 검증**: 실제 인프라 엔지니어 1명에게 페르소나 결과 sanity check
- **인터뷰 시나리오 라이브러리화**: `/site-audit`의 시나리오 5개를 50개로 확장한 별도 파일 (`references/interview-scenarios.md`) : agent가 매 호출마다 랜덤 샘플링

### 워크플로 진화 로그

- 2026-05-29 (1차) : 페이지 단위 사이클 구축 (`/level-review` + junior/senior 페르소나 + em-dash hook)
- 2026-05-29 (2차) : **사이트 단위 사이클 추가** (`/site-audit` + `topic-gap-auditor`) — *reverse tunnel* 같은 토픽 누락을 페이지 단위 리뷰만으로는 못 잡는 한계 발견 후
- 2026-05-29 (3차) : **T1 8개 패치** — nat-traversal·consensus·rate-limiting·messaging 신규 + reliability·auth·security/cdn-lb/bgp 보강. 2차 site-audit 회귀 검증으로 8/8 해소, 인터뷰 시나리오 0/5 → 4/5 완전. 메타 관찰 M2 "use-case 페이지 = 자동 L3" 함정 발견 → rate-limiting·messaging을 L2로 재분류. 메타 관찰 M3 자동화: `declaration-vocab-check.sh` Stop hook으로 meta-본문 어휘 불일치 자동 검출.
- 2026-05-30 (4차) : 신규 4 페이지 `/level-review` + **P0 사실 정정 13건** (consensus L67 quorum math·DynamoDB vector clock·KRaft pull-based·acks=all 과반 오해·group.instance.id 등) + **P1 시니어 깊이 보강** (페이지당 5~8 영역, +97줄 평균). `<code>...*...</code>` MDX emphasis 함정 발견·문서화. agent 정의에 Write 권한 추가.
- 2026-05-30 (5차) : 3차 `/site-audit` 회귀 + **T1 1.9 edge compute 적용** (cdn-lb·cloud-deep 보강 — Workers·Lambda@Edge·tiered cache·origin shielding) + **T2 2.6 SRE base vocab** (reliability·observability — error budget·DORA·MTTR·golden signals + 분담 명시). 메타 M5(1-hit 임계)·M6(자동 검사 사각지대)·M7(사이클 정직성)·M8(T2→T1 승격 트리거) 식별. SKILL.md KEYWORDS 매트릭스 57 → 109 → **150+** 확장. WORKFLOW에 M5 임계 + M8 승격 정책 명시.
- 2026-05-30 (6차) : 4차 `/site-audit` 회귀로 **시니어 측 사이트 갭 종결 도달** (T1 9/9 해소·유지, 시나리오 5/5 완전 첫 도달, 신규 T1 0개 negative signal, M11~M12 식별). **M13 워크플로 비대칭 함정 식별**: 4 사이클 모두 *시니어 측*만 검증, *주니어 사이트 단위*는 빈 측정. **주니어 사이트 갭 감사 워크플로 신설**: `network-junior-site-auditor` 페르소나 + `/junior-site-audit` 슬래시 + WORKFLOW 4 검증 축 매트릭스 명시. 신규 4 페이지 P2 막힘 일괄 적용 (엣지·STUN/TURN/ICE inline·linearizability·pigeonhole·CAP·GCRA TAT 직관·gossip·Lua 원자성·outbox SQL 의사 코드).
- 2026-05-30 (7차) : 주니어 측 jr-site-audit 1·2·3 사이클로 **주니어 측 종결 도달** (시나리오 0/5 → 5/5 완전, 등급 C → B → B+, 매트릭스 5/6, M14 mechanical-fixability 함정·M15 strategic placement 식별). 양측 종결 mirror 형태 (시니어 vector clock 정체 격하 ↔ 주니어 T2-3 sequential-only 격하).
- 2026-05-30 (8차) : **M16 카테고리 사각지대 + M17 시나리오 사각지대 식별**. 양측 4+3 사이클 종결 후 사용자 질문 *"DHCP 같은 거는?"*에서 *기초 인프라 운영* 카테고리 9 토픽(DHCP·ICMP·SLAAC·VLAN·STP·WiFi 인증·PPPoE·이더넷·mDNS)이 통째로 누락 발견. 5 검증 메커니즘 모두 같은 사각지대. 메타 정책 보강: 카테고리 매트릭스 명시화 + 외부 reference 비교 + Phase 0 발산 + 시나리오 카테고리 cover 점검 + 6번째 시나리오 발산. 경제 사이트(부트스트랩 직후)에 *처음부터* 적용.
- 2026-05-30 (9차) : **M16 카테고리 사각지대 *해소* 작업 — T1+T2+T3 풀 세트 9 토픽 일괄 적용**. 4 신규 페이지(`dhcp` ord 04.5·`icmp` ord 04.7·`ethernet` ord 04.8·`access-layer` ord 04.9) + `arp` NDP/SLAAC/DAD/Privacy/DHCPv6 섹션 확장. L1·기초 4 → 8 페이지로 확장 (*진짜 기초* 회복). topics.ts 갱신·next build 33 페이지 정상·em-dash 0건·declaration-vocab 0건. 키워드 hit 검증: DHCP=34·DORA=6·ICMP=34·PMTUD=11·SLAAC=12·VLAN=21·STP=7·4-way=8·PPPoE=9·mDNS=17·WiFi=8·NDP=10 (12 토픽 모두 M5 임계 ≥5 통과). 카테고리·시나리오 사각 해소 입증. 다음 5차 jr-site-audit으로 매트릭스 6/6 종결 가능성 점검 잔여.

---

## 부록 · 디렉토리 트리 요약

```
network/
├── next/                          # Next.js 앱
│   ├── app/
│   │   ├── page.tsx               # 홈 (L1/L2/L3 벤토)
│   │   ├── docs/[...slug]/page.tsx # MDX 동적 로더
│   │   └── globals.css            # Tailwind + prose-net
│   ├── content/                   # MDX 소스 (단일 진실 원천)
│   │   ├── *.mdx                  # L1 + L2 + walkthrough
│   │   └── advanced/*.mdx         # L2 + L3
│   ├── components/
│   │   ├── layout/   {AppShell, BgLayers, Hero, PageShell, Sidebar, TopNav}
│   │   ├── ui/       {Card, Callout, DataTable, Diagram, Eyebrow, KV, LayerStack, Metric, PCBox, Steps, Subnav}
│   │   └── visual/   {Lane}
│   ├── lib/
│   │   ├── topics.ts              # 사이드바 메타 + 레벨
│   │   ├── tokens.ts              # 디자인 토큰
│   │   └── utils.ts
│   └── mdx-components.tsx         # MDX 기본 매핑
├── .claude/                       # 워크플로 자산
│   ├── agents/
│   │   ├── network-junior-reviewer.md      # 페이지 단위 · 막힘 진단
│   │   ├── network-senior-reviewer.md      # 페이지 단위 · 깊이 검증
│   │   └── network-topic-gap-auditor.md    # 사이트 단위 · 없는 토픽 발산
│   ├── skills/
│   │   ├── level-review/SKILL.md           # /level-review (페이지 단위)
│   │   └── site-audit/SKILL.md             # /site-audit  (사이트 단위)
│   ├── hooks/
│   │   ├── forbid-em-dash.py            # PreToolUse
│   │   ├── em-dash-audit.sh             # Stop
│   │   ├── level-review-reminder.sh     # Stop
│   │   └── declaration-vocab-check.sh   # Stop (M3 자동화: 선언-본문 어휘 불일치 검출)
│   └── settings.local.json
├── _workspace/                    # 각 run_id의 추출·리뷰·patch_guide
│   ├── 2026-05-29-001/            # humanize-korean 사이클
│   ├── 2026-05-29-002/            # level-review demo + cloud-deep/k8s-net
│   ├── 2026-05-29-003/            # 전체 18페이지 검토
│   └── 2026-05-29-site/           # /site-audit run (사이트 갭 감사)
└── WORKFLOW.md                    # 이 문서
```
