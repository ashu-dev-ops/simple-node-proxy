// const express = require("express");
// const fetch = require("node-fetch"); // npm install node-fetch@2
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

// app.use(async (req, res) => {
//   const originalUrl = new URL(
//     `${req.protocol}://${req.get("host")}${req.originalUrl}`
//   );
//   let path = originalUrl.pathname;

//   if (!path.endsWith("/")) {
//     originalUrl.pathname = `${path}/`;
//     return res.redirect(301, originalUrl.toString());
//   }

//   if (redirectMap[path]) {
//     return res.redirect(301, redirectMap[path]);
//   }

//   //   if (path === "/blogs/index.txt/") {
//   //     return res.redirect(301, "/blogs/");
//   //   }
//   const indexTxtRegex = /\/index\.txt\/?$/;

//   if (indexTxtRegex.test(path)) {
//     const cleanedPath = path.replace(indexTxtRegex, "");
//     originalUrl.pathname = cleanedPath;
//     return res.redirect(301, originalUrl.toString());
//   }
//   if (
//     path.startsWith("/blogs") &&
//     (originalUrl.searchParams.has("teamId") ||
//       originalUrl.searchParams.has("userId"))
//   ) {
//     return res.status(404).send("Not Found");
//   }

//   const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");
//   const isBlogsPath = path === "/blogs/" || path.startsWith("/blogs/");
//   const targetUrl = isBlogsPath
//     ? `https://sheetwa22.getpowerblog.com${proxyPath}${originalUrl.search}`
//     : `https://test.sheetwa.com${originalUrl.pathname}${originalUrl.search}`;

//   try {
//     const proxyRes = await fetch(targetUrl, {
//       headers: {
//         "User-Agent": req.headers["user-agent"] || "",
//       },
//     });

//     const contentType = proxyRes.headers.get("content-type") || "text/html";
//     let body = await proxyRes.text();

//     // More comprehensive URL replacement to fix mixed content issues
//     const currentDomain = `${req.protocol}://${req.get("host")}`;

//     body = body
//       // Replace any HTTP references to the blog domain
//       .replace(/http:\/\/sheetwa22\.getpowerblog\.com/g, currentDomain)
//       // Replace any HTTP references to your proxy domain
//       .replace(
//         /http:\/\/simple-node-proxy-up64\.onrender\.com/g,
//         "https://simple-node-proxy-up64.onrender.com"
//       )
//       // Replace any HTTP references to the main domain (for root content)
//       .replace(/http:\/\/sheetwa\.com/g, currentDomain)
//       // Catch any remaining HTTP references to your current domain
//       .replace(new RegExp(`http://${req.get("host")}`, "g"), currentDomain);

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

const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
const app = express();

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for HTML
const STATIC_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for static assets

// Request limiting
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 10;

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

// Helper function to check if content type is HTML
function isHtmlContent(contentType) {
  return contentType && contentType.includes("text/html");
}

// Helper function to check if content is static asset
function isStaticAsset(path) {
  return /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(path);
}

// Helper function to get cache key
function getCacheKey(url) {
  return url;
}

// Helper function to check cache
function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.duration) {
    return cached;
  }
  cache.delete(key);
  return null;
}

// Helper function to set cache
function setCache(key, data, contentType) {
  const duration = isStaticAsset(key) ? STATIC_CACHE_DURATION : CACHE_DURATION;
  cache.set(key, {
    ...data,
    timestamp: Date.now(),
    duration,
  });
}

