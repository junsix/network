# 시나리오 12 walkthrough: iperf3로 보는 TCP 처리량 / 대역폭 / 손실

> 랩 시나리오 `scenarios/12-iperf-tcp.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/tcp-udp.mdx` (L4, TCP 흐름/혼잡). 시나리오 05의 심화.
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 12-iperf-tcp`

## 등장인물

| 역할 | 주소 | 비고 |
|---|---|---|
| server | `10.60.0.1` | `iperf3 -s`로 대기 (포트 5201) |
| client | `10.60.0.2` | `iperf3 -c`로 부하를 보냄 |
| 스위치 | `br0` | 리눅스 브리지 |

같은 경로에서 **조건만 바꿔** TCP 처리량(Mbits/sec)과 재전송(Retr)이 어떻게 변하는지 본다.
조건은 클라이언트 송신 인터페이스에 `tc`(트래픽 컨트롤) 큐를 걸어 만든다.

iperf3 요약 줄 읽는 법:

```
[  5]   0.00-3.00   sec  41.4 GBytes   119 Gbits/sec    5             sender
                          ^전송량        ^처리량        ^Retr(재전송)  ^방향
```

`sender`(보낸 쪽 기준)와 `receiver`(받은 쪽 기준) 두 줄이 나온다. 끝의 **Retr가 재전송 횟수**다.

## ① 기준선: 제약 없음

```text
[  5]   0.00-3.00   sec  41.4 GBytes   119 Gbits/sec    5    sender
[  5]   0.00-3.00   sec  41.4 GBytes   119 Gbits/sec         receiver
```

- veth 직결이라 **119 Gbits/sec**. 물리 선로가 아니라 메모리 복사 수준이라 이렇게 빠르다.
- Retr는 5. 3초 동안 41 GB를 보내며 생긴 5번이니 **사실상 0**이다(로컬 큐 사정으로 가끔 생기는 정도).
  손실이 없으니 TCP가 창(window)을 한껏 키워 전속력으로 보낸다.

## ② 대역폭 제한: tbf로 천장을 만든다

```text
[client]$ tc qdisc add dev eth0 root tbf rate 20mbit burst 32kbit latency 400ms
qdisc tbf 8001: root rate 20Mbit burst 4Kb lat 400ms

[  5]   0.00-3.00   sec  7.75 MBytes  21.7 Mbits/sec    0    sender
[  5]   0.00-3.05   sec  6.75 MBytes  18.6 Mbits/sec         receiver
```

- `tbf`(Token Bucket Filter)는 송신 속도에 **상한**을 건다. `rate 20mbit`으로 20 Mbit/s 천장을 만들었다.
- 처리량이 119 Gbit -> **약 20 Mbit/s**로 딱 맞춰졌다. Retr는 여전히 0이다.
- 즉 **대역폭은 "관의 굵기"** 다. 손실 없이 그저 통과량만 제한하므로, TCP는 그 천장 아래에서
  여전히 손실 없이 잘 흐른다. 느려진 게 아니라 "굵기에 맞게 흐르는" 상태.

## ③ 손실 주입: netem으로 패킷을 떨군다

```text
[client]$ tc qdisc replace dev eth0 root netem delay 20ms loss 5%
qdisc netem 8002: root limit 1000 delay 20ms loss 5%

[  5]   0.00-3.00   sec  1.50 MBytes  4.19 Mbits/sec   38    sender
[  5]   0.00-3.02   sec  1.38 MBytes  3.81 Mbits/sec         receiver
```

- `netem`으로 지연 20ms와 **손실 5%**를 걸었다. 즉 보내는 패킷의 20개 중 1개꼴로 사라진다.
- 결과: 처리량이 **4.19 Mbits/sec**로 무너졌고, Retr가 **38**로 치솟았다. 직전 단계는 41 GB를 보내고도
  Retr 0이었는데, 이번엔 고작 1.5 MB를 보내며 38번이나 재전송했다.
- 왜 이렇게까지 무너지나? 두 가지가 겹친다.
  - **재전송**: 떨어진 패킷을 TCP가 다시 보낸다(신뢰성). 그만큼 실효 처리량이 깎인다.
  - **혼잡 제어**: TCP는 손실을 "회선이 막혔다"는 신호로 해석해 전송 창을 **확 줄인다.** 그래서
    물리적으로는 119 Gbit가 가능한 회선인데도 4 Mbit까지 떨어진다. 20ms 지연도 창 회복을 늦춰 가세한다.

## 한눈 정리

| 조건 | 처리량 | Retr | 한 줄 해석 |
|---|---|---|---|
| 기준선 | 119 Gbit/s | ~0 | 손실 없으면 전속력 |
| tbf 20mbit | 21.7 Mbit/s | 0 | 대역폭 = 관의 굵기, 손실은 없음 |
| netem 손실 5% | 4.19 Mbit/s | 38 | 손실 -> 재전송 + 혼잡 백오프 -> 붕괴 |

핵심 통찰: **느린 전송의 범인은 대역폭만이 아니다.** 대역폭이 넉넉해도 약간의 손실(과 지연)이
TCP의 혼잡 제어를 건드리면 처리량은 천장보다 훨씬 아래로 주저앉는다. "회선은 빠른데 전송이 기는"
상황의 진짜 원인이 여기 있다. UDP라면 그냥 계속 보내겠지만(시나리오 05), TCP는 신뢰성과 혼잡
회피를 위해 스스로 속도를 양보한다.
