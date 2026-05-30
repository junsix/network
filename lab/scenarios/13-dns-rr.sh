#!/usr/bin/env bash
# 시나리오 13: DNS 라운드로빈 (이름 하나 -> 여러 IP) vs L7 LB
# 교재 매핑: next/content/dns.mdx + advanced/cdn-lb.mdx  (DNS 기반 분산)
#
# 무엇을 보는가:
#   이름 하나(app.lab.internal)에 A 레코드를 여러 개 달면, 클라이언트는 그중 하나로
#   "직접" 붙는다(경로에 프록시 없음). 분산은 이름 해석 단계에서 일어난다.
#   시나리오 11의 L7 LB(단일 VIP, 프록시가 매 요청 분산)와 어떻게 다른지 대조한다.

source /lab/lib/common.sh

# 이름 반환 HTTP 백엔드 한 대 띄우기.
backend() {  # backend <ns> <body>
  local ns="$1" body="$2" len
  len=$(( ${#body} + 1 ))   # 본문 + 줄바꿈
  ip netns exec "$ns" bash -c \
    "while true; do printf 'HTTP/1.0 200 OK\r\nContent-Length: $len\r\nConnection: close\r\n\r\n$body\n' | nc -N -l -p 80; done" \
    >/dev/null 2>&1 &
  _PIDS+=($!)
}

title "DNS 라운드로빈: 이름 하나가 여러 IP로 (vs L7 LB)"

step 1 "토폴로지: client --- br0 --- { dnssrv, backend x3 }"
bridge br0
host client
host dnssrv
host b1; host b2; host b3
connect client 10.70.0.2/24  br0
connect dnssrv 10.70.0.1/24  br0
connect b1     10.70.0.11/24 br0
connect b2     10.70.0.12/24 br0
connect b3     10.70.0.13/24 br0
note "DNS=10.70.0.1, 백엔드=10.70.0.11/12/13. client는 이름 app.lab.internal만 쓴다."

step 2 "백엔드 3대 기동: 각자 자기 이름을 반환하는 :80 HTTP"
backend b1 backend-1
backend b2 backend-2
backend b3 backend-3
sleep 0.5

step 3 "DNS 서버: app.lab.internal 에 A 레코드 3개 부여"
cat >/tmp/hosts.app <<EOF
10.70.0.11 app.lab.internal
10.70.0.12 app.lab.internal
10.70.0.13 app.lab.internal
EOF
ip netns exec dnssrv dnsmasq \
  --interface=eth0 --bind-interfaces --no-resolv --no-hosts \
  --addn-hosts=/tmp/hosts.app --log-queries --no-daemon >/tmp/dnsq.$$ 2>&1 &
_PIDS+=($!)
sleep 1
note "한 이름에 IP 셋. 이것이 'DNS 안에 사는 백엔드 풀'이다."

step 4 "client resolv.conf 설정 (DNS 서버 지정 + rotate)"
cat >/etc/resolv.conf <<EOF
nameserver 10.70.0.1
options rotate
EOF
note "options rotate: glibc 리졸버가 조회마다 A 레코드 순서를 돌린다(클라이언트 측 분산)."

step 5 "이름 한 번 조회 -> A 레코드 셋이 한꺼번에 온다"
x client dig +noall +answer @10.70.0.1 app.lab.internal

step 6 "br0에서 :80 연결 시작(SYN) 캡처 시작"
tcpdump -l -n -i br0 'tcp port 80' >/tmp/sniff.$$ 2>/dev/null &
_PIDS+=($!)
sleep 0.5

step 7 "client가 이름으로 6번 요청 -> 분산되는지 확인"
note "client가 http://app.lab.internal/ 로 6번 요청한 응답:"
ip netns exec client bash -c 'for i in $(seq 6); do curl -s --max-time 3 http://app.lab.internal/; done' \
  | tee /tmp/rrout | sed 's/^/      /'
note "분포 -> b1:$(grep -c backend-1 /tmp/rrout) b2:$(grep -c backend-2 /tmp/rrout) b3:$(grep -c backend-3 /tmp/rrout)"

step 8 "핵심 대조: client가 백엔드 IP로 '직접' 붙는다 (프록시 경유 아님)"
grep -m6 'Flags \[S\]' /tmp/sniff.$$ | sed 's/^/      /' || true
note "출발지는 client(10.70.0.2), 목적지는 백엔드(10.70.0.11/12/13). 중간에 LB가 없다. 시나리오 11(L7 LB)에선 client가 VIP 한 곳에만 붙고 LB가 백엔드로 다시 연결했던 것과 정반대다."

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} DNS 라운드로빈은 이름 해석 단계에서 분산하고 client가 백엔드에 직접 붙는다. 프록시(L7 LB)와 다른 분산 지점을 확인했다.\n"
