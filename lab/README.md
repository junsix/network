# 네트워킹 핸즈온 랩

교재 사이트(`next/`)에서 글로 읽은 프로토콜을 **직접 돌려보고 패킷으로 확인**하는 실습 환경.

단일 Docker 컨테이너 안에서 리눅스 `network namespace + veth + bridge`로 토폴로지를 만든다.
Docker 자체 네트워킹(docker0 NAT, 127.0.0.11 임베디드 DNS)을 우회하므로
ARP/DHCP/DNS/라우팅 같은 L2/L3 동작을 가짜 없이 그대로 관찰할 수 있다.

## 요구 사항

- Docker 데몬 동작 (colima / Docker Desktop 등)
- 그게 전부다. 호스트에 별도 네트워킹 도구 설치 불필요. (모든 도구는 이미지 안에 있음)

## 빠른 시작

```bash
cd lab
./labctl build         # 베이스 이미지 빌드 (최초 1회)
./labctl list          # 시나리오 목록
./labctl run 01-arp    # 시나리오 실행 (번호/이름/약칭 다 됨: run 1, run arp)
./labctl shell         # 컨테이너에 직접 진입해서 토폴로지 실험
```

각 시나리오는 새 privileged 컨테이너에서 격리 실행되고, 끝나면 컨테이너째 폐기된다.
호스트 네트워크에는 아무 흔적도 남지 않는다.

## 시나리오 ↔ 교재 매핑

| 시나리오 | 무엇을 보는가 | 교재 페이지 |
|---|---|---|
| `01-arp` | who-has / is-at 브로드캐스트, neighbor 캐시가 채워지는 순간 | `next/content/arp.mdx` |
| `02-ip-routing` | 다른 서브넷을 라우터가 중계, TTL 감소, traceroute 홉 | `next/content/ip-routing.mdx` |
| `03-dhcp` | 주소 없는 호스트의 DORA(Discover/Offer/Request/Ack) 임대 | `next/content/dhcp.mdx` |
| `04-dns` | 이름->주소 질의/응답, A 레코드와 NXDOMAIN | `next/content/dns.mdx` |
| `05-tcp-udp` | TCP 3-way handshake와 종료, UDP 무연결 단발 비교 | `next/content/tcp-udp.mdx` |

## 직접 만들어보기 (`./labctl shell`)

컨테이너 안에서 헬퍼를 불러 토폴로지를 선언적으로 조립할 수 있다.

```bash
source /lab/lib/common.sh

bridge br0                          # 가상 스위치
host A; host B                      # 가상 호스트(네임스페이스)
connect A 10.0.0.1/24 br0           # A를 스위치에 연결 + IP 부여
connect B 10.0.0.2/24 br0
x A ping -c1 10.0.0.2               # A 안에서 명령 실행
```

헬퍼 요약 (`lib/common.sh`):

| 헬퍼 | 역할 |
|---|---|
| `host <ns>` | 가상 호스트(네임스페이스) 생성 |
| `bridge <br>` | 가상 스위치(리눅스 브리지) 생성 |
| `connect <ns> <cidr> <br> [ifname] [vethname]` | 호스트를 스위치에 veth로 연결 + IP |
| `router <ns>` | 그 호스트를 라우터로(IP 포워딩 on) |
| `gw <ns> <ip>` | 기본 게이트웨이 설정 |
| `x <ns> <cmd...>` | 특정 호스트 안에서 명령 실행(명령줄도 표시) |
| `sniff <ns\|root> <iface> <filter>` | tcpdump 백그라운드 캡처 |

종료 시 만든 네임스페이스/브리지/프로세스는 trap으로 자동 정리된다.

## 구조

```
lab/
  Dockerfile            베이스 이미지 (iproute2, dnsmasq, tcpdump, dig, nc, iperf3, openssl ...)
  labctl                드라이버 (build / list / run / shell)
  lib/common.sh         토폴로지 빌더 + 로깅 헬퍼
  scenarios/*.sh        시나리오별 실습 스크립트
```

## 확장 메모

- VLAN(802.1q) / STP는 colima VM 커널 모듈 의존이라 별도 검증 후 추가 예정.
- 동적 라우팅(OSPF/BGP)이 필요해지면 FRR 컨테이너로 확장. 현재 L1 정적 라우팅은 `ip route`로 충분.
- 새 시나리오는 `scenarios/NN-name.sh`로 추가하면 `labctl list`가 자동 인식한다.
  파일 상단 `# 시나리오 NN: 설명` 주석이 목록에 노출된다.
