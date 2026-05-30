#!/usr/bin/env bash
# 시나리오 04: DNS (이름 -> 주소 해석)
# 교재 매핑: next/content/dns.mdx  (L2 실무)
#
# 무엇을 보는가:
#   클라이언트가 도메인 이름을 IP로 바꾸기 위해 리졸버에 질의(query)를 던지고,
#   리졸버가 응답(response)을 돌려주는 과정을 dig + 패킷 캡처로 본다.
#   A 레코드와 존재하지 않는 이름(NXDOMAIN)의 차이도 확인한다.

source /lab/lib/common.sh

title "DNS: 이름을 주소로 바꾸는 질의/응답"

step 1 "토폴로지: dnsmasq DNS 서버 + 클라이언트"
bridge br0
host dnssrv
host client
connect dnssrv 10.10.0.1/24 br0
connect client 10.10.0.2/24 br0

step 2 "서버에 권한 레코드 정의 (lab.internal -> 10.10.0.99)"
cat >/tmp/hosts.lab <<EOF
10.10.0.99 web.lab.internal
10.10.0.98 db.lab.internal
EOF
ip netns exec dnssrv dnsmasq \
  --interface=eth0 --bind-interfaces \
  --no-resolv --no-hosts \
  --local=/lab.internal/ \
  --addn-hosts=/tmp/hosts.lab \
  --log-queries --no-daemon >/tmp/dnsq.$$ 2>&1 &
_PIDS+=($!)
sleep 1
note "web.lab.internal=10.10.0.99, db.lab.internal=10.10.0.98 로 응답하도록 설정"

step 3 "br0에서 DNS(udp 53) 패킷 캡처 시작"
sniff root br0 'udp port 53'

step 4 "client에서 정상 이름 질의 (A 레코드)"
x client dig +noall +question +answer @10.10.0.1 web.lab.internal

step 5 "존재하지 않는 이름 질의 (NXDOMAIN)"
x client dig +nocmd +noall +comments @10.10.0.1 nope.lab.internal | sed 's/^/      /'

step 6 "캡처된 질의/응답 + 서버 로그"
sleep 0.5
cat /tmp/sniff.$$ 2>/dev/null | sed 's/^/      /'
grep -i query /tmp/dnsq.$$ | tail -4 | sed 's/^/      [server] /' || true

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} 이름 해석의 질의/응답과 NXDOMAIN을 확인했다.\n"
