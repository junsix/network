#!/usr/bin/env bash
# demo.sh: 시나리오를 차례로 돌리며 구경하기 좋게 보여주는 러너.
#   ./demo.sh            전체(01~05) 순차 실행
#   ./demo.sh 01 03      지정한 것만
#
# 각 시나리오 사이에 잠깐 멈춰 헤더를 띄운다. tmux 새 창에서 띄워두고 보기 좋다.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

b=$'\033[1m'; cy=$'\033[36m'; gr=$'\033[32m'; rs=$'\033[0m'

if [[ $# -gt 0 ]]; then
  targets=("$@")
else
  targets=(01-arp 02-ip-routing 03-dhcp 04-dns 05-tcp-udp 06-http-tls 07-icmp)
fi

clear
printf "%s%s네트워킹 핸즈온 랩 데모%s  (%d개 시나리오)\n" "$b" "$cy" "$rs" "${#targets[@]}"
printf "%s각 시나리오는 격리된 privileged 컨테이너에서 실행됩니다.%s\n" "$cy" "$rs"
sleep 2

i=0
for s in "${targets[@]}"; do
  i=$((i+1))
  printf "\n%s>>> [%d/%d] %s 시작 <<<%s\n" "$b$gr" "$i" "${#targets[@]}" "$s" "$rs"
  sleep 1.5
  ./labctl run "$s"
  printf "\n%s(다음 시나리오까지 3초...)%s\n" "$cy" "$rs"
  sleep 3
done

printf "\n%s%s모든 시나리오 완료.%s 이 창에서 ./labctl run <이름>으로 개별 재실행 가능.\n" "$b" "$gr" "$rs"
