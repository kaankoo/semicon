/* Zero-dependency static server for local development.
   ES modules and fetch() both need HTTP, so the site cannot be
   opened straight from disk.  npm run dev  →  http://localhost:5173 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon"
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(ROOT, url === "/" ? "index.html" : url);

  // never serve outside the project root
  if (!file.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("404  " + url);
      return;
    }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(buf);
  });
}).listen(PORT, () => {
  console.log(`\n  Sand to Sentence  →  http://localhost:${PORT}\n  serving ${ROOT}\n`);
});
