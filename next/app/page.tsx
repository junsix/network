import { PageShell } from "@/components/layout/PageShell";
import { Hero, Accent } from "@/components/layout/Hero";
import { Card, CardOrd, CardTitle, CardBody, Tags, Tag } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <PageShell wide>
      <Hero
        eyebrow="Interactive · Network Field Guide"
        title={
          <>
            네트워크의 동작 원리와<br />
            보안을 <Accent>그림으로</Accent> 이해하기
          </>
        }
        lead={
          <>
            21개 토픽이 <strong>주니어 → 시니어</strong>로 가는 한 흐름으로 묶여 있습니다.
            L1 기초로 멘탈 모델을 잡고, L2 실무로 운영 디테일을 익히고, L3 시니어로 시스템 통합·용량 계획·거버넌스에 도달.
          </>
        }
      />

      {/* Learning path overview */}
      <section className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LevelCard
          level={1}
          label="L1 · 기초"
          color="#5BD5A0"
          border="rgba(91,213,160,0.35)"
          bg="rgba(91,213,160,0.06)"
          count={4}
          desc="프로토콜이 무엇이고 어떻게 동작하는지. 멘탈 모델의 출발점."
          topics={["계층 모델", "ARP", "IP·라우팅", "TCP·UDP"]}
        />
        <LevelCard
          level={2}
          label="L2 · 실무"
          color="#8B95E5"
          border="rgba(94,106,210,0.40)"
          bg="rgba(94,106,210,0.08)"
          count={10}
          desc="운영에서 매일 만지는 프로토콜·도구·실패 모드. 미드급 면접 통과선."
          topics={["DNS", "HTTP", "TLS", "보안", "BGP", "CDN·LB", "QUIC", "VPN", "OAuth", "관측"]}
        />
        <LevelCard
          level={3}
          label="L3 · 시니어"
          color="#F4B942"
          border="rgba(244,185,66,0.40)"
          bg="rgba(244,185,66,0.06)"
          count={7}
          desc="시스템 통합, 용량 계획, 거버넌스. 시니어 인프라 면접의 차별점."
          topics={["Walkthrough", "Inbound·Outbound", "K8s", "Cloud", "Cloud Deep", "Reliability", "Numbers"]}
        />
      </section>

      {/* L1 */}
      <Section
        level={1}
        eyebrow="L1 · 기초"
        title="주소가 정해지고, 프로토콜이 동작하기까지"
      >
        4개 토픽으로 OSI/TCP-IP 멘탈 모델을 잡습니다. 시작은 여기.
      </Section>

      <Bento>
        <Card href="/docs/layers" emphasis className="col-span-2 lg:col-span-3">
          <CardOrd>01 · Foundation</CardOrd>
          <CardTitle>계층 모델 — OSI · TCP/IP</CardTitle>
          <CardBody>
            거리·매체·신뢰성·의미가 뒤섞인 문제를 잘라낸다. 책임의 지도가 보이면 나머지 프로토콜이 "왜 그렇게 생겼는지" 설명된다.
          </CardBody>
          <Tags>
            <Tag>기초</Tag>
            <Tag>캡슐화</Tag>
            <Tag tone="accent">처음이라면 여기부터</Tag>
          </Tags>
        </Card>
        <Card href="/docs/arp" className="col-span-2 lg:col-span-3">
          <CardOrd>02 · L2</CardOrd>
          <CardTitle>ARP — IP → MAC</CardTitle>
          <CardBody>같은 링크에서 상대를 찾는 방법. 단순한 만큼 인증이 없어 보안 약점도 된다.</CardBody>
        </Card>
        <Card href="/docs/ip-routing" className="col-span-2 lg:col-span-3">
          <CardOrd>03 · L3</CardOrd>
          <CardTitle>IP & 라우팅</CardTitle>
          <CardBody>주소 체계, 서브넷, 다음 홉. LPM·MTU·PMTUD·NAT 통과까지.</CardBody>
        </Card>
        <Card href="/docs/tcp-udp" className="col-span-2 lg:col-span-3">
          <CardOrd>04 · L4</CardOrd>
          <CardTitle>TCP · UDP</CardTitle>
          <CardBody>3-way handshake, TIME_WAIT, Nagle 데드락, RTO. 신뢰성·저지연의 트레이드오프.</CardBody>
        </Card>
      </Bento>

      {/* L2 */}
      <Section
        level={2}
        eyebrow="L2 · 실무"
        title="운영에서 매일 만지는 프로토콜·도구·실패 모드"
      >
        10개 토픽. 미드급 인프라 엔지니어 면접의 핵심 영역.
      </Section>

      <Bento>
        <Card href="/docs/security" emphasis className="col-span-2 lg:col-span-4 lg:row-span-2">
          <CardOrd>08 · Defense</CardOrd>
          <CardTitle>공격과 방어 — MITM·DDoS·심층 방어</CardTitle>
          <CardBody>
            ARP 스푸핑, DNS 캐시 포이즈닝, SYN flood, 반사·증폭 DDoS, BGP 하이재킹.
            한 줄의 방어가 무너져도 전체가 무너지지 않는 구조를 만드는 법.
          </CardBody>
          <Tags>
            <Tag tone="bad">L2~L7 전 영역</Tag>
            <Tag tone="good">심층 방어</Tag>
            <Tag tone="accent">Zero Trust</Tag>
          </Tags>
        </Card>
        <Card href="/docs/dns" className="col-span-2 lg:col-span-2">
          <CardOrd>05 · L7</CardOrd>
          <CardTitle>DNS</CardTitle>
          <CardBody>재귀·반복 질의, 캐시 TTL, EDNS, Happy Eyeballs. OS 리졸버 체인.</CardBody>
        </Card>
        <Card href="/docs/http" className="col-span-2 lg:col-span-2">
          <CardOrd>06 · L7</CardOrd>
          <CardTitle>HTTP 1.1 · 2 · 3</CardTitle>
          <CardBody>요청/응답, 멀티플렉싱, 캐싱 디테일, CORS, 쿠키 보안.</CardBody>
        </Card>
        <Card href="/docs/tls" className="col-span-2 lg:col-span-2">
          <CardOrd>07 · Trust</CardOrd>
          <CardTitle>TLS</CardTitle>
          <CardBody>1.3 핸드셰이크, SNI/ECH, OCSP stapling, ALPN, PFS, PQ 하이브리드.</CardBody>
        </Card>
        <Card href="/docs/advanced/bgp" className="col-span-2 lg:col-span-2">
          <CardOrd>09 · Inter-Domain</CardOrd>
          <CardTitle>BGP — 인터넷 라우팅</CardTitle>
          <CardBody>AS·peering·transit·9단계 best path·RPKI·MANRS.</CardBody>
        </Card>

        <Card href="/docs/advanced/cdn-lb" className="col-span-2 lg:col-span-2">
          <CardOrd>10 · Edge</CardOrd>
          <CardTitle>CDN · Anycast · LB</CardTitle>
          <CardBody>엣지 캐시, Anycast vs DNS geo, L4/L7 LB, consistent hashing.</CardBody>
        </Card>
        <Card href="/docs/advanced/quic" className="col-span-2 lg:col-span-2">
          <CardOrd>11 · Transport+</CardOrd>
          <CardTitle>QUIC · 혼잡 제어</CardTitle>
          <CardBody>Connection ID, 0-RTT, Reno·Cubic·BBR. bufferbloat·AQM.</CardBody>
        </Card>
        <Card href="/docs/advanced/vpn" className="col-span-2 lg:col-span-2">
          <CardOrd>12 · Tunnels</CardOrd>
          <CardTitle>VPN — IPsec · WireGuard · Tor</CardTitle>
          <CardBody>캡슐화, IKE, AEAD, Noise. WireGuard의 단순함.</CardBody>
        </Card>
        <Card href="/docs/advanced/auth" className="col-span-2 lg:col-span-2">
          <CardOrd>13 · Identity</CardOrd>
          <CardTitle>OAuth · OIDC · JWT · mTLS</CardTitle>
          <CardBody>Auth code + PKCE, OIDC ID token, JWT 검증, SPIFFE, Zero Trust.</CardBody>
        </Card>
        <Card href="/docs/advanced/observability" className="col-span-2 lg:col-span-4">
          <CardOrd>14 · Visibility</CardOrd>
          <CardTitle>관측 — tcpdump · eBPF · Service Mesh · Tracing</CardTitle>
          <CardBody>
            계층별 가시성 스택. 가설은 위에서 세우고 검증은 아래에서 — 패킷·플로우·트레이스·로그의 합리적 순서.
          </CardBody>
        </Card>
      </Bento>

      {/* L3 */}
      <Section
        level={3}
        eyebrow="L3 · 시니어"
        title="시스템 통합·용량 계획·거버넌스"
      >
        7개 토픽. "주소창 → 화면"의 전체 흐름을 거시적으로 잡고, 클라우드·k8s·신뢰성·숫자로 시니어 인프라의 차별 영역에 도달.
      </Section>

      <Bento>
        <Card href="/docs/walkthrough" emphasis className="col-span-2 lg:col-span-4 lg:row-span-2">
          <CardOrd>★ Interview · End-to-End</CardOrd>
          <CardTitle>주소창 → 화면, 13 단계</CardTitle>
          <CardBody>
            "www.google.com을 치면 무슨 일?"의 시니어 답안. 각 단계의 실패 모드, 지연 비용, 운영 트레이드오프까지 묶어서.
            <br />
            <br />
            이 페이지가 L1~L3의 모든 토픽을 한 흐름에 꿰어주는 통합 인덱스 역할.
          </CardBody>
          <Tags>
            <Tag tone="accent">면접 1번</Tag>
            <Tag>13 단계</Tag>
            <Tag>End-to-End</Tag>
          </Tags>
        </Card>

        <Card href="/docs/advanced/inbound-outbound" className="col-span-2 lg:col-span-2">
          <CardOrd>15 · Traffic Direction</CardOrd>
          <CardTitle>Inbound · Outbound</CardTitle>
          <CardBody>SG vs NACL, iptables, K8s NetworkPolicy, NAT의 SNAT/DNAT.</CardBody>
        </Card>
        <Card href="/docs/advanced/k8s-net" className="col-span-2 lg:col-span-2">
          <CardOrd>16 · Container</CardOrd>
          <CardTitle>K8s 네트워킹</CardTitle>
          <CardBody>CNI · Service · kube-proxy · NetworkPolicy의 진짜 동작.</CardBody>
        </Card>

        <Card href="/docs/advanced/cloud-net" className="col-span-2 lg:col-span-2">
          <CardOrd>17 · Cloud</CardOrd>
          <CardTitle>클라우드 네트워킹</CardTitle>
          <CardBody>VPC · PrivateLink · TGW. AWS/GCP/Azure 매핑.</CardBody>
        </Card>
        <Card href="/docs/advanced/cloud-deep" className="col-span-2 lg:col-span-2">
          <CardOrd>18 · Cloud Internals</CardOrd>
          <CardTitle>클라우드 심화</CardTitle>
          <CardBody>Hyperplane, EKS/GKE Pod IP, Lambda VPC, Direct Connect, DDoS chain, Limits.</CardBody>
        </Card>
        <Card href="/docs/advanced/reliability" className="col-span-2 lg:col-span-2">
          <CardOrd>19 · Reliability</CardOrd>
          <CardTitle>신뢰성 패턴</CardTitle>
          <CardBody>Circuit breaker, hedged, retry budget, SLO, error budget.</CardBody>
        </Card>
        <Card href="/docs/advanced/numbers" className="col-span-2 lg:col-span-6">
          <CardOrd>20 · Mental Numbers</CardOrd>
          <CardTitle>인프라 숫자 — 지연·처리량·비용의 머릿속 기준치</CardTitle>
          <CardBody>
            "느립니다" 대신 "p99가 200ms입니다". Jeff Dean 표 2026 갱신, 한국 발 RTT 실측, AWS 가격 어림, 알람 임계 가이드.
          </CardBody>
        </Card>
      </Bento>

      <p className="mt-16 border-t border-white/[0.06] pt-8 text-center text-xs text-fg-muted">
        왼쪽 사이드바에서 개념을 선택하거나, <kbd className="mx-1 rounded border border-white/10 bg-bg-elev-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">/</kbd>로 검색하세요.
        모든 토픽은 L1·L2·L3 색상으로 레벨이 표시됩니다.
      </p>
    </PageShell>
  );
}

