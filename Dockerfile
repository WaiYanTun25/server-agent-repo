FROM ubuntu:22.04

RUN apt-get update && apt-get install -y nodejs npm curl dpkg rsync

WORKDIR /app
COPY . /app

RUN npm install

# Set up for .deb packaging
RUN mkdir -p /app/deb/usr/lib/server-agent \
    && rsync -a --exclude=deb /app/ /app/deb/usr/lib/server-agent \
    && mkdir -p /app/deb/usr/bin \
    && echo '#!/bin/bash\nnode /usr/lib/server-agent/bin/agent-cli.js "$@"' > /app/deb/usr/bin/agent-cli \
    && chmod +x /app/deb/usr/bin/agent-cli

# Control file
RUN mkdir -p /app/deb/DEBIAN \
    && echo 'Package: server-agent\nVersion: 1.0.0\nSection: base\nPriority: optional\nArchitecture: all\nDepends: nodejs\nMaintainer: You <you@example.com>\nDescription: Server monitoring agent CLI' > /app/deb/DEBIAN/control

# Build the package
RUN dpkg-deb --build /app/deb /app/server-agent_1.0.0_all.deb
