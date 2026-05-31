#!/usr/bin/env bash
# 시나리오 14: 소켓 (ss로 보는 LISTEN / ESTABLISHED / TIME_WAIT, 4-tuple)
# 교재 매핑: next/content/tcp-udp.mdx (소켓 상태/TIME_WAIT), advanced/numbers.mdx (소켓·FD)
#
# 무엇을 보는가:
#   소켓은 (프로토콜, 로컬IP:포트, 원격IP:포트) 4-tuple로 연결을 식별한다.
#   그래서 listening 포트 하나가 수많은 연결을 동시에 받아낸다(각각 별개 ESTABLISHED 소켓).
#   연결을 닫으면 먼저 닫은 쪽에 TIME_WAIT 소켓이 잠시 남는다(시나리오 05의 FIN 교환과 연결).

source /lab/lib/common.sh

title "소켓: 포트 하나가 수많은 연결을 받는 법 (ss로 상태 관찰)"

step 1 "토폴로지: client --- (br0) --- server, server에서 iperf3 -s 대기"
bridge br0
host server
host client
connect server 10.80.0.1/24 br0
connect client 10.80.0.2/24 br0
ip netns exec server iperf3 -s >/tmp/iperfs.log 2>&1 &
_PIDS+=($!)
sleep 0.5

step 2 "연결 전: server에는 LISTEN 소켓 하나뿐"
x server ss -tlnp
note "LISTEN(:5201) = '연결을 받을 귀'. 아직 연결은 없다. 이 소켓은 로컬 포트만 정해져 있고 상대가 없다."

step 3 "client가 4개 병렬 연결 개시 (iperf3 -P 4)"
ip netns exec client iperf3 -c 10.80.0.1 -P 4 -t 4 >/tmp/iperfc.log 2>&1 &
_PIDS+=($!)
sleep 2
note "이제 같은 listening 포트(5201)에 여러 연결이 동시에 붙어 있다."

step 4 "server에서 본 소켓들: Local은 전부 :5201, Peer 포트만 제각각"
x server bash -c "ss -tan | grep 5201"
note "Local이 모두 10.80.0.1:5201로 같은데도 별개 소켓이다. 구분 기준은 4-tuple(로컬IP:포트 + 원격IP:포트). 원격 포트가 다르니 다른 소켓이다. -> 포트 하나가 많은 연결을 받는 원리."

step 5 "같은 연결들을 client에서 보면: 로컬 포트는 제각각 -> :5201"
x client bash -c "ss -tan | grep 5201"
note "client 쪽은 매 연결마다 임시 포트(ephemeral)를 하나씩 써서 같은 server:5201로 향한다."

step 6 "한 포트에 몇 개나 붙었나 (ESTABLISHED 집계)"
note "server :5201 ESTABLISHED 소켓 수 = $(ip netns exec server bash -c "ss -tan state established | grep -c ':5201'")"

step 7 "연결 종료 후: 먼저 닫은 쪽에 TIME_WAIT 소켓이 잠시 남는다"
sleep 3   # iperf3(-t 4) 종료 대기
note "server쪽 TIME_WAIT: $(ip netns exec server bash -c 'ss -tan state time-wait | grep -c :5201')  /  client쪽 TIME_WAIT: $(ip netns exec client bash -c 'ss -tan state time-wait | grep -c :5201')"
x client bash -c "ss -tan state time-wait | grep 5201 | head -4" || true
note "능동적으로 먼저 close한 쪽이 TIME_WAIT로 2MSL 동안 대기한다(늦게 도착한 패킷이 다음 연결을 오염시키지 않도록). 교재 tcp-udp의 'TIME_WAIT 폭증->포트 고갈'이 바로 이 소켓 얘기다."

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 소켓은 4-tuple로 구분되며, 포트 하나가 많은 연결을 받고, 종료 시 TIME_WAIT이 남음을 ss로 확인했다.\n"
