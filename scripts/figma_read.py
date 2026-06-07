#!/usr/bin/env python3
"""
Прямой клиент к локальному Figma Desktop Dev Mode MCP (http://127.0.0.1:3845/mcp).
Не требует регистрации MCP в Claude Code — говорим с сервером по HTTP сами.

Использование:
  python figma_read.py <tool> '<json_args>' [out_file]

Примеры:
  python figma_read.py get_metadata '{"nodeId":"136:447"}'
  python figma_read.py get_screenshot '{"nodeId":"136:601"}' shot.png
  python figma_read.py get_variable_defs '{"nodeId":"136:447"}'
  python figma_read.py tools/list '{}'
"""
import sys, json, base64, urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

URL = "http://127.0.0.1:3845/mcp"
HEADERS = {"Content-Type": "application/json",
           "Accept": "application/json, text/event-stream"}


def post(body, session=None, want_id=None):
    h = dict(HEADERS)
    if session:
        h["mcp-session-id"] = session
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers=h, method="POST")
    resp = urllib.request.urlopen(req, timeout=60)
    sid = resp.headers.get("mcp-session-id")
    # SSE: читаем построчно, чтобы не висеть на открытом стриме.
    objs = []
    try:
        for raw_line in resp:
            line = raw_line.decode("utf-8", "replace").strip()
            payload = None
            if line.startswith("data:"):
                payload = line[5:].strip()
            elif line.startswith("{"):
                payload = line
            if payload:
                try:
                    o = json.loads(payload)
                    objs.append(o)
                    if want_id is not None and o.get("id") == want_id:
                        break
                except Exception:
                    pass
    except Exception:
        pass  # терпим обрыв чтения — возвращаем что собрали
    return sid, objs


def main():
    tool = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    out_file = sys.argv[3] if len(sys.argv) > 3 else None

    # 1. initialize
    sid, _ = post({"jsonrpc": "2.0", "id": 1, "method": "initialize",
                   "params": {"protocolVersion": "2024-11-05", "capabilities": {},
                              "clientInfo": {"name": "ystroika-audit", "version": "1.0"}}})
    # 2. initialized notification
    post({"jsonrpc": "2.0", "method": "notifications/initialized"}, session=sid)

    # 3. the call
    if tool == "tools/list":
        _, objs = post({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}, session=sid, want_id=2)
    else:
        # default logging params for design-context-style tools
        args.setdefault("clientFrameworks", "astro")
        args.setdefault("clientLanguages", "html,css,typescript")
        _, objs = post({"jsonrpc": "2.0", "id": 2, "method": "tools/call",
                        "params": {"name": tool, "arguments": args}}, session=sid, want_id=2)

    # find response with id 2
    result = None
    for o in objs:
        if o.get("id") == 2:
            result = o
            break
    if result is None and objs:
        result = objs[-1]

    if result is None:
        print("NO RESPONSE from server"); sys.exit(2)
    if "error" in result:
        print("ERROR:", json.dumps(result["error"], ensure_ascii=False)); sys.exit(3)

    res = result.get("result", {})

    # tools/list
    if tool == "tools/list":
        for t in res.get("tools", []):
            print("-", t["name"])
        return

    # tools/call -> content array
    content = res.get("content", [])
    saved_img = False
    for c in content:
        ctype = c.get("type")
        if ctype == "text":
            print(c.get("text", ""))
        elif ctype == "image":
            data = c.get("data", "")
            if out_file and data:
                with open(out_file, "wb") as f:
                    f.write(base64.b64decode(data))
                print(f"[IMAGE saved -> {out_file} | {len(data)} b64 chars | mime {c.get('mimeType')}]")
                saved_img = True
            else:
                print(f"[IMAGE in response: {len(data)} b64 chars, mime {c.get('mimeType')} — pass out_file to save]")
        elif ctype == "resource":
            print("[RESOURCE]", json.dumps(c.get("resource", {}), ensure_ascii=False)[:500])
        else:
            print(f"[{ctype}]", json.dumps(c, ensure_ascii=False)[:500])
    if res.get("isError"):
        print("(tool reported isError=true)")
    if not content:
        print("RAW result:", json.dumps(res, ensure_ascii=False)[:1000])


if __name__ == "__main__":
    main()
