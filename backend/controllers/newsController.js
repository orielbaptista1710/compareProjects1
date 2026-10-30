//controllers/newsController.js
//used in PropertyGuide -- check performace 
import axios from "axios";
import NodeCache from "node-cache";
import logger from "../utils/logger.js";

const cache = new NodeCache({ stdTTL: 10800 }); // 3-hour cache
const GNEWS_TIMEOUT_MS = 5000; // axios waits forever by default
const STALE_RETRY_SECONDS = 600; // while GNews is failing, retry it every 10 min, not on every request

// Last successful article list, kept past the cache expiry. Served when GNews
// is down or the free plan's ~100 requests/day are used up, so the news
// section shows slightly older news instead of an error. One 10-item list.
let lastGoodArticles = null;

export const getRealEstateNews = async (req, res) => {
  try {
    const cachedNews = cache.get("realEstateNews");

    if (cachedNews) {
      return res.json(cachedNews);
    }

    // Fetch enough to cover:
    // index 0   → featured article (hero)
    // index 1–3 → side article cards
    // index 4+  → news grid (up to 6 cards)
    // Total: 10 articles, one single API call
    const response = await axios.get("https://gnews.io/api/v4/search", {
      params: {
        q: "real estate india OR housing india OR property market india",
        lang: "en",
        country: "in",
        max: 10,
        apikey: process.env.NEWS_API_KEY,
      },
      timeout: GNEWS_TIMEOUT_MS,
    });

    const articles = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description,
      image: article.image || null,
      date: article.publishedAt,
      url: article.url,
      source: article.source?.name || null,
    }));

    cache.set("realEstateNews", articles);
    lastGoodArticles = articles;

    res.json(articles);
  } catch (error) {
    // Message and status only: the full axios error includes the request URL,
    // which carries the GNews API key.
    logger.error("News API error", { message: error.message, status: error.response?.status });

    if (lastGoodArticles) {
      cache.set("realEstateNews", lastGoodArticles, STALE_RETRY_SECONDS);
      return res.json(lastGoodArticles);
    }
    res.status(500).json({ message: "Failed to fetch news" });
  }
};