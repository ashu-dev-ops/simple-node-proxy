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

  //   if (path === "/blogs/index.txt/") {
  //     return res.redirect(301, "/blogs/");
  //   }
  const indexTxtRegex = /\/index\.txt\/?$/;

  if (indexTxtRegex.test(path)) {
    const cleanedPath = path.replace(indexTxtRegex, "");
    originalUrl.pathname = cleanedPath;
    return res.redirect(301, originalUrl.toString());
  }
  if (
    path.startsWith("/blogs") &&
    (originalUrl.searchParams.has("teamId") ||
      originalUrl.searchParams.has("userId"))
  ) {
    return res.status(404).send("Not Found");
  }

  const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");
  const isBlogsPath = path === "/blogs/" || path.startsWith("/blogs/");
  const targetUrl = isBlogsPath
    ? `https://sheetwa22.getpowerblog.com${proxyPath}${originalUrl.search}`
    : `https://test.sheetwa.com${originalUrl.pathname}${originalUrl.search}`;

  try {
    const proxyRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "",
      },
    });

    const contentType = proxyRes.headers.get("content-type") || "text/html";
    let body = await proxyRes.text();

    // More comprehensive URL replacement to fix mixed content issues
    const currentDomain = `${req.protocol}://${req.get("host")}`;

    body = body
      // Replace any HTTP references to the blog domain
      .replace(/http:\/\/sheetwa22\.getpowerblog\.com/g, currentDomain)
      // Replace any HTTP references to your proxy domain
      .replace(
        /http:\/\/simple-node-proxy-up64\.onrender\.com/g,
        "https://simple-node-proxy-up64.onrender.com"
      )
      // Replace any HTTP references to the main domain (for root content)
      .replace(/http:\/\/sheetwa\.com/g, currentDomain)
      // Catch any remaining HTTP references to your current domain
      .replace(new RegExp(`http://${req.get("host")}`, "g"), currentDomain);

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
