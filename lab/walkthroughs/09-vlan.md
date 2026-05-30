# 시나리오 09 walkthrough: VLAN (802.1Q 태그로 L2를 가르기)

> 랩 시나리오 `scenarios/09-vlan.sh`를 실제로 돌려 캡처한 결과를 한 줄씩 해설한다.
> 교재 매핑: `next/content/ethernet.mdx` (L2 / VLAN)
>
> 재현: `cd lab && LAB_STEP=1 ./labctl run 09-vlan`

## 등장인물

```
hostA(VLAN10) --\
hostB(VLAN10) ---+--- br0 (덤 스위치: 태그 프레임을 그대로 중계) 
hostC(VLAN20) --/
```

| 호스트 | VLAN | IP | 비고 |
|---|---|---|---|
| hostA | 10 | `192.168.10.1/24` | trunk.10 서브인터페이스 |
| hostB | 10 | `192.168.10.2/24` | trunk.10 |
| hostC | 20 | `192.168.10.3/24` | trunk.20 |

핵심 트릭: **셋 다 같은 IP 서브넷 `192.168.10.0/24`** 에 있다. 그런데 hostC만 VLAN 20이다.
"서브넷이 같으면 통하는가, 아니면 VLAN이 가르는가"를 직접 가른다.

각 호스트는 트렁크 veth 한 가닥을 평범한 브리지 `br0`에 물리고, 그 위에 VLAN 서브인터페이스
(`trunk.10` / `trunk.20`)를 올렸다. br0는 VLAN 필터링을 안 하는 보통 브리지라, 태그 붙은 프레임을
내용 그대로 중계만 한다. 태깅/필터링은 양 끝 호스트의 서브인터페이스가 한다.

```text
[hostA]$ ip -br addr show trunk.10
trunk.10@trunk   UP   192.168.10.1/24 ...
[hostC]$ ip -br addr show trunk.20
trunk.20@trunk   UP   192.168.10.3/24 ...
```

`trunk.10@trunk`은 "trunk 위에 얹힌 VLAN10 서브인터페이스"라는 표기다.

## ① 같은 VLAN: 통한다 (vlan 10 태그가 보인다)

```text
[hostA]$ ping -c 2 -W 1 192.168.10.2
64 bytes from 192.168.10.2: icmp_seq=1 ttl=64 time=0.092 ms
2 packets transmitted, 2 received, 0% packet loss

      ... > ff:ff:ff:ff:ff:ff, ethertype 802.1Q, vlan 10, ARP, Request who-has 192.168.10.2 tell 192.168.10.1
      ... > 7a:92:..,          ethertype 802.1Q, vlan 10, ARP, Reply 192.168.10.2 is-at ae:75:...
```

- A가 B를 부르며 보낸 ARP 프레임에 **`ethertype 802.1Q ... vlan 10`** 이 붙어 있다. 이게 VLAN 태그다.
  이더넷 헤더와 페이로드 사이에 4바이트 태그가 끼어들어 "이 프레임은 VLAN 10 소속"임을 표시한다.
- B도 같은 VLAN 10이라 이 태그 프레임을 받아 `Reply ... is-at`으로 답한다. 그래서 핑이 성공한다.
- `ttl=64`: 라우터를 안 거친 L2 직통(같은 브로드캐스트 도메인)이라는 신호.

## ② 다른 VLAN, 같은 서브넷: 안 통한다

```text
[hostA]$ ping -c 2 -W 1 192.168.10.3
2 packets transmitted, 0 received, 100% packet loss

      ... > ff:ff:ff:ff:ff:ff, ethertype 802.1Q, vlan 10, ARP, Request who-has 192.168.10.3 tell 192.168.10.1
      (이 who-has 에 대한 Reply 없음)
```

- C(`192.168.10.3`)는 A와 **같은 서브넷**이다. 그래서 A는 라우터로 보내지 않고 직접 ARP를 던진다.
  `who-has 192.168.10.3` 프레임이 나간다.
- 그런데 그 프레임은 **`vlan 10`** 태그가 붙어 있다. C의 인터페이스는 `trunk.20`(VLAN 20)이라
  VLAN 10 태그 프레임을 **자기 것으로 받지 않는다.** 그래서 who-has에 아무도 답하지 않는다.
- ARP 실패 -> 보낼 MAC을 못 구함 -> 핑 100% 손실. **서브넷이 같아도 VLAN이 다르면 L2에서 막힌다.**

## ③ 집계: 두 VLAN이 같은 선로를 공유하지만 섞이지 않는다

```text
[6] 정리: 캡처된 VLAN 태그 집계
      vlan 10 프레임: 19 / vlan 20 프레임: 6
```

- 같은 br0 위에 `vlan 10` 프레임과 `vlan 20` 프레임이 **둘 다 흐른다**(19개, 6개).
  vlan 20은 hostC가 인터페이스를 올리며 낸 자기 트래픽이다.
- 물리적으로는 한 선로를 공유하지만, 태그로 나뉘어 서로의 트래픽을 받지 않는다.
  이것이 VLAN의 정의다: **하나의 물리 네트워크를 여러 개의 독립된 브로드캐스트 도메인으로 가르기.**

## 한눈 정리

| 통신 | 출발 VLAN | 목적 VLAN | 같은 서브넷? | 결과 |
|---|---|---|---|---|
| A -> B | 10 | 10 | 예 | 성공 |
| A -> C | 10 | 20 | **예** | **실패** |

L3에서 서브넷이 네트워크를 가른다면, L2에서는 VLAN 태그가 가른다. 둘은 별개의 축이다.
같은 케이블(브리지)에 꽂혀 있고 IP 서브넷마저 같아도, VLAN이 다르면 프레임이 서로에게 닿지 않는다.
스위치가 포트마다 VLAN을 배정해 부서/용도를 격리하는 것이 바로 이 원리다.
