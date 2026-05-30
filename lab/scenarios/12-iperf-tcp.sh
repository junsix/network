#!/usr/bin/env bash
# 시나리오 12: iperf3로 보는 TCP 처리량 / 대역폭 제한 / 손실과 재전송
# 교재 매핑: next/content/tcp-udp.mdx  (L4, TCP 흐름/혼잡)
#
# 무엇을 보는가:
#   같은 경로에서 조건만 바꿔 TCP 처리량(Mbits/sec)과 재전송(Retr)이 어떻게 변하는지 본다.
#     1) 기준선        : veth 직결, 매우 빠르고 재전송 0
#     2) 대역폭 제한    : tc tbf 로 상한을 걸면 처리량이 그 천장에 맞춰진다
#     3) 손실 주입      : tc netem 으로 패킷을 떨구면 재전송이 늘고 처리량이 무너진다
#   "TCP는 손실을 재전송으로 메우지만 그 대가로 속도를 잃는다"를 숫자로 확인한다.

source /lab/lib/common.sh

# iperf3 한 번 돌리고 요약(sender/receiver) 줄만 보여주는 헬퍼.
runperf() {  # runperf <라벨>
  ip netns exec client iperf3 -c 10.60.0.1 -t 3 >/tmp/iperf.out 2>&1
  grep -E 'sender|receiver' /tmp/iperf.out | sed 's/^/      /' || sed 's/^/      /' /tmp/iperf.out
}

title "iperf3: TCP 처리량과 재전송을 조건별로 비교"

step 1 "토폴로지: client --- (br0) --- server, server에서 iperf3 -s 대기"
bridge br0
host server
host client
connect server 10.60.0.1/24 br0
connect client 10.60.0.2/24 br0
ip netns exec server iperf3 -s >/tmp/iperfs.log 2>&1 &
_PIDS+=($!)
sleep 0.5
note "iperf3 요약 줄의 끝 컬럼 'Retr'가 재전송 횟수다. 이 값과 Mbits/sec를 같이 본다."

step 2 "[기준선] 아무 제약 없음 (veth 직결)"
runperf 기준선
note "veth 직결이라 수 Gbit/s, 재전송(Retr)=0. 손실이 없으니 TCP가 전속력으로 보낸다."

step 3 "[대역폭 제한] client 송신측에 tbf 20mbit 상한"
x client tc qdisc add dev eth0 root tbf rate 20mbit burst 32kbit latency 400ms
x client tc qdisc show dev eth0
runperf 20mbit제한
note "처리량이 ~20Mbit/s 천장에 맞춰진다. 대역폭은 '관'의 굵기다."

step 4 "[손실 주입] 제한을 netem(지연 20ms + 손실 5%)으로 교체"
x client tc qdisc replace dev eth0 root netem delay 20ms loss 5%
x client tc qdisc show dev eth0
runperf 손실5%
note "재전송(Retr)이 크게 늘고 처리량이 무너진다. 떨어진 패킷을 TCP가 다시 보내느라(신뢰성) 속도를 내준다."

step 5 "정리: 제약을 풀고 마무리"
x client tc qdisc del dev eth0 root || true
note "기준선 -> 대역폭 제한 -> 손실, 세 줄의 Mbits/sec와 Retr를 비교하면 TCP가 환경에 어떻게 반응하는지 보인다."

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 대역폭(관의 굵기)과 손실(재전송 유발)이 TCP 처리량을 어떻게 가르는지 iperf3로 확인했다.\n"
