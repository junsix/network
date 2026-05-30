#!/usr/bin/env bash
# 시나리오 10: 방화벽 (iptables filter 테이블, DROP vs REJECT)
# 교재 매핑: next/content/security.mdx  (L3/L4 필터링)
#
# 무엇을 보는가:
#   같은 "막기"라도 방식이 둘이다.
#     DROP   = 패킷을 조용히 버린다 -> 보낸 쪽은 아무 답도 못 받고 타임아웃.
#     REJECT = 명시적으로 거절을 돌려준다 -> 보낸 쪽은 즉시 "거부됨"을 안다.
#   같은 포트를 두 방식으로 막아 클라이언트가 겪는 차이를 직접 비교한다.

source /lab/lib/common.sh

title "방화벽(iptables): 조용히 버리기(DROP) vs 명시적 거절(REJECT)"

step 1 "토폴로지: client --- (br0) --- server, server는 8080 TCP 서비스 운영"
bridge br0
host server
host client
connect server 10.40.0.1/24 br0
connect client 10.40.0.2/24 br0
# 8080에서 접속을 받아 'ok'를 주고 끊는 서비스(여러 번 받도록 루프)
ip netns exec server bash -c 'while true; do printf "ok\n" | nc -N -l -p 8080; done' >/dev/null 2>&1 &
_PIDS+=($!)
sleep 0.5
note "server=10.40.0.1:8080, client=10.40.0.2. 방화벽 기본 정책은 ACCEPT(다 허용)."

step 2 "[기준선] 방화벽 규칙 없음 -> client 접속 성공"
x client nc -z -v -w 2 10.40.0.1 8080 || true

step 3 "[DROP] server에서 8080 인입 패킷을 '조용히' 폐기"
x server iptables -A INPUT -p tcp --dport 8080 -j DROP
x server iptables -L INPUT -n -v --line-numbers

step 4 "client 재접속 -> 응답이 아예 없어 타임아웃(약 2초 대기 후 실패)"
x client nc -z -v -w 2 10.40.0.1 8080 || true
note "SYN을 보내도 무응답. 포트가 닫힌 건지 막힌 건지 호스트가 살아있는지조차 알 수 없다. 이것이 DROP."

step 5 "[REJECT] DROP을 빼고 REJECT(tcp-reset)로 교체 -> 명시적 거절"
x server iptables -D INPUT -p tcp --dport 8080 -j DROP
x server iptables -A INPUT -p tcp --dport 8080 -j REJECT --reject-with tcp-reset

step 6 "client 재접속 -> 즉시 'Connection refused'"
x client nc -z -v -w 2 10.40.0.1 8080 || true
note "이번엔 기다림 없이 즉시 거절(RST)을 받는다. DROP(무응답·타임아웃)과 REJECT(즉시 거절)의 체감 차이가 방화벽 설계의 핵심이다."

step 7 "REJECT 규칙이 실제로 패킷을 처리했는지 (카운터)"
x server iptables -L INPUT -n -v --line-numbers

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 같은 차단도 DROP(조용히 버림)과 REJECT(명시적 거절)의 결과가 다름을 클라이언트 체감으로 확인했다.\n"
