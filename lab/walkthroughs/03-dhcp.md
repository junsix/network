# 시나리오 03 walkthrough: DHCP (주소 없는 호스트가 주소를 얻기까지, DORA)

> 랩 시나리오 `scenarios/03-dhcp.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/dhcp.mdx` (L1-04.5, Auto-config)
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 03-dhcp`

## 등장인물

| 역할 | 주소 | 비고 |
|---|---|---|
| server | `192.168.50.1` (고정) | dnsmasq DHCP 서버. 임대 풀 `.100~.150` |
| client | 없음 (`0.0.0.0`) | 일부러 IP를 안 줬다. DHCP로 받을 것 |
| 스위치 | `br0` | 리눅스 브리지 |

client는 인터페이스만 올라가 있고 IP가 없다. 주소가 없으니 유니캐스트도 못 하고, 서버가 어디 있는지도 모른다.
그래서 브로드캐스트로 시작하는 4단계(DORA)로 주소를 임대받는다.

## ① 시작 상태: client에 IP가 없다

```text
[2] client의 초기 상태 (IP 없음 확인)
      [client]$ ip -4 addr show eth0
      (IPv4 주소 출력 없음)
```

eth0은 UP이지만 `inet` 줄이 없다. 완전한 빈손 상태.

## ② DORA 4단계 (client 측 dhclient 로그)

```text
[5] client에서 DHCP 클라이언트 실행 (DORA 발생)
      [client]$ dhclient -v -1 eth0
      Listening on LPF/eth0/e6:d9:79:ab:cf:56
      DHCPDISCOVER on eth0 to 255.255.255.255 port 67 interval 3 (xid=0x679d8524)
      DHCPOFFER of 192.168.50.122 from 192.168.50.1
      DHCPREQUEST for 192.168.50.122 on eth0 to 255.255.255.255 port 67 (xid=0x24859d67)
      DHCPACK of 192.168.50.122 from 192.168.50.1 (xid=0x679d8524)
      bound to 192.168.50.122 -- renewal in 51 seconds.
```

DORA = **D**iscover, **O**ffer, **R**equest, **A**ck. 한 줄씩:

- **D: `DHCPDISCOVER ... to 255.255.255.255 port 67`**
  client가 "DHCP 서버 있나요? 주소 좀"이라고 외친다. 자기 주소가 없어 목적지를 모르니
  **브로드캐스트(255.255.255.255)**로, 서버 포트 **67**로 던진다. `xid`는 이 대화를 묶는 거래 번호.
- **O: `DHCPOFFER of 192.168.50.122 from 192.168.50.1`**
  서버가 "192.168.50.122 어때?"라고 후보 주소를 제안한다. 풀(.100~.150) 안에서 골랐다.
- **R: `DHCPREQUEST for 192.168.50.122`**
  client가 "그거 쓸게요"라고 정식 요청한다. (서버가 여럿일 수 있어, 어느 제안을 받을지 명시하는 단계)
  이것도 브로드캐스트라 선택받지 못한 다른 서버들도 "쟤는 .122 골랐구나" 알고 자기 제안을 회수한다.
- **A: `DHCPACK of 192.168.50.122`**
  서버가 "확정"을 찍는다. 이 시점에 주소가 정식으로 임대(lease)된다.
- **`bound to 192.168.50.122 -- renewal in 51 seconds`**
  임대 완료. 임대는 영구가 아니라 기한이 있고(여기선 2분 설정), 절반쯤 지나면 갱신(renewal)을 시도한다.

## ③ 같은 사건을 서버 쪽 로그로 (대칭 확인)

```text
[6] 캡처된 DORA 4단계
      [server] dnsmasq-dhcp: DHCPDISCOVER(eth0) e6:d9:79:ab:cf:56
      [server] dnsmasq-dhcp: DHCPOFFER(eth0) 192.168.50.122 e6:d9:79:ab:cf:56
      [server] dnsmasq-dhcp: DHCPREQUEST(eth0) 192.168.50.122 e6:d9:79:ab:cf:56
      [server] dnsmasq-dhcp: DHCPACK(eth0) 192.168.50.122 e6:d9:79:ab:cf:56
```

- 서버 로그에도 같은 4단계가 그대로 찍힌다. client의 **MAC `e6:d9:79:ab:cf:56`**이 식별자다.
  client는 아직 IP가 없으니, 서버는 IP가 아니라 MAC으로 "누구에게 줄지"를 구분한다.
- 로그 사이의 `requested options`(netmask, router, dns-server 등)는 client가 "주소 말고 이런
  설정값들도 같이 달라"고 요청한 목록이다. DHCP가 IP뿐 아니라 게이트웨이/DNS까지 한 번에 내려주는 이유.

## ④ 결과: 주소 + 게이트웨이가 채워졌다

```text
[7] client가 실제로 임대받은 주소 + 기본 게이트웨이
      [client]$ ip -4 addr show eth0
      inet 192.168.50.122/24 brd 192.168.50.255 scope global dynamic eth0
         valid_lft 119sec preferred_lft 119sec

      [client]$ ip route show
      default via 192.168.50.1 dev eth0
      192.168.50.0/24 dev eth0 proto kernel scope link src 192.168.50.122
```

- `inet 192.168.50.122/24 ... dynamic`: 빈손이던 eth0에 주소가 붙었다. `dynamic`은 DHCP로 받았다는 표시.
- `valid_lft 119sec`: 남은 임대 시간. 0이 되기 전에 갱신하지 못하면 주소를 잃는다.
- `default via 192.168.50.1`: 게이트웨이도 같이 설정됐다. 시나리오 03에서 준 `--dhcp-option=3`(router)이
  client의 default 라우트로 들어온 것. 주소만이 아니라 "어디로 나가면 되는지"까지 한 번에 받았다.

## 한눈 정리

| 단계 | 메시지 | 방향 | 한 줄 의미 |
|---|---|---|---|
| D | DHCPDISCOVER | client 브로드캐스트 | "서버 있나요?" |
| O | DHCPOFFER | server | "이 주소 어때?" |
| R | DHCPREQUEST | client 브로드캐스트 | "그거 쓸게요" |
| A | DHCPACK | server | "확정" |

빈손 호스트가 브로드캐스트 한 번으로 시작해, 주소와 게이트웨이와 DNS까지 임대받는다.
주소가 없어서 MAC으로 식별하고, 영구가 아니라 기한부(lease)라는 점이 DHCP의 성격이다.
