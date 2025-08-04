const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
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

app.use(async (req, res) => {
  const originalUrl = new URL(
    `${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  let path = originalUrl.pathname;

  if (!path.endsWith("/")) {
    originalUrl.pathname = `${path}/`;
    return res.redirect(301, originalUrl.toString());
  }

  if (redirectMap[path]) {
    return res.redirect(301, redirectMap[path]);
  }

  if (path === "/blogs/index.txt/") {
    return res.redirect(301, "/blogs/");
  }

  if (
    path.startsWith("/blogs") &&
    (originalUrl.searchParams.has("teamId") ||
      originalUrl.searchParams.has("userId"))
  ) {
    return res.status(404).send("Not Found");
  }

  if (path === "/blogs/" || path.startsWith("/blogs/")) {
    const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");

    const targetUrl = `https://sheetwa22.getpowerblog.com${proxyPath}${originalUrl.search}`;

    try {
      const proxyRes = await fetch(targetUrl, {
        headers: {
          "User-Agent": req.headers["user-agent"] || "",
        },
      });

      const contentType = proxyRes.headers.get("content-type") || "text/html";
      const body = await proxyRes.text();

      res.set("Content-Type", contentType);
      res.status(proxyRes.status).send(body);
    } catch (err) {
      console.error("Proxy failed:", err);
      res.status(500).send("Proxy Error");
    }
  } else {
    const targetUrl = `https://sheetwa.com/`;

    try {
      const proxyRes = await fetch(targetUrl, {
        headers: {
          "User-Agent": req.headers["user-agent"] || "",
        },
      });

      const contentType = proxyRes.headers.get("content-type") || "text/html";
      const body = await proxyRes.text();

      res.set("Content-Type", contentType);
      res.status(proxyRes.status).send(body);
    } catch (err) {
      console.error("Proxy failed:", err);
      res.status(500).send("Proxy Error");
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Render proxy server running on port ${PORT}`);
});
