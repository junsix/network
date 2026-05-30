# 시나리오 10 walkthrough: 방화벽 (DROP vs REJECT)

> 랩 시나리오 `scenarios/10-firewall.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/security.mdx` (L3/L4 필터링)
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 10-firewall`

## 등장인물

| 역할 | 주소 | 비고 |
|---|---|---|
| client | `10.40.0.2` | nc로 접속을 시도하는 쪽 |
| server | `10.40.0.1` | 8080 TCP 서비스 운영. iptables 방화벽을 건다 |
| 스위치 | `br0` | 리눅스 브리지 |

같은 "막기"라도 방식이 둘이다. **DROP**(조용히 버림)과 **REJECT**(명시적 거절)다. 같은 포트를
두 방식으로 막고, 클라이언트가 겪는 차이를 비교한다. 방화벽 기본 정책은 `ACCEPT`(다 허용)로 두고,
8080만 골라 막는다.

테스트 도구는 `nc -z -v -w 2`(2초 안에 TCP 연결만 시도하고 결과를 알림)다.

## ① 기준선: 규칙이 없으면 접속된다

```text
[client]$ nc -z -v -w 2 10.40.0.1 8080
Connection to 10.40.0.1 8080 port [tcp/http-alt] succeeded!
```

서버에서 8080이 열려 있고 막는 규칙이 없으니 연결이 성립한다. 여기서부터 출발한다.

## ② DROP: 조용히 버린다 → 타임아웃

```text
[server]$ iptables -A INPUT -p tcp --dport 8080 -j DROP
      num  pkts bytes target  prot opt ...  destination
      1       0     0 DROP    6   --       ...  tcp dpt:8080

[client]$ nc -z -v -w 2 10.40.0.1 8080
nc: connect to 10.40.0.1 port 8080 (tcp) timed out: Operation now in progress
```

- `iptables -A INPUT -p tcp --dport 8080 -j DROP`: filter 테이블의 INPUT 체인(서버로 **들어오는**
  패킷)에 "목적지 TCP 8080이면 DROP" 규칙을 추가한다.
- DROP은 패킷을 **아무 통보 없이 그냥 버린다.** 클라이언트의 SYN은 서버에 닿자마자 사라지고,
  어떤 응답도 돌아오지 않는다.
- 그래서 클라이언트는 `timed out`. 2초를 꽉 기다린 뒤에야 실패로 판단한다. 더 중요한 건,
  **포트가 닫힌 건지, 방화벽에 막힌 건지, 호스트가 죽었는지조차 구분할 수 없다는 점**이다.
  무응답은 정보를 주지 않는다.

## ③ REJECT: 명시적으로 거절한다 → 즉시 refused

```text
[server]$ iptables -D INPUT -p tcp --dport 8080 -j DROP
[server]$ iptables -A INPUT -p tcp --dport 8080 -j REJECT --reject-with tcp-reset

[client]$ nc -z -v -w 2 10.40.0.1 8080
nc: connect to 10.40.0.1 port 8080 (tcp) failed: Connection refused
```

- DROP 규칙을 빼고(`-D`) REJECT로 바꿨다. `--reject-with tcp-reset`은 들어온 SYN에 **RST(reset)를
  돌려보내** 연결을 즉시 거절한다.
- 클라이언트는 기다림 없이 `Connection refused`를 받는다. RST가 즉시 왔기 때문이다.
- (REJECT는 RST 대신 ICMP 'port unreachable'을 보내게 할 수도 있다. 그 경우 시나리오 07의
  destination unreachable과 같은 메시지가 돌아온다. 여기선 TCP답게 tcp-reset을 썼다.)

## ④ 규칙이 실제로 패킷을 처리했다

```text
[server]$ iptables -L INPUT -n -v --line-numbers
      num  pkts bytes target  prot opt ...  destination
      1       1    60 REJECT  6   --       ...  tcp dpt:8080 reject-with tcp-reset
```

- `pkts 1, bytes 60`: 클라이언트의 SYN 1개가 이 REJECT 규칙에 걸려 처리됐다는 카운터다.
  규칙이 "걸려 있기만" 한 게 아니라 실제로 동작했음을 숫자로 확인한다.

## 한눈 정리

| 방식 | 동작 | 클라이언트 체감 | 정보 노출 |
|---|---|---|---|
| (규칙 없음) | 서비스가 응답 | `succeeded` | 포트 열림 |
| **DROP** | 패킷을 조용히 버림 | `timed out` (느림) | 아무것도 모름 |
| **REJECT** | RST/ICMP로 거절 | `Connection refused` (즉시) | "막혔다"를 앎 |

설계 관점의 트레이드오프:
- **DROP**은 호스트의 존재 자체를 숨긴다(스텔스). 인터넷에 노출된 표면에서 스캐너에게 단서를 안 주려고 흔히 쓴다. 대신 정상 사용자도 오래 기다린다.
- **REJECT**는 빠르고 친절하다. 내부망에서 "이 포트는 안 쓴다"를 즉시 알려 앱이 빨리 실패(fail-fast)하게 한다. 대신 포트가 막혀 있다는 사실은 드러난다.

같은 "차단"이라도 무응답이냐 명시적 거절이냐에 따라 보안 노출과 사용자 경험이 갈린다.
