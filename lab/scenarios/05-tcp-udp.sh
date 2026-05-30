#!/usr/bin/env bash
# 시나리오 05: TCP 3-way handshake vs UDP
# 교재 매핑: next/content/tcp-udp.mdx  (L1 04 · L4)
#
# 무엇을 보는가:
#   TCP는 데이터 전에 SYN -> SYN/ACK -> ACK 로 연결을 세운다(핸드셰이크).
#   UDP는 그런 절차 없이 그냥 보낸다. 둘을 같은 토폴로지에서 캡처해 비교한다.

source /lab/lib/common.sh

title "TCP 핸드셰이크 vs UDP: 연결을 세우는 쪽과 안 세우는 쪽"

step 1 "토폴로지: client --- (br0) --- server"
bridge br0
host server
host client
connect server 172.16.0.1/24 br0
connect client 172.16.0.2/24 br0

step 2 "br0에서 9000번 포트 트래픽 캡처 시작 (TCP 플래그가 보이도록)"
sniff root br0 'port 9000'

step 3 "[TCP] server에서 리슨, client가 접속 후 한 줄 전송"
ip netns exec server nc -l -p 9000 >/tmp/tcp_recv.$$ 2>/dev/null &
_PIDS+=($!)
sleep 0.5
x client bash -c 'echo "hello-over-tcp" | nc -w1 172.16.0.1 9000'
sleep 1
note "server 수신 내용: $(cat /tmp/tcp_recv.$$ 2>/dev/null)"

step 4 "캡처에서 TCP 핸드셰이크 확인 (S / S. / .)"
grep -E 'Flags \[S' /tmp/sniff.$$ 2>/dev/null | sed 's/^/      /' || true
note "[S]=SYN, [S.]=SYN+ACK, [.]=ACK  -> 데이터 전에 3번 오간다"

step 5 "[UDP] 같은 포트로 UDP 한 방 (핸드셰이크 없음)"
ip netns exec server nc -u -l -p 9000 >/tmp/udp_recv.$$ 2>/dev/null &
_PIDS+=($!)
sleep 0.5
x client bash -c 'echo "hello-over-udp" | nc -u -w1 172.16.0.1 9000'
sleep 1
note "server 수신 내용: $(cat /tmp/udp_recv.$$ 2>/dev/null)"

step 6 "전체 캡처 비교 (TCP 다수 vs UDP 단발)"
cat /tmp/sniff.$$ 2>/dev/null | sed 's/^/      /'

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} TCP의 연결 수립과 UDP의 무연결 전송 차이를 패킷으로 확인했다.\n"
