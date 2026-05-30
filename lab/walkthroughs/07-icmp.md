# 시나리오 07 walkthrough: ICMP (상태와 오류를 알리는 신호)

> 랩 시나리오 `scenarios/07-icmp.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/icmp.mdx` (L3 보조 프로토콜)
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 07-icmp`

## 등장인물

```
hostA (10.30.0.10/24) --- br0 --- [R] --- br1 --- hostB (10.30.1.10/24)
                                eth0:10.30.0.1  eth1:10.30.1.1
```

ICMP는 데이터를 나르는 프로토콜이 아니라 **"상태와 오류를 알리는" 신호**다. TTL 소진을 라우터에서
일으켜 보려고 시나리오 02처럼 라우터를 한 대 두었다. 캡처는 A쪽 세그먼트(`br0`)에서 `icmp`만 떴다.

대표 3종을 본다: echo(ping), time exceeded(traceroute의 원리), destination unreachable(닫힌 포트).

## ① Echo: ping의 본질 (type 8 / type 0)

```text
[hostA]$ ping -c 2 -W 1 10.30.1.10
64 bytes from 10.30.1.10: icmp_seq=1 ttl=63 time=0.252 ms

      ... 10.30.0.10 > 10.30.1.10: ICMP echo request, id 42, seq 1, length 64
      ... 10.30.1.10 > 10.30.0.10: ICMP echo reply,   id 42, seq 1, length 64
      ... 10.30.0.10 > 10.30.1.10: ICMP echo request, id 42, seq 2, length 64
      ... 10.30.1.10 > 10.30.0.10: ICMP echo reply,   id 42, seq 2, length 64
```

- `ICMP echo request`(type 8)를 A가 보내면, B가 `ICMP echo reply`(type 0)로 답한다. ping은 이게 전부다.
- `id 42, seq 1/2`: 요청과 응답을 짝짓는 식별자/순번. 보낸 요청과 받은 응답의 id/seq가 같아야 "그 핑의 답"이다.
- `ttl=63`: 리눅스 기본 TTL 64가 라우터 1홉을 지나며 63이 됐다(시나리오 02와 같은 신호).

## ② Time Exceeded: TTL이 0이 되면 (type 11)

```text
[hostA]$ ping -c 1 -W 1 -t 1 10.30.1.10
From 10.30.0.1 icmp_seq=1 Time to live exceeded

      ... 10.30.0.1 > 10.30.0.10: ICMP time exceeded in-transit, length 92
```

- `-t 1`: 이 핑의 TTL을 1로 박았다. 패킷은 라우터 R까지는 가지만, R이 포워딩하려고 TTL을 1에서 0으로
  깎는 순간 **폐기**된다.
- `From 10.30.0.1 ... Time to live exceeded`: 폐기한 장본인인 **라우터 R(10.30.0.1)**이 출발지에게
  `ICMP time exceeded`(type 11)를 돌려준다. 목적지 B가 아니라 중간 라우터가 답을 보낸 점이 핵심이다.
- `in-transit`: "전달 도중 TTL 소진"이라는 의미.
- **이것이 traceroute의 원리다.** TTL을 1, 2, 3... 으로 키워가며 보내면, 각 홉이 차례로 time exceeded를
  돌려주고, 그 출발지 IP를 모으면 경로가 그려진다(시나리오 02의 traceroute가 이렇게 동작했다).

## ③ Destination Unreachable: 닫힌 포트 (type 3)

```text
[hostA]$ echo x | nc -u -w1 10.30.1.10 9999

      ... 10.30.1.10 > 10.30.0.10: ICMP 10.30.1.10 udp port 9999 unreachable, length 38
```

- A가 B의 UDP 9999번 포트로 한 방 보냈는데, B에는 그 포트를 듣는 프로그램이 없다.
- 그러면 B의 커널이 `ICMP ... udp port 9999 unreachable`(type 3, code 3 = port unreachable)을
  출발지에게 돌려준다. "그 포트 안 열려 있다"는 명시적 거절이다.
- **중요한 구분**: 이 "도달 불가 응답"은 **응답이 아예 안 오는 것(timeout)과 다르다.** 방화벽이 조용히
  버리면 아무 답도 없지만(timeout), 여기처럼 거절을 알려주면 즉시 unreachable이 온다.

## ④ 집계로 본 디테일

```text
[6] 정리: 캡처된 ICMP 메시지 집계
      echo request: 3 / echo reply: 2 / time exceeded: 1 / unreachable: 1
```

- echo **request 3 vs reply 2**가 눈에 띈다. 정상 ping 2번(①)에 더해, ②의 TTL=1 ping도 echo request를
  하나 더 보냈기 때문이다. 그런데 그 요청은 라우터에서 죽어서 **reply를 못 받았다.** 그래서 요청은 3,
  응답은 2. 캡처 숫자만으로도 "어떤 요청이 답을 못 받았는지"가 드러난다.

## 한눈 정리

| ICMP 메시지 | type | 누가 보내나 | 언제 |
|---|---|---|---|
| echo request | 8 | 출발지 | ping을 쏠 때 |
| echo reply | 0 | 목적지 | echo request에 응답 |
| time exceeded | 11 | TTL이 0 된 라우터 | TTL 소진 (traceroute의 원리) |
| destination unreachable | 3 | 목적지(또는 라우터) | 포트/호스트/네트워크에 못 닿을 때 |

ICMP는 통신의 "본문"이 아니라 통신에 대한 **메타 신호**다. 잘 닿았는지(echo), 너무 멀어 죽었는지
(time exceeded), 받을 곳이 없는지(unreachable)를 알려준다. ping과 traceroute가 모두 이 신호 위에서 돈다.
