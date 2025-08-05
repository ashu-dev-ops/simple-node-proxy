// const express = require("express");
// const fetch = require("node-fetch"); // npm install node-fetch@2
// const { LRUCache } = require("lru-cache"); // Updated import

// const app = express();

// const redirectMap = {
//   "/bulk-whatsapp-marketing/dubai/": "/bulk-whatsapp-marketing-uae/dubai/",
//   "/bulk-whatsapp-marketing/sharjah/": "/bulk-whatsapp-marketing-uae/sharjah/",
//   "/bulk-whatsapp-marketing/abu-dhabi/":
//     "/bulk-whatsapp-marketing-uae/abu-dhabi/",
//   "/bulk-whatsapp-marketing/ajman/": "/bulk-whatsapp-marketing-uae/ajman/",
//   "/bulk-whatsapp-marketing/ras-al-khaimah/":
//     "/bulk-whatsapp-marketing-uae/ras-al-khaimah/",
//   "/bulk-whatsapp-marketing/al-ain/": "/bulk-whatsapp-marketing-uae/al-ain/",
// };

// // ⚙️ LRU Cache Configuration
// const cache = new LRUCache({
//   max: 50, // maximum number of items
//   ttl: 1000 * 60 * 5, // 5 minutes in milliseconds
// });

// app.use(async (req, res) => {
//   const originalUrl = new URL(
//     `${req.protocol}://${req.get("host")}${req.originalUrl}`
//   );
//   let path = originalUrl.pathname;

//   // Trailing slash redirect
//   if (!path.endsWith("/")) {
//     originalUrl.pathname = `${path}/`;
//     return res.redirect(301, originalUrl.toString());
//   }

//   // Hardcoded redirects
//   if (redirectMap[path]) {
//     return res.redirect(301, redirectMap[path]);
//   }

//   // Clean /index.txt/ from URL
//   const indexTxtRegex = /\/index\.txt\/?$/;
//   if (indexTxtRegex.test(path)) {
//     const cleanedPath = path.replace(indexTxtRegex, "");
//     originalUrl.pathname = cleanedPath;
//     return res.redirect(301, originalUrl.toString());
//   }

//   // Disallow if teamId or userId present
//   if (
//     path.startsWith("/blogs") &&
//     (originalUrl.searchParams.has("teamId") ||
//       originalUrl.searchParams.has("userId"))
//   ) {
//     return res.status(404).send("Not Found");
//   }

//   // Proxy logic
//   const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");
//   const isBlogsPath = path === "/blogs/" || path.startsWith("/blogs/");
//   let targetUrl = isBlogsPath
//     ? `https://blogstest.sheetwa.com${proxyPath}${originalUrl.search}`
//     : `https://testmain.sheetwa.com${originalUrl.pathname}${originalUrl.search}`;

//   // 🤖 Check cache
//   if (cache.has(targetUrl)) {
//     console.log("Cache hit for:", targetUrl);
//     const { body, contentType, status } = cache.get(targetUrl);
//     res.set("Content-Type", contentType);
//     return res.status(status).send(body);
//   }
//   // if target url ends with /, remove it
//   if (targetUrl.endsWith("/")) {
//     targetUrl = targetUrl.slice(0, -1);
//   }
//   console.log("Cache miss for:", targetUrl);
//   try {
//     const proxyRes = await fetch(targetUrl, {
//       headers: {
//         "User-Agent": req.headers["user-agent"] || "",
//       },
//     });
//     const contentType = proxyRes.headers.get("content-type") || "text/html";
//     const body = await proxyRes.text();
//     // 🧠 Store in cache
//     cache.set(targetUrl, {
//       body,
//       contentType,
//       status: proxyRes.status,
//     });

