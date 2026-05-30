# 시나리오 06 walkthrough: HTTP vs HTTPS (평문과 암호문)

> 랩 시나리오 `scenarios/06-http-tls.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/http.mdx`, `next/content/tls.mdx` (L7)
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 06-http-tls`

## 등장인물

| 역할 | 주소 | 비고 |
|---|---|---|
| client | `10.20.0.2` | curl로 요청하는 쪽 |
| server | `10.20.0.1` | HTTP는 8080, HTTPS는 8443 |
| 스위치 | `br0` | 리눅스 브리지 |

같은 토폴로지에서 같은 응답을 한 번은 평문 HTTP로, 한 번은 TLS로 주고받고, 브리지에서 뜬 패킷을
`-A`(ASCII 표시)로 비교한다. "암호화하면 무엇이 가려지고 무엇이 남는가"가 핵심이다.

> 주소 안내: IP/도메인 모두 폐기된 컨테이너 내부의 예시값이다. `shop.lab.server`는 SNI 시연을
> 위해 `curl --resolve`로 `10.20.0.1`에 매핑한 가짜 이름이다(실제 DNS 아님).

## ① HTTP: 요청도 응답도 본문도 전부 읽힌다

```text
[4] client가 curl 로 HTTP GET
      [client]$ curl -s --max-time 5 http://10.20.0.1:8080/
      hello-cleartext

[5] 캡처에서 평문이 그대로 읽히는지 확인
      ... 10.20.0.2.43214 > 10.20.0.1.8080: Flags [P.], ... length 77: HTTP: GET / HTTP/1.1
      ... 10.20.0.1.8080 > 10.20.0.2.43214: Flags [P.], ... length 61: HTTP: HTTP/1.0 200 OK
      hello-cleartext
```

- `length 77: HTTP: GET / HTTP/1.1`: 클라이언트가 보낸 **요청줄이 패킷에 그대로** 들어 있다.
  tcpdump가 `HTTP:`로 프로토콜을 알아보고 ASCII로 풀어 보여준다.
- `HTTP/1.0 200 OK` + `hello-cleartext`: 서버 응답의 상태줄과 **본문까지 평문**이다.
- 즉 경로상의 누구든(스위치, 라우터, 같은 네트워크의 호스트) 이 패킷만 보면 "무엇을 요청했고
  무엇을 돌려받았는지"를 통째로 읽는다. 이것이 HTTP의 도청 가능성이다.

## ② HTTPS: 같은 대화를 TLS로 감싸면

```text
[8] client가 HTTPS GET (이름 shop.lab.server 로 접속 -> ClientHello에 SNI 실림)
      * SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / X25519 / RSASSA-PSS
      < HTTP/1.0 200 ok
```

- `SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384 / ...`: TLS 1.3으로 연결됐다.
  뒤의 항목은 협상된 암호 스위트(AES-256-GCM), 키 교환(X25519), 서명(RSASSA-PSS)이다.
- `< HTTP/1.0 200 ok`: 클라이언트 쪽에서는 **복호화 후** 정상적으로 200 응답을 받는다.
  즉 통신 자체는 HTTP와 똑같이 성립한다. 달라지는 건 "와이어 위의 모습"뿐이다.

## ③ 캡처 대조: 본문은 사라지고, 접속 도메인만 남는다

```text
[9] 캡처 대조
      [1] 평문 본문/요청 검색 (HTTPS 캡처에서 'hello'/'GET'/'HTML'):
      (없음) 본문·요청이 모두 암호화돼 캡처에 안 보인다
      [2] 그래도 SNI(접속하려는 도메인)는 ClientHello에 평문으로 들어간다:
      SNI 노출: shop.lab.server
```

- **[1]**: HTTP에서 그대로 읽히던 `GET`, `hello-cleartext`, 응답 HTML이 HTTPS 캡처에는
  **하나도 검출되지 않는다**. 본문과 요청이 전부 암호화됐기 때문.
- **[2]**: 그런데 `shop.lab.server`는 캡처에 **평문으로 남는다**. TLS 핸드셰이크의 첫 메시지인
  ClientHello에 들어가는 **SNI(Server Name Indication)** 때문이다. 서버가 여러 도메인을 한 IP에서
  호스팅할 때 "어느 인증서를 줘야 하는지" 고르려고, 클라이언트가 접속하려는 도메인을 핸드셰이크
  맨 앞에 평문으로 알린다.
- 정리하면 HTTPS는 **내용(무엇을 주고받았나)은 가리지만, 메타데이터(어디에 접속하나)는 일부 남긴다.**
  와이어에 남는 평문 단서는 사실상 SNI(접속 도메인)와 목적지 IP/포트 정도다.

> TLS 1.3 포인트: TLS 1.2에서는 서버 인증서(CN 등)가 핸드셰이크 중 **평문**으로 오갔다.
> TLS 1.3은 인증서까지 암호화하므로 그 경로의 노출이 사라졌다. 그래서 이 랩에서도 인증서 CN은
> 캡처에서 안 보이고, 남는 평문 식별자는 SNI다. (SNI까지 가리려면 ECH(Encrypted Client Hello)가 필요하다.)

## 한눈 정리

| 와이어에서 보이는가? | HTTP | HTTPS (TLS 1.3) |
|---|---|---|
| 요청줄 (`GET /`) | 보임 | 가려짐 |
| 응답 상태/본문 | 보임 | 가려짐 |
| 서버 인증서 내용 | (없음) | 가려짐 (1.2는 평문이었음) |
| 접속 도메인 (SNI) | 보임(Host 헤더) | **평문으로 남음** |
| 목적지 IP/포트 | 보임 | 보임 |

HTTPS는 "내용을 봉투에 넣어 봉인"하는 것에 가깝다. 봉투 안(본문)은 못 읽지만,
봉투에 적힌 수신처(SNI, 목적지 IP)는 배달을 위해 겉면에 남는다.
