#!/usr/bin/env bash
# 시나리오 공통 헬퍼: 로깅, 네임스페이스/veth/브리지 토폴로지 빌더, 정리.
# 모든 시나리오는 이 파일을 source 한 뒤 토폴로지를 선언적으로 조립한다.

set -uo pipefail

# ----- 로깅 -----
c_reset=$'\033[0m'; c_dim=$'\033[2m'; c_cyan=$'\033[36m'
c_green=$'\033[32m'; c_yellow=$'\033[33m'; c_bold=$'\033[1m'

step()  { printf "\n${c_bold}${c_cyan}[%s]${c_reset} %s\n" "$1" "$2"; }
note()  { printf "${c_dim}      %s${c_reset}\n" "$*"; }
run()   { printf "${c_yellow}      $ %s${c_reset}\n" "$*"; eval "$@"; }
title() { printf "\n${c_bold}====== %s ======${c_reset}\n" "$*"; }

# ----- 정리 -----
# 시나리오에서 만든 네임스페이스/브리지를 추적해 EXIT 시 자동 제거.
_NS_LIST=(); _BR_LIST=(); _PIDS=()

cleanup() {
  for p in "${_PIDS[@]:-}"; do kill "$p" 2>/dev/null || true; done
  for ns in "${_NS_LIST[@]:-}"; do ip netns del "$ns" 2>/dev/null || true; done
  for br in "${_BR_LIST[@]:-}"; do ip link del "$br" 2>/dev/null || true; done
}
trap cleanup EXIT

# ----- 토폴로지 빌더 -----

# host <name> : 네임스페이스(= 가상 호스트) 하나 생성. lo 도 올린다.
host() {
  local ns="$1"
  ip netns add "$ns"
  ip netns exec "$ns" ip link set lo up
  _NS_LIST+=("$ns")
}

# bridge <name> : 루트 네임스페이스에 리눅스 브리지(= 가상 스위치) 생성.
bridge() {
  local br="$1"
  ip link add "$br" type bridge
  ip link set "$br" up
  _BR_LIST+=("$br")
}

# connect <ns> <ip/cidr> <bridge> [ns_ifname] [veth_host_name]
#   호스트 ns 를 브리지에 veth 로 연결하고 IP 를 부여한다.
#   단일 인터페이스 호스트는 ns_ifname 생략 시 eth0.
#   라우터처럼 인터페이스가 둘 이상이면 eth0/eth1 식으로 지정한다.
connect() {
  local ns="$1" cidr="$2" br="$3"
  local nsif="${4:-eth0}"
  local hostif="${5:-v-${ns}-${nsif}}"
  ip link add "$hostif" type veth peer name "$nsif" netns "$ns"
  ip link set "$hostif" master "$br"
  ip link set "$hostif" up
  ip netns exec "$ns" ip addr add "$cidr" dev "$nsif"
  ip netns exec "$ns" ip link set "$nsif" up
}

# router <ns> : ns 를 라우터로 만든다(IP 포워딩 on).
router() {
  ip netns exec "$1" sysctl -q -w net.ipv4.ip_forward=1
}

# gw <ns> <ip>  : 호스트의 기본 게이트웨이 설정.
gw() { ip netns exec "$1" ip route add default via "$2"; }

# x <ns> <cmd...> : 특정 호스트(ns) 안에서 명령 실행 + 명령줄을 화면에 표시.
x() {
  local ns="$1"; shift
  printf "${c_yellow}      [%s]$ %s${c_reset}\n" "$ns" "$*"
  ip netns exec "$ns" "$@"
}

# sniff <ns_or_root> <iface> <filter> : tcpdump 를 백그라운드로 켜고 PID 추적.
#   ns 가 "root" 면 루트 네임스페이스(브리지가 사는 곳)에서 캡처.
sniff() {
  local where="$1" iface="$2"; shift 2
  local filter="$*"
  if [[ "$where" == "root" ]]; then
    tcpdump -l -n -i "$iface" $filter >/tmp/sniff.$$ 2>/dev/null &
  else
    ip netns exec "$where" tcpdump -l -n -i "$iface" $filter >/tmp/sniff.$$ 2>/dev/null &
  fi
  _PIDS+=($!)
  sleep 0.5   # 캡처 워밍업
}