//     res.set("Content-Type", contentType);
//     res.status(proxyRes.status).send(body);
//   } catch (err) {
//     console.error("Proxy failed:", err);
//     res.status(500).send("Proxy Error");
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Render proxy server running on port ${PORT}`);
// });




// new


// const express = require("express");
// const fetch = require("node-fetch");
// const { LRUCache } = require("lru-cache");

// const app = express();

// const redirectMap = {
//   "/bulk-whatsapp-marketing/dubai/": "/bulk-whatsapp-marketing-uae/dubai/",
//   "/bulk-whatsapp-marketing/sharjah/": "/bulk-whatsapp-marketing-uae/sharjah/",
//   "/bulk-whatsapp-marketing/abu-dhabi/":
//     "/bulk-whatsapp-marketing-uae/abu-dhabi/",
//   "/bulk-whatsapp-marketing/ajman/": "/bulk-whatsapp-marketing-uae/ajman/",
//   "/bulk-whatsapp-marketing/ras-al-khaimab/":
//     "/bulk-whatsapp-marketing-uae/ras-al-khaimah/",
//   "/bulk-whatsapp-marketing/al-ain/": "/bulk-whatsapp-marketing-uae/al-ain/",
// };

// const cache = new LRUCache({
//   max: 50,
//   ttl: 1000 * 60 * 5,
// });

// app.use(async (req, res) => {
//   const originalUrl = new URL(
//     `${req.protocol}://${req.get("host")}${req.originalUrl}`
//   );
//   let path = originalUrl.pathname;

//   console.log(`Incoming request: ${req.method} ${originalUrl.toString()}`);

//   // Force HTTPS redirect if needed
//   if (req.protocol === "http" && req.get("host") === "test.sheetwa.com") {
//     const httpsUrl = originalUrl.toString().replace("http://", "https://");
//     console.log(`Redirecting to HTTPS: ${httpsUrl}`);
//     return res.redirect(301, httpsUrl);
//   }

//   // Trailing slash redirect (but not for RSC requests or files with extensions)
//   if (
//     !path.endsWith("/") &&
//     !path.includes(".") &&
//     !originalUrl.searchParams.has("_rsc")
//   ) {
//     originalUrl.pathname = `${path}/`;
//     return res.redirect(301, originalUrl.toString());
//   }

//   // Hardcoded redirects
//   if (redirectMap[path]) {
//     return res.redirect(301, redirectMap[path]);
//   }

//   // Handle RSC requests specially - don't redirect these
//   const isRSCRequest = originalUrl.searchParams.has("_rsc");

//   // Clean /index.txt/ from URL (but be careful with RSC requests)
//   if (!isRSCRequest) {
//     const indexTxtRegex = /\/index\.txt\/?$/;
//     if (indexTxtRegex.test(path)) {
//       const cleanedPath = path.replace(indexTxtRegex, "/");
//       originalUrl.pathname = cleanedPath;
//       return res.redirect(301, originalUrl.toString());
//     }
//   }

//   // Disallow if teamId or userId present
//   if (
//     path.startsWith("/blogs") &&
//     (originalUrl.searchParams.has("teamId") ||
//       originalUrl.searchParams.has("userId"))
//   ) {
//     return res.status(404).send("Not Found");
//   }

//   // Proxy logic with HTTPS enforcement
//   const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");
//   const isBlogsPath = path === "/blogs/" || path.startsWith("/blogs/");

//   // CRITICAL: Always use HTTPS for target URLs
//   let targetUrl = isBlogsPath
//     ? `https://blogstest.sheetwa.com${proxyPath}${originalUrl.search}`
//     : `https://testmain.sheetwa.com${originalUrl.pathname}${originalUrl.search}`;

//   // Ensure target URL is HTTPS
//   targetUrl = targetUrl.replace(/^http:\/\//, "https://");

//   console.log(`Proxying to: ${targetUrl} (RSC: ${isRSCRequest})`);

//   // Check cache
//   if (cache.has(targetUrl)) {
//     console.log("Cache hit for:", targetUrl);
//     const { body, contentType, status } = cache.get(targetUrl);
//     res.set("Content-Type", contentType);

//     // Add security headers for HTTPS
//     res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

//     return res.status(status).send(body);
//   }

//   console.log("Cache miss for:", targetUrl);

