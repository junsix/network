#!/usr/bin/env bash
# 시나리오 03: DHCP (처음 IP를 받는 법, DORA)
# 교재 매핑: next/content/dhcp.mdx  (L1 04.5 · Auto-config)
#
# 무엇을 보는가:
#   주소가 아예 없는 호스트가 브로드캐스트로 Discover를 던지고,
#   서버가 Offer -> 클라이언트 Request -> 서버 Ack 의 4단계(DORA)로
#   주소/게이트웨이/DNS를 임대(lease)받는 과정을 패킷으로 본다.

source /lab/lib/common.sh

title "DHCP: 주소 없는 호스트가 주소를 얻기까지 (DORA)"

step 1 "토폴로지: dnsmasq DHCP 서버 + 빈손 클라이언트, 스위치(br0)로 연결"
bridge br0
host server
host client
connect server 192.168.50.1/24 br0
# client는 일부러 IP를 주지 않는다(eth0만 올림). DHCP로 받을 것이므로.
ip link add v-client type veth peer name eth0 netns client
ip link set v-client master br0
ip link set v-client up
x client ip link set eth0 up
note "server = 192.168.50.1 고정, client = 주소 없음(0.0.0.0)"

step 2 "client의 초기 상태 (IP 없음 확인)"
x client ip -4 addr show eth0

step 3 "server에서 dnsmasq를 DHCP 전용으로 기동 (풀: .100-.150)"
ip netns exec server dnsmasq \
  --interface=eth0 --bind-interfaces \
  --dhcp-range=192.168.50.100,192.168.50.150,255.255.255.0,2m \
  --dhcp-option=3,192.168.50.1 \
  --dhcp-authoritative --no-daemon --log-dhcp >/tmp/dnsmasq.$$ 2>&1 &
_PIDS+=($!)
sleep 1
note "임대 범위 192.168.50.100~150, 게이트웨이 옵션(3)=192.168.50.1"

step 4 "br0에서 DHCP(bootp) 패킷 캡처 시작"
sniff root br0 'udp port 67 or udp port 68'

step 5 "client에서 DHCP 클라이언트 실행 (DORA 발생)"
x client dhclient -v -1 eth0 2>&1 | sed 's/^/      /' || true
sleep 1

step 6 "캡처된 DORA 4단계 (Discover/Offer/Request/ACK)"
grep -Ei 'discover|offer|request|ack' /tmp/dnsmasq.$$ | sed 's/^/      [server] /' || true

step 7 "client가 실제로 임대받은 주소 + 기본 게이트웨이"
x client ip -4 addr show eth0
x client ip route show

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 빈손 호스트가 DORA로 주소/게이트웨이를 임대받는 과정을 확인했다.\n"
