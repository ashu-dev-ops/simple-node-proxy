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

// // Updated cache configuration for 100MB storage
// const cache = new LRUCache({
//   max: 1000, // Increased max items
//   maxSize: 100 * 1024 * 1024, // 100 MB in bytes
//   sizeCalculation: (value, key) => {
//     // Calculate size of the cached item
//     const keySize = Buffer.byteLength(key, 'utf8');
//     const bodySize = Buffer.byteLength(value.body, 'utf8');
//     const metaSize = Buffer.byteLength(value.contentType + value.status.toString(), 'utf8');
//     return keySize + bodySize + metaSize;
//   },
//   ttl: 1000 * 60 * 5, // 5 minutes TTL
// });

// // Cache statistics logging
// setInterval(() => {
//   const stats = {
//     size: cache.size,
//     calculatedSize: cache.calculatedSize,
//     maxSize: cache.maxSize,
//     utilizationPercent: ((cache.calculatedSize / cache.maxSize) * 100).toFixed(2)
//   };
//   console.log(`Cache Stats - Items: ${stats.size}, Size: ${(stats.calculatedSize / 1024 / 1024).toFixed(2)}MB/${(stats.maxSize / 1024 / 1024).toFixed(0)}MB (${stats.utilizationPercent}%)`);
// }, 60000); // Log every minute

// app.use(async (req, res) => {
//   const originalUrl = new URL(
//     `${req.protocol}://${req.get("host")}${req.originalUrl}`
//   );
//   let path = originalUrl.pathname;

//   console.log(`Incoming request: ${req.method} ${originalUrl.toString()}`);
//   console.log(`Path: "${path}", Length: ${path.length}`); // Debug log

//   // Handle RSC requests specially - don't redirect these
//   const isRSCRequest = originalUrl.searchParams.has("_rsc");

//   // Force HTTPS redirect if needed - DO THIS FIRST AND PRESERVE THE FULL URL
//   // if (req.protocol === "http" && req.get("host") === "test.sheetwa.com") {
//   //   const httpsUrl = `https://${req.get("host")}${req.originalUrl}`;
//   //   console.log(`Redirecting to HTTPS: ${httpsUrl}`);
//   //   return res.redirect(301, httpsUrl);
//   // }

//   // Skip other redirects for RSC requests
//   if (!isRSCRequest) {
//     // Hardcoded redirects (do this before trailing slash redirect)
//     if (redirectMap[path]) {
//       console.log(`Hardcoded redirect: ${path} -> ${redirectMap[path]}`);
//       return res.redirect(301, redirectMap[path]);
//     }

//     // Clean /index.txt/ from URL
//     const indexTxtRegex = /\/index\.txt\/?$/;
//     if (indexTxtRegex.test(path)) {
//       const cleanedPath = path.replace(indexTxtRegex, "/");
//       originalUrl.pathname = cleanedPath;
//       console.log(`Index.txt redirect: ${path} -> ${cleanedPath}`);
//       return res.redirect(301, originalUrl.toString());
//     }

//     // FIXED: Trailing slash redirect - the key fix is here
//     if (
//       !path.endsWith("/") &&
//       !path.includes(".") &&
//       path !== "/" && // FIXED: was path !== ""
//       path.length > 1 // Additional safety check
//     ) {
//       originalUrl.pathname = `${path}/`;
//       console.log(
//         `Adding trailing slash redirect: ${path} -> ${originalUrl.pathname}`
//       );
//       return res.redirect(301, originalUrl.toString());
//     }
//   }

//   // Disallow if teamId or userId present
//   if (
//     path.startsWith("/blogs") &&
//     (originalUrl.searchParams.has("teamId") ||
//       originalUrl.searchParams.has("userId"))
//   ) {
//     console.log("Blocking request with teamId/userId");
//     return res.status(404).send("Not Found");
//   }