function LevelCard({
  level,
  label,
  color,
  border,
  bg,
  count,
  desc,
  topics,
}: {
  level: 1 | 2 | 3;
  label: string;
  color: string;
  border: string;
  bg: string;
  count: number;
  desc: string;
  topics: string[];
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5 shadow-card"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em]"
          style={{ color }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="font-mono text-[11px] tracking-wider text-fg-muted">{count} 토픽</span>
      </div>
      <p className="mt-2.5 text-[13.5px] leading-relaxed text-fg" style={{ wordBreak: "keep-all", overflowWrap: "anywhere" }}>
        {desc}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <span
            key={t}
            className="rounded-full border px-2 py-0.5 font-mono text-[10.5px] text-fg-muted"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Section({
  level,
  eyebrow,
  title,
  children,
}: {
  level: 1 | 2 | 3;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  const COLOR = { 1: "#5BD5A0", 2: "#8B95E5", 3: "#F4B942" }[level];
  return (
    <section className="mb-4 mt-20">
      <span
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{ color: COLOR }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: COLOR }} />
        {eyebrow}
      </span>
      <h2 className="mt-2 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-fg">
        {title}
      </h2>
      {children && (
        <p
          className="mt-1 max-w-[64ch] text-[15px] leading-[1.7] text-fg-soft [&_strong]:font-semibold [&_strong]:text-fg"
          style={{ wordBreak: "keep-all", overflowWrap: "anywhere" }}
        >
          {children}
        </p>
      )}
    </section>
  );
}

function Bento({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-6 lg:[grid-auto-rows:minmax(200px,auto)]">
      {children}
    </div>
  );
}
