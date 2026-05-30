# 시나리오 04 walkthrough: DNS (이름을 주소로 바꾸는 질의/응답)

> 랩 시나리오 `scenarios/04-dns.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/dns.mdx` (L2 실무)
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 04-dns`

## 등장인물

| 역할 | 주소 | 비고 |
|---|---|---|
| dnssrv | `10.10.0.1` | dnsmasq DNS 서버 |
| client | `10.10.0.2` | dig으로 질의하는 쪽 |
| 스위치 | `br0` | 리눅스 브리지 |

서버에는 권한 레코드 두 개를 정의해 뒀다: `web.lab.internal -> 10.10.0.99`, `db.lab.internal -> 10.10.0.98`.
client가 이 이름들을 IP로 바꾸려고 서버에 질의(query)를 던지고, 서버가 응답(response)을 돌려주는 과정을 본다.

## ① 정상 이름 질의: A 레코드를 받는다

```text
[4] client에서 정상 이름 질의 (A 레코드)
      [client]$ dig +noall +question +answer @10.10.0.1 web.lab.internal
      ;web.lab.internal.        IN  A
      web.lab.internal.    0    IN  A   10.10.0.99
```

- `;web.lab.internal. IN A`: 질문 섹션. `;`로 시작하는 주석 형식이며 "web.lab.internal의 A 레코드를 묻는다"는 뜻.
  A 레코드는 이름 -> IPv4 매핑이다.
- `web.lab.internal. 0 IN A 10.10.0.99`: 응답. 이름이 `10.10.0.99`로 해석됐다.
  중간의 `0`은 TTL(캐시 유효시간, 초)인데 여기선 0이라 "캐시하지 말라"는 의미.
- `@10.10.0.1`은 "이 서버에게 직접 물어라"는 지정이다.

## ② 없는 이름 질의: NXDOMAIN

```text
[5] 존재하지 않는 이름 질의 (NXDOMAIN)
      [client]$ dig +nocmd +noall +comments @10.10.0.1 nope.lab.internal
      ;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 21645
      ;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 1
```

- `status: NXDOMAIN`: "그런 이름은 없다"는 공식 응답. 에러로 연결이 끊긴 게 아니라, 서버가 정상적으로
  "없음"을 답한 것이다. 응답이 안 온 것(timeout)과는 전혀 다르다.
- `ANSWER: 0`: 답 레코드가 0개. 정상 질의(①)의 `ANSWER: 1`과 대비된다.
- `flags: qr rd ra`: `qr`=응답임, `rd`=재귀 요청됨, `ra`=재귀 가능. 헤더 플래그로 응답의 성격을 표시한다.

## ③ 같은 사건을 패킷으로 (질의/응답 쌍)

```text
[6] 캡처된 질의/응답 + 서버 로그
      15:15:15.510387 IP 10.10.0.2.48987 > 10.10.0.1.53: 51791+ [1au] A? web.lab.internal. (57)
      15:15:15.510977 IP 10.10.0.1.53 > 10.10.0.2.48987: 51791* 1/0/1 A 10.10.0.99 (61)
      15:15:15.532408 IP 10.10.0.2.49252 > 10.10.0.1.53: 21645+ [1au] A? nope.lab.internal. (58)
      15:15:15.532558 IP 10.10.0.1.53 > 10.10.0.2.49252: 21645 NXDomain 0/0/1 (46)
      [server] dnsmasq: query[A] web.lab.internal from 10.10.0.2
      [server] dnsmasq: query[A] nope.lab.internal from 10.10.0.2
```

DNS는 보통 UDP 포트 53을 쓴다. 질의와 응답이 한 쌍으로 오간다.

- **질의** `10.10.0.2.48987 > 10.10.0.1.53: 51791+ [1au] A? web.lab.internal.`
  - `51791`: 질의 ID. 응답과 짝을 맞추는 번호.
  - `+`: 재귀 요청(RD). `[1au]`: 추가 레코드 1개(EDNS).
  - `A?`: A 레코드를 묻는다. `(57)`: 메시지 길이(바이트).
- **응답** `10.10.0.1.53 > 10.10.0.2.48987: 51791* 1/0/1 A 10.10.0.99`
  - `51791`: 질의와 같은 ID로 돌아왔다(짝이 맞다).
  - `*`: 권한 있는 응답(AA). `1/0/1`: answer 1 / authority 0 / additional 1.
  - `A 10.10.0.99`: 실제 답.
- **없는 이름 응답** `21645 NXDomain 0/0/1`
  - 같은 ID(`21645`)로 `NXDomain`이 왔고 answer는 0개. ②의 dig 헤더와 정확히 일치한다.
- 서버 로그의 `query[A] ... from 10.10.0.2`는 서버가 두 질의를 받은 기록. client 패킷과 대칭이다.

## 한눈 정리

| 질의 | 응답 status | ANSWER 수 | 의미 |
|---|---|---|---|
| web.lab.internal | (정상) | 1 | `A 10.10.0.99` |
| nope.lab.internal | NXDOMAIN | 0 | "그런 이름 없음" |

DNS는 이름을 주소로 바꾸는 질의/응답이다. 질의 ID로 요청과 응답을 짝짓고,
없는 이름조차 NXDOMAIN이라는 "정상 응답"으로 돌려준다. 응답이 오지 않는 것과 "없다는 응답"은 다르다.
