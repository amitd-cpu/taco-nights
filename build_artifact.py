"""Build the claude.ai Artifact version of Taco Nights.

The Artifact host wraps the file in its own <html>/<head>/<body> skeleton and does not run
service workers or read web-app manifests, so this strips the document wrapper and the PWA
lines from index.html and writes dist/taco-nights.html. index.html stays the self-hosted /
installable version; this file is what gets published for the share link.

    python build_artifact.py
"""
import re, pathlib

src = pathlib.Path(__file__).with_name("index.html").read_text(encoding="utf-8")
out = []
for line in src.splitlines():
    s = line.strip()
    if s in ("<!doctype html>", '<html lang="en">', "<head>", "</head>", "<body>", "</body>", "</html>"):
        continue
    if s.startswith("<meta ") or s.startswith("<link "):
        continue
    out.append(line)
html = "\n".join(out).strip() + "\n"
# The service worker cannot run inside the Artifact frame; drop its registration.
html = re.sub(r"if \('serviceWorker' in navigator.*?\n\}\n", "", html, flags=re.S)
dist = pathlib.Path(__file__).with_name("dist")
dist.mkdir(exist_ok=True)
(dist / "taco-nights.html").write_text(html, encoding="utf-8")
print("wrote", dist / "taco-nights.html", len(html), "bytes")
