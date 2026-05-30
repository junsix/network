#!/usr/bin/env bash
# 시나리오 07: ICMP (진단/오류 메시지)
# 교재 매핑: next/content/icmp.mdx  (L3 보조 프로토콜)
#
# 무엇을 보는가:
#   ICMP는 데이터를 나르는 프로토콜이 아니라 "상태와 오류를 알리는" 신호다.
#   대표 3종을 같은 토폴로지에서 일으켜 패킷으로 확인한다:
#     - echo request/reply (ping)
#     - time exceeded       (TTL 소진. traceroute가 홉을 찾는 원리)
#     - destination unreachable (닫힌 포트)
#   TTL 소진을 라우터에서 일으키려면 홉이 필요하므로 라우터를 둔다.

source /lab/lib/common.sh

title "ICMP: 네트워크가 상태와 오류를 알리는 법"

step 1 "토폴로지: A(10.30.0.0/24) --- R(라우터) --- B(10.30.1.0/24)"
bridge br0
bridge br1
host hostA
host hostB
host R
connect hostA 10.30.0.10/24 br0
connect hostB 10.30.1.10/24 br1
connect R     10.30.0.1/24  br0 eth0
connect R     10.30.1.1/24  br1 eth1
router R
gw hostA 10.30.0.1
gw hostB 10.30.1.1
note "A에서 B까지 라우터 R을 1홉 거친다."

step 2 "br0에서 ICMP 캡처 시작"
sniff root br0 icmp

step 3 "[Echo] A -> B 정상 ping (type 8 요청 / type 0 응답)"
x hostA ping -c 2 -W 1 10.30.1.10
sleep 1
grep -E 'ICMP echo (request|reply)' /tmp/sniff.$$ | sed 's/^/      /' || true
note "echo request(8)를 보내면 상대가 echo reply(0)로 답한다. ping의 본질이 이것이다."

step 4 "[Time Exceeded] TTL=1로 ping -> 라우터가 폐기하고 type 11 회신"
x hostA ping -c 1 -W 1 -t 1 10.30.1.10 || true
sleep 1
grep -E 'time exceeded' /tmp/sniff.$$ | sed 's/^/      /' || true
note "TTL이 0이 된 지점(여기선 라우터 R)이 time exceeded(11)를 돌려준다. traceroute가 TTL을 1,2,3.. 키우며 이걸로 홉을 찾는다."

step 5 "[Destination Unreachable] 닫힌 UDP 포트로 전송 -> type 3 회신"
x hostA bash -c 'echo x | nc -u -w1 10.30.1.10 9999' || true
sleep 1
grep -E 'unreachable' /tmp/sniff.$$ | sed 's/^/      /' || true
note "받는 호스트에 그 포트가 안 열려 있으면 port unreachable(3/3)로 알려준다. 응답 없음(timeout)과는 다르다."

step 6 "정리: 캡처된 ICMP 메시지 집계"
note "echo request: $(grep -c 'echo request' /tmp/sniff.$$ 2>/dev/null) / echo reply: $(grep -c 'echo reply' /tmp/sniff.$$ 2>/dev/null) / time exceeded: $(grep -c 'time exceeded' /tmp/sniff.$$ 2>/dev/null) / unreachable: $(grep -c 'unreachable' /tmp/sniff.$$ 2>/dev/null)"

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} ICMP는 데이터가 아니라 상태/오류를 나르는 신호임을 echo·time exceeded·unreachable로 확인했다.\n"
