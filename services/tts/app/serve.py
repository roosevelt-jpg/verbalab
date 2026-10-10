"""Listen on IPv4 and IPv6 at once: Fly health checks use IPv4, the private `.internal` network uses IPv6.

Uvicorn's `--host ::` socket is IPv6-only, so open a dual-stack socket and hand it over.
"""

import os
import socket

import uvicorn


def main() -> None:
    port = int(os.environ.get("PORT", "8080"))
    sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
    sock.bind(("::", port))
    sock.listen(2048)
    config = uvicorn.Config("app.main:app", log_level=os.environ.get("LOG_LEVEL", "info").lower())
    uvicorn.Server(config).run(sockets=[sock])


if __name__ == "__main__":
    main()
