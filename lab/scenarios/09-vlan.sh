#!/usr/bin/env bash
# 시나리오 09: VLAN (802.1Q 태그로 L2를 가르기)
# 교재 매핑: next/content/ethernet.mdx  (L2 / VLAN)
#
# 무엇을 보는가:
#   하나의 물리 선로(여기선 브리지)를 공유해도, 프레임의 VLAN 태그(802.1Q)가 다르면
#   서로 못 듣는다. 결정적으로, IP 서브넷이 같아도 VLAN이 다르면 통신이 안 된다.
#   = "L2를 가르는 건 서브넷이 아니라 VLAN 태그"임을 같은 토폴로지에서 확인한다.

source /lab/lib/common.sh

# 트렁크 veth 한 가닥을 ns 와 br0 사이에 놓는다(ns 안쪽 이름은 trunk).
mktrunk() {  # mktrunk <ns> <bridge쪽-ifname>
  local ns="$1" hif="$2"
  ip link add "$hif" type veth peer name trunk netns "$ns"
  ip link set "$hif" master br0
  ip link set "$hif" up
  ip netns exec "$ns" ip link set trunk up
}
# trunk 위에 VLAN 서브인터페이스를 올리고 IP 부여.
addvlan() {  # addvlan <ns> <vlan-id> <cidr>
  local ns="$1" vid="$2" cidr="$3"
  ip netns exec "$ns" ip link add link trunk name "trunk.$vid" type vlan id "$vid"
  ip netns exec "$ns" ip addr add "$cidr" dev "trunk.$vid"
  ip netns exec "$ns" ip link set "trunk.$vid" up
}

title "VLAN(802.1Q): 한 선로를 태그로 가르다"

step 1 "토폴로지: A,B,C가 같은 브리지(br0)를 공유. A·B=VLAN10, C=VLAN20"
bridge br0
host hostA; mktrunk hostA vA; addvlan hostA 10 192.168.10.1/24
host hostB; mktrunk hostB vB; addvlan hostB 10 192.168.10.2/24
host hostC; mktrunk hostC vC; addvlan hostC 20 192.168.10.3/24
note "주의: 셋 다 같은 IP 서브넷 192.168.10.0/24 다. A=.1(VLAN10), B=.2(VLAN10), C=.3(VLAN20)."

step 2 "각 호스트의 VLAN 서브인터페이스 확인"
x hostA ip -br addr show trunk.10
x hostC ip -br addr show trunk.20

step 3 "br0에서 캡처 시작 (-e: 이더넷 헤더의 802.1Q 태그가 보이도록)"
tcpdump -l -n -e -i br0 'vlan' >/tmp/sniff.$$ 2>/dev/null &
_PIDS+=($!)
sleep 0.5

step 4 "[같은 VLAN] A(VLAN10) -> B(VLAN10) ping (성공해야 정상)"
x hostA ping -c 2 -W 1 192.168.10.2
sleep 1
note "캡처에서 이 트래픽은 'vlan 10' 태그를 달고 다닌다:"
grep -m3 'vlan 10' /tmp/sniff.$$ | sed 's/^/      /' || true

step 5 "[다른 VLAN·같은 서브넷] A(VLAN10) -> C(VLAN20, 192.168.10.3) ping (실패해야 정상)"
x hostA ping -c 2 -W 1 192.168.10.3 || true
sleep 1
note "A는 같은 서브넷이라 ARP를 던지지만, 그 프레임은 'vlan 10' 태그라 VLAN20인 C는 못 듣는다:"
grep -m3 -E 'vlan 10, .*(ARP|Request who-has 192.168.10.3)' /tmp/sniff.$$ | sed 's/^/      /' || true
note "C(VLAN20)에서는 이 ARP가 보이지 않으므로 응답이 없다 -> 같은 서브넷인데도 도달 불가."

step 6 "정리: 캡처된 VLAN 태그 집계"
note "vlan 10 프레임: $(grep -c 'vlan 10' /tmp/sniff.$$ 2>/dev/null) / vlan 20 프레임: $(grep -c 'vlan 20' /tmp/sniff.$$ 2>/dev/null)"

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 같은 선로·같은 서브넷이라도 VLAN 태그가 다르면 L2에서 격리됨을 802.1Q 태그로 확인했다.\n"
