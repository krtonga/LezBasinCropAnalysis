"""
serve.py — local HTTP server for the viewer that supports HTTP Range
requests. Required because:

  - Python's stock `http.server` does NOT honour `Range:` headers; it
    always returns 200 + the full file, breaking PMTiles vector overlays
    and Cloud-Optimized GeoTIFF (COG) raster streaming.
  - PMTiles fetches a few KB per map move, not the whole file. Without
    range support every interaction would re-download the entire archive.

Production hosting (Apache / nginx / GoDaddy etc.) supports Range out of
the box, so this script is **local development only**. It binds to
127.0.0.1 and serves only the directory it is run from.

Run:
    cd viewer
    python serve.py            # defaults to port 8765
    python serve.py 8080       # override port

Then open http://127.0.0.1:<port>/ in a browser.
"""

import os
import re
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class RangeRequestHandler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler with `Range:` header support (RFC 7233).

    Only single-range requests are supported (`bytes=START-END` or
    `bytes=-N` for a suffix). Multipart/byterange responses are not
    needed for PMTiles / COG access patterns.
    """

    def send_head(self):
        range_header = self.headers.get("Range", "")
        if not range_header.startswith("bytes="):
            return super().send_head()

        path = self.translate_path(self.path)
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        size = os.fstat(f.fileno()).st_size

        m = re.fullmatch(r"bytes=(\d*)-(\d*)", range_header.strip())
        if not m or (m.group(1) == "" and m.group(2) == ""):
            self.send_error(400, "Invalid Range header")
            f.close()
            return None
        start_s, end_s = m.group(1), m.group(2)
        if start_s == "":
            length = int(end_s)
            start  = max(0, size - length)
            end    = size - 1
        else:
            start = int(start_s)
            end   = int(end_s) if end_s else size - 1
        end = min(end, size - 1)
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            f.close()
            return None
        length = end - start + 1

        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Length", str(length))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        # Accept-Ranges is appended by end_headers() below.
        self.end_headers()

        f.seek(start)
        return _BoundedReader(f, length)

    def end_headers(self):
        # Always advertise range support so clients can probe before
        # issuing a Range request (useful for PMTiles' init fetch).
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()


class _BoundedReader:
    """Reads at most `remaining` bytes from `f`. Used for partial responses."""

    def __init__(self, f, remaining):
        self.f = f
        self.remaining = remaining

    def read(self, n=-1):
        if self.remaining <= 0:
            return b""
        if n < 0 or n > self.remaining:
            n = self.remaining
        data = self.f.read(n)
        self.remaining -= len(data)
        return data

    def close(self):
        self.f.close()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    addr = ("127.0.0.1", port)
    httpd = HTTPServer(addr, RangeRequestHandler)
    print(f"Serving viewer at http://{addr[0]}:{addr[1]}/  (Ctrl-C to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
