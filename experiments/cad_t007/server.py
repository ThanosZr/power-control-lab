"""Loopback-only single-owner HTTP reference, no PCL imports or file write API."""
import argparse
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
from urllib.parse import urlsplit

from experiments.cad_t003.document import ContractError
from experiments.cad_t007.editor import Editor

ROOT = Path(__file__).resolve().parents[2]
PREFIX = "/experiments/cad_t007/"
STATIC = {
    PREFIX: ("experiments/cad_t007/index.html", "text/html; charset=utf-8"),
    PREFIX + "app.mjs": ("experiments/cad_t007/app.mjs", "text/javascript"),
    PREFIX + "viewport.mjs": ("experiments/cad_t007/viewport.mjs", "text/javascript"),
    "/experiments/cad_t006/geometry.mjs": ("experiments/cad_t006/geometry.mjs", "text/javascript"),
    "/experiments/cad_t006/renderer.mjs": ("experiments/cad_t006/renderer.mjs", "text/javascript"),
}
MAX_REQUEST = 512 * 1024


class Handler(BaseHTTPRequestHandler):
    def _local(self):
        host = "127.0.0.1:" + str(self.server.server_port)
        return self.headers.get("Host") == host and self.headers.get("Origin") in (None, "http://" + host)

    def _send(self, status, content, mime):
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.end_headers()
        self.wfile.write(content)

    def _json(self, status, data):
        self._send(status, json.dumps(data, allow_nan=False).encode(), "application/json")

    def do_GET(self):
        if not self._local():
            return self._json(403, {"error": "Loopback origin required"})
        path = urlsplit(self.path).path
        if path == "/api/state":
            return self._json(200, self.server.editor.state())
        if path == "/api/save":
            return self._json(200, {"text": self.server.editor.save_text()})
        if path not in STATIC:
            return self._json(404, {"error": "Not found"})
        file, mime = STATIC[path]
        self._send(200, (ROOT / file).read_bytes(), mime)

    def do_POST(self):
        if not self._local():
            return self._json(403, {"error": "Loopback origin required"})
        if self.path != "/api/command":
            return self._json(404, {"error": "Not found"})
        try:
            if self.headers.get_content_type() != "application/json":
                raise ValueError("JSON required")
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= MAX_REQUEST:
                raise ValueError("Request exceeds limit")
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError("Expected command record")
            action = data.get("action")
            fields = {"action", "session", "revision"}
            if action == "edit":
                fields.add("changes")
            elif action == "open":
                fields.add("text")
            elif action not in ("undo", "redo"):
                raise ValueError("Unknown command")
            if set(data) != fields:
                raise ValueError("Unexpected command fields")
            kw = {"session": data["session"], "revision": data["revision"]}
            editor = self.server.editor
            if action == "edit":
                state = editor.edit(data["changes"], **kw)
            elif action == "open":
                state = editor.open_text(data["text"], **kw)
            else:
                state = getattr(editor, action)(**kw)
        except (ValueError, TypeError, UnicodeError, ContractError) as exc:
            return self._json(400, {"error": str(exc)})
        except (RuntimeError, TimeoutError) as exc:
            return self._json(422, {"error": str(exc)})
        self._json(200, state)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8767)
    args = parser.parse_args()
    with Editor() as editor, HTTPServer(("127.0.0.1", args.port), Handler) as server:
        server.editor = editor
        print(f"http://127.0.0.1:{server.server_port}{PREFIX}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
