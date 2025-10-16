#!/usr/bin/env bash
set -e
echo "Local adapter:"
curl -s http://127.0.0.1:3000/api/ping | jq .
echo
echo "CF adapter:"
curl -s https://mcp2.eswdocs.cc/api/ping | jq .
echo
echo "Local sidecar SSE (3 lines):"
curl -sN http://127.0.0.1:7015/ask \
  -H 'content-type: application/json' -H 'accept: text/event-stream' \
  --data '{"action":"ping"}' | sed -n 's/^data: //p' | head -n 3
