# 시나리오 02 walkthrough: IP 라우팅 (서브넷의 경계를 넘는 법)

> 랩 시나리오 `scenarios/02-ip-routing.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/ip-routing.mdx` (L1-03, L3 계층)
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 02-ip-routing`

## 등장인물

```
hostA (10.0.0.10/24) --- br0 --- [R] --- br1 --- hostB (10.0.1.10/24)
                                eth0:10.0.0.1   eth1:10.0.1.1
```

| 역할 | 주소 | 비고 |
|---|---|---|
| hostA | `10.0.0.10/24` | 서브넷 A |
| hostB | `10.0.1.10/24` | 서브넷 B (A와 다른 서브넷) |
| R (라우터) | `eth0=10.0.0.1`, `eth1=10.0.1.1` | 두 서브넷에 다리를 걸침 |

A와 B는 서로 다른 `/24`다. 같은 서브넷이 아니므로 ARP로 직접 못 찾는다.
패킷은 일단 기본 게이트웨이(라우터)로 가고, 라우터가 자기 라우팅 테이블을 보고 다음 홉으로 넘긴다.

## ① 각 호스트의 기본 게이트웨이

```text
[hostA]$ ip route show
default via 10.0.0.1 dev eth0
10.0.0.0/24 dev eth0 proto kernel scope link src 10.0.0.10

[hostB]$ ip route show
default via 10.0.1.1 dev eth0
10.0.1.0/24 dev eth0 proto kernel scope link src 10.0.1.10
```

- `10.0.0.0/24 dev eth0 ... scope link`: 내 서브넷. 여기로 가는 건 라우터 없이 L2로 직접(`scope link`).
- `default via 10.0.0.1`: 그 외 모든 목적지는 라우터(`10.0.0.1`)로 보낸다. 이 default 라우트가
  없으면 다른 서브넷으로 나갈 때 `Network is unreachable`이 난다.
- hostB도 대칭으로, 자기 게이트웨이는 라우터의 반대쪽 인터페이스 `10.0.1.1`이다.

## ② 다른 서브넷으로 ping이 닿는다

```text
[hostA]$ ping -c 2 -W 1 10.0.1.10
64 bytes from 10.0.1.10: icmp_seq=1 ttl=63 time=0.053 ms
```

- A에서 B로 핑이 성공한다. A는 B의 위치를 모르지만 "내 서브넷이 아니네" 판단 후 라우터로 떠넘기고,
  라우터가 B쪽으로 포워딩했다.
- `ttl=63`이 핵심이다. 리눅스 기본 TTL은 64인데, **라우터를 1번 지나면서 1 줄어** 63이 됐다.
  TTL 감소는 패킷이 실제로 라우팅(L3 포워딩)을 거쳤다는 증거다. (시나리오 01의 같은 서브넷 ping은 64였다.)

## ③ traceroute로 경로의 홉을 본다

```text
[hostA]$ traceroute -n -q1 -w1 10.0.1.10
traceroute to 10.0.1.10 (10.0.1.10), 30 hops max, 60 byte packets
 1  10.0.0.1   0.128 ms
 2  10.0.1.10  0.116 ms
```

- `1 10.0.0.1`: 첫 홉은 라우터의 A쪽 인터페이스. A가 보낸 패킷이 제일 먼저 만나는 L3 장비.
- `2 10.0.1.10`: 두 번째 홉이 목적지 B. 즉 A에서 B까지 라우터 하나를 거치는 2홉 경로다.
- traceroute는 TTL을 1, 2, ... 로 키워 보내며 각 홉이 TTL 소진 시 돌려주는 ICMP로 경로를 그린다.

## ④ 라우터가 포워딩하도록 켜져 있다

```text
[R]$ sysctl net.ipv4.ip_forward
net.ipv4.ip_forward = 1

[R]$ ip route show
10.0.0.0/24 dev eth0 proto kernel scope link src 10.0.0.1
10.0.1.0/24 dev eth1 proto kernel scope link src 10.0.1.1
```

- `ip_forward = 1`: 이게 0이면 라우터는 자기 앞으로 오지 않은 패킷을 그냥 버린다.
  1이어야 "한 인터페이스로 들어온 패킷을 다른 인터페이스로 내보내는" 라우터 역할을 한다.
- 라우터의 테이블에는 두 서브넷이 각각 `eth0`, `eth1`에 `scope link`로 직접 연결돼 있다.
  그래서 A서브넷에서 온 패킷을 보고 "10.0.1.0/24는 eth1쪽이군" 하고 내보낼 수 있다.

## 한눈 정리

| 신호 | 값 | 의미 |
|---|---|---|
| default 라우트 | `via 10.0.0.1` | 내 서브넷 밖은 전부 라우터로 |
| ping TTL | 64 -> 63 | 라우터를 1번 지났다 |
| traceroute 홉 | 라우터, 목적지 | 경로에 L3 장비가 있다 |
| `ip_forward` | 1 | 라우터가 포워딩을 한다 |

같은 서브넷은 ARP로 직접(시나리오 01), 다른 서브넷은 라우터를 경유한다.
그 경유의 흔적이 TTL 1 감소와 traceroute의 홉으로 그대로 드러난다.
