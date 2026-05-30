#!/usr/bin/env bash
# 시나리오 02: IP 라우팅 (서로 다른 서브넷을 라우터가 잇는다)
# 교재 매핑: next/content/ip-routing.mdx  (L1 03 · L3)
#
# 무엇을 보는가:
#   서브넷이 다르면 ARP로 직접 못 찾는다. 패킷은 기본 게이트웨이(라우터)로 가고,
#   라우터가 자기 라우팅 테이블을 보고 다음 홉으로 포워딩한다.
#   TTL이 라우터를 지날 때마다 1씩 줄어드는 것까지 확인한다.

source /lab/lib/common.sh

title "IP 라우팅: 서브넷의 경계를 넘는 법"

step 1 "토폴로지: A(10.0.0.0/24) --- R(라우터) --- B(10.0.1.0/24)"
bridge br0
bridge br1
host hostA
host hostB
host R
connect hostA 10.0.0.10/24 br0
connect hostB 10.0.1.10/24 br1
connect R     10.0.0.1/24  br0 eth0
connect R     10.0.1.1/24  br1 eth1
router R
note "A와 B는 서로 다른 /24. 직접은 못 닿는다."

step 2 "각 호스트의 기본 게이트웨이를 라우터로 지정"
gw hostA 10.0.0.1
gw hostB 10.0.1.1
x hostA ip route show
x hostB ip route show

step 3 "게이트웨이 없이 보면? (대조군: 라우트 추가 전 다른 서브넷)"
note "위 기본 라우트가 있어야 다른 서브넷으로 나갈 수 있다. 없으면 'Network is unreachable'."

step 4 "hostA(10.0.0.10) -> hostB(10.0.1.10) ping"
x hostA ping -c 2 -W 1 10.0.1.10

step 5 "traceroute로 경로상의 홉(라우터) 확인"
x hostA traceroute -n -q1 -w1 10.0.1.10

step 6 "라우터의 포워딩 상태 + 라우팅 테이블"
x R sysctl net.ipv4.ip_forward
x R ip route show

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 라우터가 두 서브넷 사이에서 패킷을 어떻게 중계하는지 확인했다.\n"
