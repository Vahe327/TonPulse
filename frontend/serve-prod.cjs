const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5173;
const DIST = path.join(__dirname, "dist");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === "/" ? "index.html" : req.url.split("?")[0]);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, "index.html");
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || "application/octet-stream";

  try {
    const data = fs.readFileSync(filePath);

    const headers = { "Content-Type": contentType };
    if (ext === ".js" || ext === ".css" || ext === ".woff2") {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    }

    res.writeHead(200, headers);
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Production server running on port ${PORT}`);
});
