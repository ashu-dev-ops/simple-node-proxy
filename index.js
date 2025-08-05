const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
const { LRUCache } = require("lru-cache"); // Updated import

const app = express();

const redirectMap = {
  "/bulk-whatsapp-marketing/dubai/": "/bulk-whatsapp-marketing-uae/dubai/",
  "/bulk-whatsapp-marketing/sharjah/": "/bulk-whatsapp-marketing-uae/sharjah/",
  "/bulk-whatsapp-marketing/abu-dhabi/":
    "/bulk-whatsapp-marketing-uae/abu-dhabi/",
  "/bulk-whatsapp-marketing/ajman/": "/bulk-whatsapp-marketing-uae/ajman/",
  "/bulk-whatsapp-marketing/ras-al-khaimah/":
    "/bulk-whatsapp-marketing-uae/ras-al-khaimah/",
  "/bulk-whatsapp-marketing/al-ain/": "/bulk-whatsapp-marketing-uae/al-ain/",
};

// ⚙️ LRU Cache Configuration
const cache = new LRUCache({
  max: 50, // maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes in milliseconds
});

app.use(async (req, res) => {
  const originalUrl = new URL(
    `${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  let path = originalUrl.pathname;

  // Trailing slash redirect
  if (!path.endsWith("/")) {
    originalUrl.pathname = `${path}/`;
    return res.redirect(301, originalUrl.toString());
  }

  // Hardcoded redirects
  if (redirectMap[path]) {
    return res.redirect(301, redirectMap[path]);
  }

  // Clean /index.txt/ from URL
  const indexTxtRegex = /\/index\.txt\/?$/;
  if (indexTxtRegex.test(path)) {
    const cleanedPath = path.replace(indexTxtRegex, "");
    originalUrl.pathname = cleanedPath;
    return res.redirect(301, originalUrl.toString());
  }

  // Disallow if teamId or userId present
  if (
    path.startsWith("/blogs") &&
    (originalUrl.searchParams.has("teamId") ||
      originalUrl.searchParams.has("userId"))
  ) {
    return res.status(404).send("Not Found");
  }

  // Proxy logic
  const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");
  const isBlogsPath = path === "/blogs/" || path.startsWith("/blogs/");
  const targetUrl = isBlogsPath
    ? `https://blogstest.sheetwa.com${proxyPath}${originalUrl.search}`
    : `https://test.sheetwa.com${originalUrl.pathname}${originalUrl.search}`;

  // 🤖 Check cache
  if (cache.has(targetUrl)) {
    const { body, contentType, status } = cache.get(targetUrl);
    res.set("Content-Type", contentType);
    return res.status(status).send(body);
  }

  try {
    const proxyRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "",
      },
    });

    const contentType = proxyRes.headers.get("content-type") || "text/html";
    const body = await proxyRes.text();

    // 🧠 Store in cache
    cache.set(targetUrl, {
      body,
      contentType,
      status: proxyRes.status,
    });

    res.set("Content-Type", contentType);
    res.status(proxyRes.status).send(body);
  } catch (err) {
    console.error("Proxy failed:", err);
    res.status(500).send("Proxy Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Render proxy server running on port ${PORT}`);
});
