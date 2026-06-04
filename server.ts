import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Memory cache for the Substack RSS feed to speed up loads and avoid hitting Substack rate limits
let cachedFeed: string | null = null;
let lastFetchedTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Memory cache for the Anchor.fm Podcast RSS feed
let cachedPodcastFeed: string | null = null;
let lastFetchedPodcastTime = 0;

app.get("/api/feed", async (req, res) => {
  const now = Date.now();
  if (cachedFeed && (now - lastFetchedTime < CACHE_TTL)) {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("X-Cache", "HIT");
    return res.send(cachedFeed);
  }

  try {
    const rssUrl = "https://ayushprakash.substack.com/feed";
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Substack feed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    cachedFeed = text;
    lastFetchedTime = now;
    
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("X-Cache", "MISS");
    res.send(text);
  } catch (error: any) {
    console.error("Error fetching Substack RSS feed:", error);
    if (cachedFeed) {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("X-Cache", "STALE_HIT");
      return res.send(cachedFeed);
    }
    res.status(500).json({ error: error.message || "Failed to fetch Substack RSS feed" });
  }
});

app.get("/api/podcast-feed", async (req, res) => {
  const now = Date.now();
  if (cachedPodcastFeed && (now - lastFetchedPodcastTime < CACHE_TTL)) {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("X-Cache", "HIT");
    return res.send(cachedPodcastFeed);
  }

  try {
    const rssUrl = "https://anchor.fm/s/4f9f9cb0/podcast/rss";
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Podcast feed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    cachedPodcastFeed = text;
    lastFetchedPodcastTime = now;
    
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("X-Cache", "MISS");
    res.send(text);
  } catch (error: any) {
    console.error("Error fetching Podcast RSS feed:", error);
    if (cachedPodcastFeed) {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("X-Cache", "STALE_HIT");
      return res.send(cachedPodcastFeed);
    }
    res.status(500).json({ error: error.message || "Failed to fetch Podcast RSS feed" });
  }
});

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
});