//   try {
//     const proxyRes = await fetch(targetUrl, {
//       headers: {
//         "User-Agent": req.headers["user-agent"] || "",
//         Accept: req.headers["accept"] || "*/*",
//         "Accept-Language": req.headers["accept-language"] || "",
//         "Cache-Control": req.headers["cache-control"] || "",
//         // Forward RSC-specific headers
//         RSC: req.headers["rsc"] || "",
//         "Next-Router-State-Tree": req.headers["next-router-state-tree"] || "",
//         // Forward original host for proper URL resolution
//         "X-Forwarded-Host": req.get("host"),
//         "X-Forwarded-Proto": "https",
//       },
//       timeout: 15000,
//     });

//     const contentType = proxyRes.headers.get("content-type") || "text/html";
//     let body = await proxyRes.text();

//     // CRITICAL: Replace any HTTP references with HTTPS in the response
//     if (
//       contentType.includes("text/") ||
//       contentType.includes("application/json")
//     ) {
//       body = body.replace(
//         /http:\/\/test\.sheetwa\.com/g,
//         "https://test.sheetwa.com"
//       );
//       body = body.replace(
//         /http:\/\/testmain\.sheetwa\.com/g,
//         "https://testmain.sheetwa.com"
//       );
//       body = body.replace(
//         /http:\/\/blogstest\.sheetwa\.com/g,
//         "https://blogstest.sheetwa.com"
//       );
//     }

//     // Only cache successful responses
//     if (proxyRes.ok) {
//       cache.set(targetUrl, {
//         body,
//         contentType,
//         status: proxyRes.status,
//       });
//     }

//     // Forward important response headers
//     const headersToForward = [
//       "cache-control",
//       "etag",
//       "last-modified",
//       "expires",
//       "x-matched-path",
//       "x-middleware-rewrite",
//     ];

//     headersToForward.forEach((header) => {
//       const value = proxyRes.headers.get(header);
//       if (value) {
//         res.set(header, value);
//       }
//     });

//     // Add security headers
//     res.set("Content-Type", contentType);
//     res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
//     res.set("X-Content-Type-Options", "nosniff");

//     res.status(proxyRes.status).send(body);
//   } catch (err) {
//     console.error("Proxy failed for:", targetUrl, err.message);

//     if (
//       err.code === "ECONNRESET" ||
//       err.code === "ETIMEDOUT" ||
//       err.name === "FetchError"
//     ) {
//       return res.status(503).send("Service Temporarily Unavailable");
//     }

