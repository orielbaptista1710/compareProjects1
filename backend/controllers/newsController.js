import axios from "axios";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 10800 }); // 3-hour cache

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
        max: 15,
        apikey: process.env.NEWS_API_KEY,
      },
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

    res.json(articles);
  } catch (error) {
    console.error("News API error:", error.message);
    res.status(500).json({ message: "Failed to fetch news" });
  }
};