//   // Proxy logic with HTTPS enforcement
//   const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");
//   const isBlogsPath = path === "/blogs/" || path.startsWith("/blogs/");

//   // CRITICAL: Always use HTTPS for target URLs
//   let targetUrl = isBlogsPath
//     ? `https://blogstest.sheetwa.com${proxyPath}${originalUrl.search}`
//     : `https://main.sheetwa.com${originalUrl.pathname}${originalUrl.search}`;

//   // Ensure target URL is HTTPS
//   targetUrl = targetUrl.replace(/^http:\/\//, "https://");

//   console.log(`Proxying to: ${targetUrl} (RSC: ${isRSCRequest})`);

//   // Check cache
//   if (cache.has(targetUrl)) {
//     console.log("Cache hit for:", targetUrl);
//     const { body, contentType, status } = cache.get(targetUrl);
//     res.set("Content-Type", contentType);
//     res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
//     res.set("X-Cache", "HIT"); // Add cache header for debugging
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
//         /http:\/\/main\.sheetwa\.com/g,
//         "https://main.sheetwa.com"
//       );
//       body = body.replace(
//         /http:\/\/blogstest\.sheetwa\.com/g,
//         "https://blogstest.sheetwa.com"
//       );
//     }

//     // Only cache successful responses and check if response is cacheable
//     if (proxyRes.ok) {
//       const cacheData = {
//         body,
//         contentType,
//         status: proxyRes.status,
//       };
      
//       // Calculate response size before caching
//       const responseSize = Buffer.byteLength(body, 'utf8');
      
//       // Only cache responses smaller than 10MB to prevent single large responses from evicting everything
//       if (responseSize < 1 * 1024 * 1024) {
//         cache.set(targetUrl, cacheData);
//         console.log(`Cached response for ${targetUrl} (${(responseSize / 1024).toFixed(2)} KB)`);
//       } else {
//         console.log(`Response too large to cache: ${targetUrl} (${(responseSize / 1024 / 1024).toFixed(2)} MB)`);
//       }
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
//     res.set("X-Cache", "MISS"); // Add cache header for debugging

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
//   console.log(`Cache configured for ${cache.maxSize / 1024 / 1024}MB storage`);
// });


const WEBSITE_URL = "https://maintest.sheetwa.com";
const BLOG_URL = "https://blogstest.sheetwa.com";

const express = require("express");
// const fetch = require("node-fetch");
const { LRUCache } = require("lru-cache");
const rateLimit = require("express-rate-limit");
const requestIp = require("request-ip");
const nodePath = require("path");
const app = express();
const { ipKeyGenerator } = require("express-rate-limit");
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