//     res.status(500).send("Proxy Error");
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Render proxy server running on port ${PORT}`);
// });


//test 3
const express = require("express");
const fetch = require("node-fetch");
const { LRUCache } = require("lru-cache");

const app = express();

const redirectMap = {
  "/bulk-whatsapp-marketing/dubai/": "/bulk-whatsapp-marketing-uae/dubai/",
  "/bulk-whatsapp-marketing/sharjah/": "/bulk-whatsapp-marketing-uae/sharjah/",
  "/bulk-whatsapp-marketing/abu-dhabi/":
    "/bulk-whatsapp-marketing-uae/abu-dhabi/",
  "/bulk-whatsapp-marketing/ajman/": "/bulk-whatsapp-marketing-uae/ajman/",
  "/bulk-whatsapp-marketing/ras-al-khaimab/":
    "/bulk-whatsapp-marketing-uae/ras-al-khaimah/",
  "/bulk-whatsapp-marketing/al-ain/": "/bulk-whatsapp-marketing-uae/al-ain/",
};

const cache = new LRUCache({
  max: 50,
  ttl: 1000 * 60 * 5,
});

app.use(async (req, res) => {
  const originalUrl = new URL(
    `${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  let path = originalUrl.pathname;

  console.log(`Incoming request: ${req.method} ${originalUrl.toString()}`);

  // Force HTTPS redirect if needed - DO THIS FIRST AND PRESERVE THE FULL URL
  if (req.protocol === "http" && req.get("host") === "test.sheetwa.com") {
    const httpsUrl = `https://${req.get("host")}${req.originalUrl}`;
    console.log(`Redirecting to HTTPS: ${httpsUrl}`);
    return res.redirect(301, httpsUrl);
  }

  // Handle RSC requests specially - don't redirect these
  const isRSCRequest = originalUrl.searchParams.has("_rsc");

  // Hardcoded redirects (do this before trailing slash redirect)
  if (redirectMap[path]) {
    return res.redirect(301, redirectMap[path]);
  }

  // Clean /index.txt/ from URL (but be careful with RSC requests)
  if (!isRSCRequest) {
    const indexTxtRegex = /\/index\.txt\/?$/;
    if (indexTxtRegex.test(path)) {
      const cleanedPath = path.replace(indexTxtRegex, "/");
      originalUrl.pathname = cleanedPath;
      return res.redirect(301, originalUrl.toString());
    }
  }

  // Trailing slash redirect (but not for RSC requests, files with extensions, or root path)
  if (
    !path.endsWith("/") &&
    !path.includes(".") &&
    !isRSCRequest &&
    path !== "" // Don't redirect root path
  ) {
    originalUrl.pathname = `${path}/`;
    console.log(`Adding trailing slash redirect: ${originalUrl.toString()}`);
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

  // Proxy logic with HTTPS enforcement
  const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");
  const isBlogsPath = path === "/blogs/" || path.startsWith("/blogs/");

  // CRITICAL: Always use HTTPS for target URLs
  let targetUrl = isBlogsPath
    ? `https://blogstest.sheetwa.com${proxyPath}${originalUrl.search}`
    : `https://testmain.sheetwa.com${originalUrl.pathname}${originalUrl.search}`;

  // Ensure target URL is HTTPS
  targetUrl = targetUrl.replace(/^http:\/\//, "https://");

  console.log(`Proxying to: ${targetUrl} (RSC: ${isRSCRequest})`);

  // Check cache
  if (cache.has(targetUrl)) {
    console.log("Cache hit for:", targetUrl);
    const { body, contentType, status } = cache.get(targetUrl);
    res.set("Content-Type", contentType);
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    return res.status(status).send(body);
  }

  console.log("Cache miss for:", targetUrl);

  try {
    const proxyRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "",
        Accept: req.headers["accept"] || "*/*",
        "Accept-Language": req.headers["accept-language"] || "",
        "Cache-Control": req.headers["cache-control"] || "",
        // Forward RSC-specific headers
        RSC: req.headers["rsc"] || "",
        "Next-Router-State-Tree": req.headers["next-router-state-tree"] || "",
        // Forward original host for proper URL resolution
        "X-Forwarded-Host": req.get("host"),
        "X-Forwarded-Proto": "https",
      },
      timeout: 15000,
    });

    const contentType = proxyRes.headers.get("content-type") || "text/html";
    let body = await proxyRes.text();

    // CRITICAL: Replace any HTTP references with HTTPS in the response
    if (
      contentType.includes("text/") ||
      contentType.includes("application/json")
    ) {
      body = body.replace(
        /http:\/\/test\.sheetwa\.com/g,
        "https://test.sheetwa.com"
      );
      body = body.replace(
        /http:\/\/testmain\.sheetwa\.com/g,
        "https://testmain.sheetwa.com"
      );
      body = body.replace(
        /http:\/\/blogstest\.sheetwa\.com/g,
        "https://blogstest.sheetwa.com"
      );
    }

    // Only cache successful responses
    if (proxyRes.ok) {
      cache.set(targetUrl, {
        body,
        contentType,
        status: proxyRes.status,
      });
    }

    // Forward important response headers
    const headersToForward = [
      "cache-control",
      "etag",
      "last-modified",
      "expires",
      "x-matched-path",
      "x-middleware-rewrite",
    ];

    headersToForward.forEach((header) => {
      const value = proxyRes.headers.get(header);
      if (value) {
        res.set(header, value);
      }
    });

    // Add security headers
    res.set("Content-Type", contentType);
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.set("X-Content-Type-Options", "nosniff");

    res.status(proxyRes.status).send(body);
  } catch (err) {
    console.error("Proxy failed for:", targetUrl, err.message);

    if (
      err.code === "ECONNRESET" ||
      err.code === "ETIMEDOUT" ||
      err.name === "FetchError"
    ) {
      return res.status(503).send("Service Temporarily Unavailable");
    }

    res.status(500).send("Proxy Error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Render proxy server running on port ${PORT}`);
});