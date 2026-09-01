const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// Minimal .env loader (no dependency): needed to call TMDB from Node when
// proxying requests for the browser (see proxyTmdbThroughNode below).
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const BASE_URL = "http://localhost:8080";
const OUT_DIR = path.join(__dirname, "..", "assets", "store", "screenshots");
const VIEWPORT = { width: 1080, height: 2220 };

// Watchlist pré-remplie (mêmes clés que src/services/storage.ts) pour avoir
// des captures parlantes plutôt que des états vides.
const SEED_WATCHLIST = [
  {
    id: 693134,
    mediaType: "movie",
    title: "Dune : Deuxième Partie",
    posterPath: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    overview: "",
    releaseDate: "2024-02-27",
    status: "watched",
    rating: 5,
    addedAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: 1396,
    mediaType: "tv",
    title: "Breaking Bad",
    posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    overview: "",
    releaseDate: "2008-01-20",
    status: "watching",
    rating: 0,
    addedAt: "2026-08-25T10:00:00.000Z",
  },
  {
    id: 947571,
    mediaType: "movie",
    title: "A Minecraft Movie",
    posterPath: "/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
    overview: "",
    releaseDate: "2025-03-31",
    status: "to_watch",
    rating: 0,
    addedAt: "2026-08-28T10:00:00.000Z",
  },
  {
    id: 129,
    mediaType: "movie",
    title: "Le Voyage de Chihiro",
    posterPath: "/xRoIzZR2eqjuBHnLTdEsCJcJfXG.jpg",
    overview: "",
    releaseDate: "2001-07-20",
    status: "watched",
    rating: 5,
    addedAt: "2026-08-15T10:00:00.000Z",
  },
  {
    id: 94605,
    mediaType: "tv",
    title: "Arcane",
    posterPath: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    overview: "",
    releaseDate: "2021-11-06",
    status: "to_watch",
    rating: 0,
    addedAt: "2026-08-30T10:00:00.000Z",
  },
];

async function seed(page) {
  await page.addInitScript((data) => {
    window.localStorage.setItem("@cinelog/watchlist", JSON.stringify(data));
  }, SEED_WATCHLIST);
}

async function fixHeight(page) {
  await page.addStyleTag({
    content: "html, body, #root, #root > div { height: 100%; }",
  });
}

// Chromium's own HTTPS requests through the sandbox proxy hang for
// external hosts (api.themoviedb.org / image.tmdb.org), even though plain
// Node fetch works fine. So intercept those requests and fulfill them
// ourselves using Node's fetch instead of letting the browser make them.
async function proxyTmdbThroughNode(page) {
  await page.route("https://api.themoviedb.org/**", async (route) => {
    try {
      const res = await fetch(route.request().url(), {
        headers: { Authorization: `Bearer ${process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN}`, accept: "application/json" },
      });
      const body = await res.text();
      await route.fulfill({ status: res.status, contentType: "application/json", body });
    } catch (err) {
      await route.abort();
    }
  });

  await page.route("https://image.tmdb.org/**", async (route) => {
    try {
      const res = await fetch(route.request().url());
      const buf = Buffer.from(await res.arrayBuffer());
      await route.fulfill({
        status: res.status,
        contentType: res.headers.get("content-type") || "image/jpeg",
        body: buf,
      });
    } catch (err) {
      await route.abort();
    }
  });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    proxy: process.env.HTTPS_PROXY
      ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" }
      : undefined,
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  // 1) Accueil / Ma liste (peuplée)
  {
    const page = await context.newPage();
    await proxyTmdbThroughNode(page);
    await seed(page);
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await fixHeight(page);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, "1-ma-liste.png") });
    await page.close();
  }

  // 2) Recherche (résultats réels TMDB)
  {
    const page = await context.newPage();
    await proxyTmdbThroughNode(page);
    await seed(page);
    await page.goto(`${BASE_URL}/search`, { waitUntil: "networkidle" });
    await fixHeight(page);
    await page.getByPlaceholder(/titre d'un film/i).fill("dune");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, "2-recherche.png") });
    await page.close();
  }

  // 3) Fiche détail
  {
    const page = await context.newPage();
    await proxyTmdbThroughNode(page);
    await seed(page);
    await page.goto(`${BASE_URL}/details/movie/693134`, { waitUntil: "networkidle" });
    await fixHeight(page);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT_DIR, "3-details.png") });
    await page.close();
  }

  // 4) Filtre "Vu"
  {
    const page = await context.newPage();
    await proxyTmdbThroughNode(page);
    await seed(page);
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await fixHeight(page);
    await page.waitForTimeout(500);
    await page.getByText("Vu", { exact: true }).first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT_DIR, "4-filtre-vu.png") });
    await page.close();
  }

  await browser.close();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