app.use(async (req, res) => {
  // Check concurrent request limit
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return res.status(503).send("Service temporarily unavailable");
  }

  activeRequests++;

  try {
    const originalUrl = new URL(
      `${req.protocol}://${req.get("host")}${req.originalUrl}`
    );
    let path = originalUrl.pathname;

    // Add trailing slash redirect
    if (!path.endsWith("/") && !isStaticAsset(path)) {
      originalUrl.pathname = `${path}/`;
      return res.redirect(301, originalUrl.toString());
    }

    // Handle redirects
    if (redirectMap[path]) {
      return res.redirect(301, redirectMap[path]);
    }

    // Handle index.txt redirects
    const indexTxtRegex = /\/index\.txt\/?$/;
    if (indexTxtRegex.test(path)) {
      const cleanedPath = path.replace(indexTxtRegex, "");
      originalUrl.pathname = cleanedPath;
      return res.redirect(301, originalUrl.toString());
    }

    // Handle blogs with query params
    if (
      path.startsWith("/blogs") &&
      (originalUrl.searchParams.has("teamId") ||
        originalUrl.searchParams.has("userId"))
    ) {
      return res.status(404).send("Not Found");
    }

    // Determine target URL
    const proxyPath = path === "/blogs/" ? "" : path.replace(/^\/blogs/, "");
    const isBlogsPath = path === "/blogs/" || path.startsWith("/blogs/");
    const targetUrl = isBlogsPath
      ? `https://blogstest.sheetwa.com${proxyPath}${originalUrl.search}`
      : `https://frabjous-strudel-679542.netlify.app${originalUrl.pathname}${originalUrl.search}`;

    // Check cache first
    const cacheKey = getCacheKey(targetUrl);
    const cached = getFromCache(cacheKey);

    if (cached) {
      res.set("Content-Type", cached.contentType);
      // Forward cached headers
      if (cached.headers) {
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.set(key, value);
        });
      }
      return res.status(cached.status).send(cached.body);
    }

    // Forward essential headers
    const forwardHeaders = {
      "User-Agent": req.headers["user-agent"] || "",
      Accept: req.headers["accept"] || "*/*",
      "Accept-Encoding": req.headers["accept-encoding"] || "",
      Referer: req.headers["referer"] || "",
    };

    // Remove empty headers
    Object.keys(forwardHeaders).forEach((key) => {
      if (!forwardHeaders[key]) delete forwardHeaders[key];
    });

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const proxyRes = await fetch(targetUrl, {
      headers: forwardHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = proxyRes.headers.get("content-type") || "text/html";
    let body = await proxyRes.text();

    // Only do string replacement for HTML content
    if (isHtmlContent(contentType)) {
      const currentDomain = `${req.protocol}://${req.get("host")}`;

      body = body
        // Fix existing replacements
        .replace(/http:\/\/sheetwa22\.getpowerblog\.com/g, currentDomain)
        .replace(
          /http:\/\/simple-node-proxy-up64\.onrender\.com/g,
          "https://simple-node-proxy-up64.onrender.com"
        )
        .replace(/http:\/\/sheetwa\.com/g, currentDomain)
        .replace(new RegExp(`http://${req.get("host")}`, "g"), currentDomain)

        // Fix the main issue: convert HTTP blogstest.sheetwa.com to HTTPS
        .replace(
          /http:\/\/blogstest\.sheetwa\.com/g,
          "https://blogstest.sheetwa.com"
        )

        // Fix any remaining HTTP references that should be HTTPS
        .replace(/src="http:\/\//g, 'src="https://')
        .replace(/href="http:\/\//g, 'href="https://')
        .replace(/url\("http:\/\//g, 'url("https://')
        .replace(/url\('http:\/\//g, "url('https://")

        // Fix specific cases for fonts, CSS, and other assets
        .replace(
          /"http:\/\/([^"]*\.(woff2?|ttf|eot|otf|css|js))"/g,
          '"https://$1"'
        )
        .replace(
          /'http:\/\/([^']*\.(woff2?|ttf|eot|otf|css|js))'/g,
          "'https://$1'"
        );
    }

    // Preserve important response headers
    const headersToForward = {};
    const importantHeaders = [
      "cache-control",
      "etag",
      "expires",
      "last-modified",
    ];
    importantHeaders.forEach((header) => {
      const value = proxyRes.headers.get(header);
      if (value) headersToForward[header] = value;
    });

    // Cache the response
    setCache(
      cacheKey,
      {
        body,
        status: proxyRes.status,
        contentType,
        headers: headersToForward,
      },
      contentType
    );

    // Set response headers
    res.set("Content-Type", contentType);
    Object.entries(headersToForward).forEach(([key, value]) => {
      res.set(key, value);
    });

    res.status(proxyRes.status).send(body);
  } catch (err) {
    console.error("Proxy failed:", err);
    if (err.name === "AbortError") {
      res.status(504).send("Gateway Timeout");
    } else {
      res.status(500).send("Proxy Error");
    }
  } finally {
    activeRequests--;
  }
});

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.duration) {
      cache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Clean every 10 minutes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Improved proxy server running on port ${PORT}`);
  console.log(`Cache cleanup running every 10 minutes`);
  console.log(`Max concurrent requests: ${MAX_CONCURRENT_REQUESTS}`);
});