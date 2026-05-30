/**
 * Wiki-style sidebar metadata.
 * Single source of truth for navigation, breadcrumbs, and adjacent-page links.
 *
 * Site concept: 주니어 → 시니어로 가는 진행.
 *   L1 · 기초   — 프로토콜이 무엇이고 어떻게 동작하는지
 *   L2 · 실무   — 운영 디테일, 트레이드오프, 실패 모드
 *   L3 · 시니어 — 시스템 통합, 용량 계획, 거버넌스
 */
export type TopicId = string;
export type Level = 1 | 2 | 3;

export interface Topic {
  slug: string;
  title: string;
  subtitle?: string;
  ord?: string;
  level?: Level;
}

export interface TopicGroup {
  id: string;
  label: string;
  level: Level;
  hint?: string;
  items: Topic[];
}

export const topicGroups: TopicGroup[] = [
  {
    id: "l1",
    label: "L1 · 기초",
    level: 1,
    hint: "주소가 정해지고, 프로토콜이 동작하기까지",
    items: [
      { slug: "layers", title: "계층 모델", subtitle: "OSI · TCP/IP", ord: "01 · Foundation", level: 1 },
      { slug: "arp", title: "ARP", subtitle: "IP → MAC", ord: "02 · L2", level: 1 },
      { slug: "ip-routing", title: "IP & 라우팅", subtitle: "서브넷 · 다음 홉", ord: "03 · L3", level: 1 },
      { slug: "tcp-udp", title: "TCP · UDP", subtitle: "전송 계층", ord: "04 · L4", level: 1 },
      { slug: "dhcp", title: "DHCP", subtitle: "처음 IP를 받는 법", ord: "04.5 · Auto-config", level: 1 },
      { slug: "icmp", title: "ICMP", subtitle: "ping · traceroute · PMTUD", ord: "04.7 · Diagnostics", level: 1 },
      { slug: "ethernet", title: "이더넷 · VLAN · STP", subtitle: "스위치 안에서 일어나는 일", ord: "04.8 · L2 Depth", level: 1 },
      { slug: "access-layer", title: "WiFi · PPPoE · mDNS", subtitle: "물리 액세스의 세 모양", ord: "04.9 · Physical Access", level: 1 },
    ],
  },
  {
    id: "l2",
    label: "L2 · 실무",
    level: 2,
    hint: "운영에서 매일 만지는 프로토콜·도구·실패 모드",
    items: [
      { slug: "dns", title: "DNS", subtitle: "이름을 주소로", ord: "05 · L7", level: 2 },
      { slug: "http", title: "HTTP", subtitle: "1.1 · 2 · 3", ord: "06 · L7", level: 2 },
      { slug: "tls", title: "TLS", subtitle: "안전한 채널", ord: "07 · Trust", level: 2 },
      { slug: "security", title: "공격과 방어", subtitle: "MITM · DDoS · 심층 방어", ord: "08 · Defense", level: 2 },
      { slug: "advanced/bgp", title: "BGP", subtitle: "인터넷 라우팅", ord: "09 · Inter-Domain", level: 2 },
      { slug: "advanced/cdn-lb", title: "CDN · LB", subtitle: "Anycast · 로드밸런싱", ord: "10 · Edge", level: 2 },
      { slug: "advanced/quic", title: "QUIC · 혼잡 제어", subtitle: "Reno · Cubic · BBR", ord: "11 · Transport+", level: 2 },
      { slug: "advanced/vpn", title: "VPN", subtitle: "IPsec · WireGuard · Tor", ord: "12 · Tunnels", level: 2 },
      { slug: "advanced/auth", title: "OAuth · OIDC", subtitle: "사용자·서비스 신원 확인", ord: "13 · Identity", level: 2 },
      { slug: "advanced/observability", title: "관측", subtitle: "느림·실패의 원인 찾기", ord: "14 · Visibility", level: 2 },
      { slug: "advanced/rate-limiting", title: "Rate Limiting", subtitle: "흐름을 제한하는 알고리즘", ord: "15 · Rate Limit", level: 2 },
      { slug: "advanced/messaging", title: "메시지 큐", subtitle: "비동기 통신의 신뢰성", ord: "16 · Async Messaging", level: 2 },
    ],
  },
  {
    id: "l3",
    label: "L3 · 시니어",
    level: 3,
    hint: "시스템 통합·용량 계획·시니어 차별 영역",
    items: [
      { slug: "walkthrough", title: "주소창 → 화면", subtitle: "End-to-end 통합", ord: "★ Interview", level: 3 },
      { slug: "advanced/inbound-outbound", title: "Inbound · Outbound", subtitle: "들어오는 트래픽 · 나가는 트래픽", ord: "17 · Traffic Direction", level: 3 },
      { slug: "advanced/nat-traversal", title: "NAT Traversal", subtitle: "방화벽 뒤로 들어가는 법", ord: "18 · NAT Traversal", level: 3 },
      { slug: "advanced/consensus", title: "분산 합의", subtitle: "여러 노드가 하나의 답에 합의", ord: "19 · Consensus", level: 3 },
      { slug: "advanced/k8s-net", title: "K8s 네트워킹", subtitle: "CNI · Service · NetworkPolicy", ord: "20 · Container", level: 3 },
      { slug: "advanced/cloud-net", title: "클라우드 네트워킹", subtitle: "VPC · PrivateLink · TGW", ord: "21 · Cloud", level: 3 },
      { slug: "advanced/cloud-deep", title: "클라우드 심화", subtitle: "클라우드 네트워크의 내부 구현", ord: "22 · Cloud Internals", level: 3 },
      { slug: "advanced/reliability", title: "신뢰성 패턴", subtitle: "Circuit · Backoff · SLO", ord: "23 · Reliability", level: 3 },
      { slug: "advanced/numbers", title: "인프라 숫자", subtitle: "지연·처리량·비용", ord: "24 · Mental Numbers", level: 3 },
    ],
  },
];

export const allTopics: Topic[] = topicGroups.flatMap((g) => g.items);

export function findTopic(slug: string): Topic | undefined {
  return allTopics.find((t) => t.slug === slug);
}

export function findGroup(slug: string): TopicGroup | undefined {
  return topicGroups.find((g) => g.items.some((t) => t.slug === slug));
}

export function adjacent(slug: string) {
  const i = allTopics.findIndex((t) => t.slug === slug);
  return {
    prev: i > 0 ? allTopics[i - 1] : undefined,
    next: i >= 0 && i < allTopics.length - 1 ? allTopics[i + 1] : undefined,
  };
}
