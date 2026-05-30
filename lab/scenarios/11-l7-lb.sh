#!/usr/bin/env bash
# 시나리오 11: L7 로드밸런서 / 리버스 프록시 (nginx)
# 교재 매핑: next/content/advanced/cdn-lb.mdx  (L7 LB / 리버스 프록시)
#
# 무엇을 보는가:
#   클라이언트는 입구(LB) 하나만 안다. LB(nginx)가 HTTP 요청을 받아(L7) 뒤에 숨은
#   백엔드 여러 대로 분산(round-robin)한다.
#   와이어를 보면 'client<->LB' 와 'LB<->backend' 가 별개의 TCP 연결이다.
#   = L7에서 연결을 끊고 다시 잇는다(라우터/NAT의 단일 통과와 다른 점).

source /lab/lib/common.sh

title "L7 로드밸런서: 한 입구(LB) 뒤로 여러 백엔드를 분산"

step 1 "토폴로지: client --- br0 --- { lb(nginx), backendA, backendB }"
bridge br0
host client
host lb
host backendA
host backendB
connect client   10.50.0.2/24  br0
connect lb       10.50.0.1/24  br0
connect backendA 10.50.0.11/24 br0
connect backendB 10.50.0.12/24 br0
note "client는 LB(10.50.0.1)만 안다. 백엔드 10.50.0.11/12는 LB 뒤에 숨는다."

step 2 "백엔드 2대 기동: 각자 자기 이름을 돌려주는 8080 HTTP"
ip netns exec backendA bash -c 'while true; do printf "HTTP/1.0 200 OK\r\nContent-Length: 10\r\nConnection: close\r\n\r\nbackend-A\n" | nc -N -l -p 8080; done' >/dev/null 2>&1 &
_PIDS+=($!)
ip netns exec backendB bash -c 'while true; do printf "HTTP/1.0 200 OK\r\nContent-Length: 10\r\nConnection: close\r\n\r\nbackend-B\n" | nc -N -l -p 8080; done' >/dev/null 2>&1 &
_PIDS+=($!)
sleep 0.5

step 3 "LB에 nginx 리버스 프록시 설정(upstream 라운드로빈) 후 기동"
cat >/tmp/nginx.conf <<'EOF'
daemon off;
pid /tmp/nginx.pid;
error_log /tmp/nginx.err;
events {}
http {
  access_log /tmp/nginx.access;
  upstream backends {
    server 10.50.0.11:8080;
    server 10.50.0.12:8080;
  }
  server {
    listen 80;
    location / {
      proxy_pass http://backends;
      proxy_set_header X-Forwarded-For $remote_addr;
    }
  }
}
EOF
ip netns exec lb nginx -c /tmp/nginx.conf >/tmp/nginx.boot 2>&1 &
_PIDS+=($!)
sleep 1
note "nginx가 80에서 받아 backendA/B로 번갈아 넘긴다(round-robin)."

step 4 "br0에서 캡처 시작 (연결 시작 SYN만)"
tcpdump -l -n -i br0 'tcp[tcpflags] & tcp-syn != 0 and tcp[tcpflags] & tcp-ack == 0' >/tmp/sniff.$$ 2>/dev/null &
_PIDS+=($!)
sleep 0.5

step 5 "client가 LB(10.50.0.1)로 6번 요청 -> 응답이 두 백엔드로 분산"
note "client가 http://10.50.0.1/ 로 6번 요청한 응답:"
ip netns exec client bash -c 'for i in $(seq 6); do curl -s --max-time 3 http://10.50.0.1/; done' \
  | tee /tmp/lbout | sed 's/^/      /'

step 6 "분산 집계"
note "백엔드별 응답 수 -> backend-A: $(grep -c backend-A /tmp/lbout 2>/dev/null) / backend-B: $(grep -c backend-B /tmp/lbout 2>/dev/null)"

step 7 "L7의 증거: 연결이 둘로 나뉜다 (client<->LB, LB<->backend)"
note "client -> LB 연결 (목적지 :80):"
grep -m2 '\.80:' /tmp/sniff.$$ | sed 's/^/      /' || true
note "LB -> backend 연결 (목적지 :8080, 출발지는 LB 10.50.0.1):"
grep -m2 '\.8080:' /tmp/sniff.$$ | sed 's/^/      /' || true
note "client는 LB와만 TCP를 맺고, LB가 백엔드와 '새' TCP를 따로 맺는다. 그래서 백엔드 입장의 출발지는 client가 아니라 LB다(그래서 X-Forwarded-For로 원래 IP를 전달한다)."

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} LB가 한 입구로 받은 요청을 L7에서 백엔드로 분산하고, 연결을 끊고 다시 잇는 리버스 프록시 동작을 확인했다.\n"
