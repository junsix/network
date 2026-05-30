# 랩 walkthrough 모음

각 시나리오를 실제로 돌려 캡처한 출력을 패킷/명령 한 줄씩 해설한 문서다.
교재(`next/content/*.mdx`)에서 글로 읽은 프로토콜을, 랩에서 직접 본 결과와 짝지어 읽는다.

| # | 문서 | 주제 | 계층 | 교재 |
|---|---|---|---|---|
| 01 | [01-arp.md](01-arp.md) | ARP (IP -> MAC) | L2 | `arp.mdx` |
| 02 | [02-ip-routing.md](02-ip-routing.md) | IP 라우팅 (서브넷 경계 넘기) | L3 | `ip-routing.mdx` |
| 03 | [03-dhcp.md](03-dhcp.md) | DHCP (DORA로 주소 임대) | Auto-config | `dhcp.mdx` |
| 04 | [04-dns.md](04-dns.md) | DNS (이름 -> 주소 질의/응답) | L2 실무 | `dns.mdx` |
| 05 | [05-tcp-udp.md](05-tcp-udp.md) | TCP 핸드셰이크 vs UDP | L4 | `tcp-udp.mdx` |
| 06 | [06-http-tls.md](06-http-tls.md) | HTTP vs HTTPS (평문/암호문, SNI) | L7 | `http.mdx`, `tls.mdx` |
| 07 | [07-icmp.md](07-icmp.md) | ICMP (echo / time exceeded / unreachable) | L3 보조 | `icmp.mdx` |
| 08 | [08-nat.md](08-nat.md) | NAT (MASQUERADE, 출발지 IP 변환) | L3 경계 | `advanced/inbound-outbound.mdx` |
| 09 | [09-vlan.md](09-vlan.md) | VLAN (802.1Q 태그로 L2 격리) | L2 | `ethernet.mdx` |
| 10 | [10-firewall.md](10-firewall.md) | 방화벽 (iptables DROP vs REJECT) | L3/L4 | `security.mdx` |
| 11 | [11-l7-lb.md](11-l7-lb.md) | L7 로드밸런서 / 리버스 프록시 (nginx) | L7 | `advanced/cdn-lb.mdx` |
| 12 | [12-iperf-tcp.md](12-iperf-tcp.md) | iperf3 TCP 처리량/대역폭/손실·재전송 | L4 | `tcp-udp.mdx` |
| 13 | [13-dns-rr.md](13-dns-rr.md) | DNS 라운드로빈 vs L7 LB | L7/분산 | `dns.mdx`, `advanced/cdn-lb.mdx` |

## 직접 보기

```bash
cd lab
LAB_STEP=1 ./labctl run 01-arp   # 단계/명령마다 Enter 로 멈춰가며 관찰
```

`LAB_STEP=1`을 빼면 자동으로 흘러간다. 문서의 캡처값(IP, MAC, 포트, 시각)은 실행마다 달라질 수 있다.

> 안내: 문서에 나오는 IP/MAC은 RFC 1918 사설 대역과 veth 무작위 MAC이며,
> 실행 중에만 존재하던 컨테이너 내부 값이다(`--rm`으로 폐기). 실재하지 않는 예시값이다.
