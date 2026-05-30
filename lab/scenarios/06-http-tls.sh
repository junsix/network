#!/usr/bin/env bash
# 시나리오 06: HTTP vs HTTPS(TLS)
# 교재 매핑: next/content/http.mdx, next/content/tls.mdx  (L7)
#
# 무엇을 보는가:
#   HTTP는 요청/응답이 평문이라 캡처에 GET/200/본문이 그대로 읽힌다(도청 가능).
#   HTTPS는 TLS(여기선 1.3) 핸드셰이크 뒤 본문이 암호화돼 캡처에 안 읽힌다.
#   단, 접속하려는 도메인(SNI)은 ClientHello에 평문으로 남는 점까지 같은 토폴로지에서 비교한다.

source /lab/lib/common.sh

title "HTTP vs HTTPS: 평문과 암호문의 차이를 패킷으로"

step 1 "토폴로지: client --- (br0) --- server"
bridge br0
host server
host client
connect server 10.20.0.1/24 br0
connect client 10.20.0.2/24 br0

step 2 "[HTTP] server에서 8080 평문 HTTP 응답 준비 (일회용)"
ip netns exec server bash -c \
  'printf "HTTP/1.0 200 OK\r\nContent-Type: text/plain\r\n\r\nhello-cleartext\n" | nc -N -l -p 8080' \
  >/dev/null 2>&1 &
_PIDS+=($!)
sleep 0.5

step 3 "br0에서 8080 캡처 시작 (-A: 페이로드를 ASCII로 표시)"
tcpdump -l -n -A -i br0 'tcp port 8080' >/tmp/http.$$ 2>/dev/null &
_PIDS+=($!)
sleep 0.5

step 4 "client가 curl 로 HTTP GET"
x client curl -s --max-time 5 http://10.20.0.1:8080/
sleep 1

step 5 "캡처에서 평문이 그대로 읽히는지 확인"
grep -aE 'GET /|HTTP/1\.0 200|hello-cleartext' /tmp/http.$$ | sed 's/^/      /' || true
note "요청줄(GET)·응답(200 OK)·본문이 패킷에 그대로 보인다 = 누구나 도청 가능"

step 6 "[HTTPS] 자체서명 인증서 생성 + 8443 TLS 서버 기동"
ip netns exec server bash -c \
  'openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
     -keyout /tmp/k.pem -out /tmp/c.pem -subj "/CN=lab.server"' >/dev/null 2>&1
ip netns exec server bash -c \
  'openssl s_server -quiet -accept 8443 -cert /tmp/c.pem -key /tmp/k.pem -www' \
  >/dev/null 2>&1 &
_PIDS+=($!)
sleep 1
note "CN=lab.server 인증서로 TLS 서빙. curl 은 자체서명이라 -k 로 검증 생략."

step 7 "br0에서 8443 캡처 시작 (-A)"
tcpdump -l -n -A -i br0 'tcp port 8443' >/tmp/https.$$ 2>/dev/null &
_PIDS+=($!)
sleep 0.5

step 8 "client가 HTTPS GET (이름 shop.lab.server 로 접속 -> ClientHello에 SNI 실림)"
# --resolve 로 이름은 shop.lab.server, 실제 IP는 10.20.0.1 로 매핑. SNI가 평문으로 전송된다.
x client bash -c "curl -skv --max-time 5 --resolve shop.lab.server:8443:10.20.0.1 \
  https://shop.lab.server:8443/ 2>&1 >/dev/null | grep -iE 'SSL connection|< HTTP/' | sed 's/^/      /'"
sleep 1

step 9 "캡처 대조: 본문은 암호화로 안 보이지만, 접속 도메인(SNI)은 평문으로 샌다"
note "[1] 평문 본문/요청 검색 (HTTPS 캡처에서 'hello'/'GET'/'HTML'):"
if grep -aqE 'hello-cleartext|GET /|<HTML>' /tmp/https.$$; then
  grep -aE 'hello-cleartext|GET /|<HTML>' /tmp/https.$$ | sed 's/^/      /'
else
  printf "      (없음) 본문·요청이 모두 암호화돼 캡처에 안 보인다\n"
fi
note "[2] 그래도 SNI(접속하려는 도메인)는 ClientHello에 평문으로 들어간다:"
if grep -aq 'shop.lab.server' /tmp/https.$$; then
  printf "      SNI 노출: shop.lab.server  <- 본문은 못 봐도 '어디에 접속하는지'는 드러난다\n"
else
  printf "      (SNI 미검출)\n"
fi
note "TLS 1.3은 인증서까지 암호화한다(1.2와 달리). 그래서 와이어에 남는 평문 단서는 사실상 SNI와 목적지 IP뿐이다."

printf "\n${c_green}${c_bold}✔ 시나리오 완료.${c_reset} HTTP는 본문까지 평문, HTTPS는 본문 암호화. 단 접속 도메인(SNI)은 평문으로 남는다.\n"
