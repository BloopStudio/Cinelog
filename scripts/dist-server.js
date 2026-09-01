const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");
const PORT = 8080;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
};

function resolvePath(urlPath) {
  const clean = urlPath.split("?")[0];

  if (clean === "/" || clean === "") return path.join(DIST, "index.html");
  if (clean === "/search") return path.join(DIST, "search.html");
  if (clean.startsWith("/details/")) {
    return path.join(DIST, "details", "[mediaType]", "[id].html");
  }

  const direct = path.join(DIST, clean);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;

  return null;
}

http
  .createServer((req, res) => {
    const filePath = resolvePath(req.url);
    if (!filePath || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  })
  .listen(PORT, () => console.log(`serving ${DIST} on :${PORT}`));
