const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml"
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(request.url.split("?")[0]);
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(root, requested);

  if (!file.startsWith(root + path.sep) && file !== root) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(file, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end("Bestand niet gevonden");
      return;
    }

    const range = request.headers.range;
    if (range && file.endsWith(".mp4")) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match && match[1] ? Number(match[1]) : 0;
      const end = match && match[2] ? Number(match[2]) : stats.size - 1;
      response.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "video/mp4"
      });
      fs.createReadStream(file, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    fs.createReadStream(file).pipe(response);
  });
}).listen(3000, "0.0.0.0", () => {
  console.log("Ontmoet de Oudegracht draait op http://localhost:3000");
});