// Updated cache configuration for 100MB storage
const cache = new LRUCache({
  max: 1000, // Increased max items
  maxSize: 100 * 1024 * 1024, // 100 MB in bytes
  sizeCalculation: (value, key) => {
    // Calculate size of the cached item
    const keySize = Buffer.byteLength(key, "utf8");
    const bodySize = Buffer.byteLength(value.body, "utf8");
    const metaSize = Buffer.byteLength(
      value.contentType + value.status.toString(),
      "utf8"
    );
    return keySize + bodySize + metaSize;
  },
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

// Cache statistics logging
setInterval(() => {
  const stats = {
    size: cache.size,
    calculatedSize: cache.calculatedSize,
    maxSize: cache.maxSize,
    utilizationPercent: ((cache.calculatedSize / cache.maxSize) * 100).toFixed(
      2
    ),
  };
  console.log(
    `Cache Stats - Items: ${stats.size}, Size: ${(
      stats.calculatedSize /
      1024 /
      1024
    ).toFixed(2)}MB/${(stats.maxSize / 1024 / 1024).toFixed(0)}MB (${
      stats.utilizationPercent
    }%)`
  );
}, 60000); // Log every minute

app.use(requestIp.mw());
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // limit each IP to 500 requests per windowMs
    // keyGenerator: (req) => ipKeyGenerator(req),
    keyGenerator: (req, res) => {
      return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
    },
  })
);
app.use(async (req, res) => {
  const originalUrl = new URL(
    `${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  let path = originalUrl.pathname;
  if (path === "/robots.txt") {
    return res.sendFile(nodePath.join(process.cwd(), "robots.txt"));
  }
  console.log(`Incoming request: ${req.method} ${originalUrl.toString()}`);
  console.log(`Path: "${path}", Length: ${path.length}`); // Debug log

  // Handle RSC requests specially - don't redirect these
  const isRSCRequest = originalUrl.searchParams.has("_rsc");

  // Force HTTPS redirect if needed - DO THIS FIRST AND PRESERVE THE FULL URL
  // if (req.protocol === "http" && req.get("host") === "test.sheetwa.com") {
  //   const httpsUrl = `https://${req.get("host")}${req.originalUrl}`;
  //   console.log(`Redirecting to HTTPS: ${httpsUrl}`);
  //   return res.redirect(301, httpsUrl);
  // }

  // Skip other redirects for RSC requests
  if (!isRSCRequest) {
    // Hardcoded redirects (do this before trailing slash redirect)
    if (redirectMap[path]) {
      console.log(`Hardcoded redirect: ${path} -> ${redirectMap[path]}`);
      return res.redirect(301, redirectMap[path]);
    }

    // Clean /index.txt/ from URL
    const indexTxtRegex = /\/index\.txt\/?$/;
    if (indexTxtRegex.test(path)) {
      const cleanedPath = path.replace(indexTxtRegex, "/");
      originalUrl.pathname = cleanedPath;
      console.log(`Index.txt redirect: ${path} -> ${cleanedPath}`);
      return res.redirect(301, originalUrl.toString());
    }

    // FIXED: Trailing slash redirect - the key fix is here
    if (
      !path.endsWith("/") &&
      !path.includes(".") &&
      path !== "/" && // FIXED: was path !== ""
      path.length > 1 // Additional safety check
    ) {
      originalUrl.pathname = `${path}/`;
      console.log(
        `Adding trailing slash redirect: ${path} -> ${originalUrl.pathname}`
      );
      return res.redirect(301, originalUrl.toString());
    }
  }

  // Disallow if teamId or userId present
  if (
    path.startsWith("/blogs") &&
    (originalUrl.searchParams.has("teamId") ||
      originalUrl.searchParams.has("userId"))
  ) {
    console.log("Blocking request with teamId/userId");
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
    res.set("X-Cache", "HIT"); // Add cache header for debugging
    return res.status(status).send(body);
  }

  console.log("Cache miss for:", targetUrl);

  try {
    const proxyRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "SheetWA-Proxy/1.0",
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
        /http:\/\/main\.sheetwa\.com/g,
        "https://testmain.sheetwa.com"
      );
      body = body.replace(
        /http:\/\/blogstest\.sheetwa\.com/g,
        "https://blogstest.sheetwa.com"
      );
    }

    // Only cache successful responses and check if response is cacheable
    if (proxyRes.ok) {
      const cacheData = {
        body,
        contentType,
        status: proxyRes.status,
      };

      // Calculate response size before caching
      const responseSize = Buffer.byteLength(body, "utf8");

      // Only cache responses smaller than 10MB to prevent single large responses from evicting everything
      if (responseSize < 1 * 1024 * 1024) {
        cache.set(targetUrl, cacheData);
        console.log(
          `Cached response for ${targetUrl} (${(responseSize / 1024).toFixed(
            2
          )} KB)`
        );
      } else {
        console.log(
          `Response too large to cache: ${targetUrl} (${(
            responseSize /
            1024 /
            1024
          ).toFixed(2)} MB)`
        );
      }
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
    res.set("X-Cache", "MISS"); // Add cache header for debugging

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
  console.log(`Cache configured for ${cache.maxSize / 1024 / 1024}MB storage`);
});
