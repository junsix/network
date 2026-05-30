# 네트워킹 핸즈온 랩 베이스 이미지
# 단일 privileged 컨테이너 안에서 ip netns + veth + bridge 로 토폴로지를 만든다.
# docker 자체 네트워킹(docker0 NAT, 127.0.0.11 DNS)을 우회하고
# 순수 L2/L3 를 직접 제어하기 위함.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      iproute2 \
      isc-dhcp-client \
      iputils-ping \
      iputils-arping \
      iputils-tracepath \
      traceroute \
      tcpdump \
      dnsmasq \
      dnsutils \
      bind9-host \
      iperf3 \
      netcat-openbsd \
      openssl \
      bridge-utils \
      ethtool \
      curl \
      ca-certificates \
      procps \
      iptables \
    && rm -rf /var/lib/apt/lists/*

COPY lib /lab/lib
COPY scenarios /lab/scenarios

WORKDIR /lab
CMD ["/bin/bash"]
