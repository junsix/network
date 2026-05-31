#!/usr/bin/env bash
# 시나리오 15: 동시성 모델 (블로킹/워커 점유 vs 이벤트 기반)
# 교재 매핑: next/content/advanced/numbers.mdx (소켓<->스레드 비대칭, C10K)
#
# 무엇을 보는가:
#   소켓은 싸다(시나리오 14). 하지만 그 소켓을 '어떤 실행 단위로' 처리하느냐가 동시성을 가른다.
#   - 블로킹/워커 점유형(여기선 동시성 1짜리 nc): 느린 연결 하나가 워커를 붙잡으면
#     다른 정상 요청이 막힌다.
#   - 이벤트 기반(nginx): 느린 연결은 epoll의 항목 하나일 뿐, 다른 요청을 막지 않는다.
#   같은 '느린 클라이언트'를 양쪽에 붙여 차이를 잰다.

source /lab/lib/common.sh

# 정상 요청 한 번을 던지고 코드/소요시간만 보여주는 측정기.
probe() {  # probe <port>
  ip netns exec client bash -c \
    "curl -s -o /dev/null -w 'HTTP=%{http_code}  소요=%{time_total}s\n' --max-time 3 http://10.90.0.1:$1/"
}

title "동시성 모델: 워커 점유(블로킹) vs 이벤트 기반"

step 1 "토폴로지: client --- (br0) --- server (두 종류 서버를 동시 운영)"
bridge br0
host server
host client
connect server 10.90.0.1/24 br0
connect client 10.90.0.2/24 br0
note "8080 = 블로킹(동시성 1, nc) / 8081 = 이벤트 기반(nginx)."

step 2 "서버 기동: 8080 블로킹(nc 루프, 한 번에 연결 1개), 8081 nginx"
# 블로킹: nc 한 개만 listen -> 동시에 단 하나의 연결만 처리. 연결이 안 끝나면 다음을 못 받는다.
ip netns exec server bash -c \
  'while true; do printf "HTTP/1.0 200 OK\r\nContent-Length: 12\r\nConnection: close\r\n\r\nok-blocking\n" | nc -l -p 8080; done' \
  >/dev/null 2>&1 &
_PIDS+=($!)
# 이벤트 기반: nginx
cat >/tmp/ng.conf <<'EOF'
daemon off;
pid /tmp/ng.pid;
error_log /tmp/ng.err;
events {}
http {
  access_log off;
  server { listen 8081; location / { return 200 "ok-nginx\n"; } }
}
EOF
ip netns exec server nginx -c /tmp/ng.conf >/tmp/ng.boot 2>&1 &
_PIDS+=($!)
sleep 1

step 3 "[기준선] 느린 클라이언트 없을 때: 둘 다 즉시 정상 응답"
note "블로킹(8080):"; probe 8080
note "이벤트(8081):"; probe 8081

step 4 "느린 클라이언트가 각 서버에 연결을 하나씩 8초간 붙잡는다(요청을 안 끝냄)"
ip netns exec client bash -c 'sleep 8 | nc 10.90.0.1 8080' >/dev/null 2>&1 &
_PIDS+=($!)
ip netns exec client bash -c 'sleep 8 | nc 10.90.0.1 8081' >/dev/null 2>&1 &
_PIDS+=($!)
sleep 1
note "두 서버 모두 '느린 연결'을 하나씩 물고 있는 상태."

step 5 "[블로킹 서버] 점유 중 정상 요청 -> 막힌다(워커가 잡혀 타임아웃)"
probe 8080
note "동시성이 1이라, 느린 연결 하나가 유일한 워커를 점유하는 동안 새 요청은 처리되지 못한다(HTTP=000=타임아웃)."

step 6 "[이벤트 서버] 같은 상황에서 정상 요청 -> 즉시 성공"
probe 8081
note "느린 연결은 epoll 안의 항목 하나일 뿐, 워커를 붙잡지 않는다. 그래서 다른 요청은 그대로 빠르게 처리된다."

step 7 "정리"
note "소켓은 싸지만(14), 연결당 '스레드/워커'를 점유하는 모델은 느린 연결 몇 개로 고갈된다. 이벤트 기반(epoll)·경량 스레드(goroutine)가 등장한 이유 = C10K. 여기선 블로킹 동시성을 1로 두어 단 하나의 느린 연결로 재현했지만, 스레드풀 N이어도 느린 연결 N개면 같은 일이 난다."

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 느린 연결이 블로킹 서버의 워커를 점유해 막는 동안, 이벤트 기반 서버는 영향을 안 받음을 확인했다.\n"
