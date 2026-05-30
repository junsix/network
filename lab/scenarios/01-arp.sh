#!/usr/bin/env bash
# 시나리오 01: ARP (IP -> MAC 주소 해석)
# 교재 매핑: next/content/arp.mdx  (L1 02 · L2)
#
# 무엇을 보는가:
#   같은 서브넷의 두 호스트가 처음 통신할 때, 송신자는 상대의 MAC 을 모른다.
#   브로드캐스트로 "who-has 10.0.0.2?" 를 던지고, 당사자만 unicast 로 답한다.
#   그 결과가 neighbor 캐시(ip neigh)에 채워지는 과정을 직접 관찰한다.

source /lab/lib/common.sh

title "ARP: IP를 MAC으로 바꾸는 순간"

step 1 "토폴로지 구성: 스위치(br0) 하나에 호스트 A, B 연결"
bridge br0
host hostA
host hostB
connect hostA 10.0.0.1/24 br0
connect hostB 10.0.0.2/24 br0
note "hostA = 10.0.0.1, hostB = 10.0.0.2, 같은 /24 서브넷"

step 2 "통신 전 hostA의 ARP 캐시 (비어 있어야 정상)"
x hostA ip neigh show
note "10.0.0.2의 MAC을 아직 모른다. 보내려면 먼저 물어봐야 한다."

step 3 "br0(스위치)에서 ARP 프레임 캡처 시작"
sniff root br0 arp

step 4 "hostA -> hostB 로 ping (이때 ARP가 먼저 일어난다)"
x hostA ping -c 2 -W 1 10.0.0.2
sleep 1

step 5 "캡처된 ARP 교환 (who-has / is-at)"
cat /tmp/sniff.$$ 2>/dev/null | sed 's/^/      /'
note "Request는 브로드캐스트(ff:ff:ff:ff:ff:ff), Reply는 당사자만 unicast로 응답"

step 6 "통신 후 hostA의 ARP 캐시 (이제 채워짐)"
x hostA ip neigh show
note "REACHABLE/STALE 상태로 10.0.0.2 -> MAC 매핑이 학습되었다."

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} ARP가 어떻게 L3 주소를 L2 주소로 연결하는지 확인했다.\n"
