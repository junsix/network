#!/usr/bin/env bash
# 시나리오 08: NAT (MASQUERADE / 출발지 주소 변환)
# 교재 매핑: next/content/advanced/inbound-outbound.mdx  (NAT/SNAT)
#
# 무엇을 보는가:
#   사설망 호스트가 공인망으로 나갈 때, 경계 라우터가 출발지 IP를 자기 공인 IP로 바꾼다(SNAT).
#   왜 필요한가: 안 바꾸면 공인망 상대는 사설 IP로 되돌아올 경로가 없어 응답이 못 온다.
#   무엇을 하는가: 같은 핑을 안쪽(br0)/바깥쪽(br1)에서 동시에 떠서 출발지 IP가 바뀌는 걸 대조한다.

source /lab/lib/common.sh

title "NAT(MASQUERADE): 사설 IP가 공인 IP로 둔갑하는 순간"

step 1 "토폴로지: inside(사설) --- R(NAT 경계) --- server(공인망 흉내)"
bridge br0
bridge br1
host inside
host server
host R
connect inside 192.168.100.10/24 br0
connect server 203.0.113.9/24   br1
connect R      192.168.100.1/24 br0 eth0
connect R      203.0.113.1/24   br1 eth1
router R
gw inside 192.168.100.1
note "inside=사설 192.168.100/24, server=공인망 흉내 203.0.113/24(문서용 TEST-NET). server엔 일부러 사설망 경로를 안 준다."

step 2 "[NAT 켜기 전] inside -> server ping (server는 사설 IP로 되돌아갈 길이 없다)"
x inside ping -c 1 -W 1 203.0.113.9 || true
note "echo request는 server까지 가지만, server가 192.168.100.10으로 답하려 해도 그 경로가 없다 -> 응답 실패. 실제 인터넷에서 공인 호스트가 내 사설 IP로 못 오는 것과 같다."

step 3 "R에 MASQUERADE 규칙 추가 (eth1로 나가는 패킷의 출발지를 R의 공인 IP로 치환)"
x R iptables -t nat -A POSTROUTING -o eth1 -j MASQUERADE
x R iptables -t nat -L POSTROUTING -n -v

step 4 "두 구간 동시 캡처 시작 (안쪽 br0 / 바깥쪽 br1)"
tcpdump -l -n -i br0 icmp >/tmp/inside.$$ 2>/dev/null &
_PIDS+=($!)
tcpdump -l -n -i br1 icmp >/tmp/outside.$$ 2>/dev/null &
_PIDS+=($!)
sleep 0.5

step 5 "[NAT 켠 후] inside -> server ping (이번엔 성공)"
x inside ping -c 2 -W 1 203.0.113.9
sleep 1

step 6 "같은 핑을 두 구간에서 비교: 출발지 IP가 경계에서 바뀐다"
note "안쪽(br0)에서 본 출발지 -> 사설 IP 그대로:"
grep -m1 'echo request' /tmp/inside.$$ | sed 's/^/      /' || true
note "바깥쪽(br1)에서 본 출발지 -> R의 공인 IP(203.0.113.1)로 둔갑:"
grep -m1 'echo request' /tmp/outside.$$ | sed 's/^/      /' || true

step 7 "R의 NAT 규칙이 실제로 패킷을 처리했는지 (카운터 증가 확인)"
x R iptables -t nat -L POSTROUTING -n -v

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 경계 라우터가 출발지 사설 IP를 공인 IP로 바꿔(SNAT) 공인망 왕복을 가능하게 함을 패킷으로 확인했다.\n"
