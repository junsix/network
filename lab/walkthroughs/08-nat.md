# 시나리오 08 walkthrough: NAT (사설 IP가 공인 IP로 둔갑하는 순간)

> 랩 시나리오 `scenarios/08-nat.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/advanced/inbound-outbound.mdx` (NAT/SNAT)
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 08-nat`

## 등장인물

```
inside (192.168.100.10/24)  --- br0 --- [R] --- br1 ---  server (203.0.113.9/24)
        사설망                 eth0:192.168.100.1   eth1:203.0.113.1   공인망 흉내
```

| 역할 | 주소 | 비고 |
|---|---|---|
| inside | `192.168.100.10` | 사설망 호스트 |
| R | `eth0=192.168.100.1` (안), `eth1=203.0.113.1` (밖) | NAT 경계 라우터 |
| server | `203.0.113.9` | 공인망 흉내 (RFC 5737 TEST-NET) |

핵심 장치: server에는 **일부러 사설망(192.168.100/24)으로 가는 경로를 주지 않았다.** 실제 인터넷에서
공인 호스트가 내 사설 IP를 모르는 상황과 같다. 이 상태에서 NAT가 있을 때와 없을 때를 비교한다.

## ① NAT 켜기 전: 응답이 못 돌아온다

```text
[inside]$ ping -c 1 -W 1 203.0.113.9
1 packets transmitted, 0 received, 100% packet loss
```

- echo request 자체는 R을 거쳐 server까지 도달한다(출발지 `192.168.100.10` 그대로).
- 그러나 server가 `192.168.100.10`으로 **답하려는 순간 경로가 없다.** server의 라우팅 테이블엔
  `203.0.113.0/24`밖에 없고 default도 없어서, 사설 IP로 가는 응답을 보낼 수 없다.
- 결과는 100% 손실. "나가긴 나가는데 돌아올 주소가 공인망에서 무의미해서" 통신이 안 되는 것이다.
  이것이 NAT가 필요한 이유다.

## ② NAT 켜기: MASQUERADE 규칙

```text
[R]$ iptables -t nat -A POSTROUTING -o eth1 -j MASQUERADE
[R]$ iptables -t nat -L POSTROUTING -n -v
 pkts bytes target      prot opt in   out    source       destination
    0     0 MASQUERADE   0   --  *    eth1   0.0.0.0/0    0.0.0.0/0
```

- `-t nat -A POSTROUTING`: 라우팅 결정이 끝나고 인터페이스로 나가기 직전 단계(POSTROUTING)에 규칙을 단다.
- `-o eth1 -j MASQUERADE`: **eth1(공인쪽)로 나가는 패킷**의 출발지 IP를, 그 인터페이스의 주소
  (`203.0.113.1`)로 자동 치환한다. `MASQUERADE`는 나가는 인터페이스 IP를 알아서 쓰는 SNAT의 한 형태다.
- 아직 `pkts 0`: 규칙만 걸렸고 통과한 패킷은 없다.

## ③ NAT 켠 후: 같은 핑이 성공한다

```text
[inside]$ ping -c 2 -W 1 203.0.113.9
64 bytes from 203.0.113.9: icmp_seq=1 ttl=63 time=0.491 ms
2 packets transmitted, 2 received, 0% packet loss
```

이제 왕복이 된다. 무엇이 달라졌는지는 두 구간을 동시에 떠 보면 한눈에 드러난다.

## ④ 핵심: 경계에서 출발지 IP가 바뀐다

```text
안쪽(br0)에서 본 출발지:
      192.168.100.10 > 203.0.113.9: ICMP echo request, id 45, seq 1
바깥쪽(br1)에서 본 출발지:
      203.0.113.1    > 203.0.113.9: ICMP echo request, id 45, seq 1
```

- **같은 패킷이다**(`id 45, seq 1` 동일). 그런데 출발지 IP가 다르다.
- 안쪽 br0에서는 아직 `192.168.100.10`(사설). 바깥쪽 br1에서는 `203.0.113.1`(R의 공인 IP)로 **둔갑**했다.
- server 입장에선 "203.0.113.1이 핑을 보냈다"고 보이므로, 같은 서브넷인 그 주소로 문제없이 답한다.
  돌아온 응답은 R이 conntrack 기록을 보고 원래의 `192.168.100.10`으로 되돌려준다(역변환).
- 이것이 SNAT(Source NAT)의 본질이다. "안에서는 사설 주소, 밖에서는 라우터의 공인 주소 하나로 합쳐져 나간다."

## ⑤ 규칙은 한 번만 탄다 (conntrack)

```text
[R]$ iptables -t nat -L POSTROUTING -n -v   (핑 2번 후)
 pkts bytes target      prot opt in   out    source       destination
    1    84 MASQUERADE   0   --  *    eth1   0.0.0.0/0    0.0.0.0/0
```

- echo request를 **2번** 보냈는데 MASQUERADE 카운터는 **1**이다. 왜?
- nat 테이블 규칙은 한 흐름(connection)의 **첫 패킷에만** 적용된다. 그 결과가 conntrack에 기록되고,
  이후 같은 흐름의 패킷은 규칙을 다시 타지 않고 conntrack이 곧바로 같은 변환을 적용한다(빠른 경로).
- 그래서 "패킷 수"가 아니라 "흐름 수"만큼 카운터가 오른다. NAT가 상태 기반(stateful)이라는 증거다.

## 한눈 정리

| | NAT 없음 | NAT 있음 (MASQUERADE) |
|---|---|---|
| inside -> server 핑 | 실패 (100% 손실) | 성공 |
| 바깥쪽 출발지 IP | `192.168.100.10` (사설) | `203.0.113.1` (R 공인) |
| 응답 경로 | 없음 (공인망에 사설 경로 부재) | 있음 (R 공인 IP는 server와 같은 망) |
| 규칙 적용 횟수 | (해당 없음) | 흐름당 1회 (conntrack) |

NAT는 "여러 사설 호스트를 라우터의 공인 IP 하나로 모아 내보내고, 돌아온 응답을 추적 기록으로 되돌려주는"
장치다. 같은 핑이 경계를 넘으며 출발지 IP가 바뀌는 한 줄이 그 전부를 보여준다.
