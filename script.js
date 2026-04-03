// ─── Scroll reveal (fix : déclencher aussi au chargement) ───────────────────
const reveals = document.querySelectorAll(".reveal");

function checkReveal() {
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 80) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", checkReveal);
checkReveal(); // ← correction clé : la hero section s'affiche dès le chargement


// ─── Dark mode ──────────────────────────────────────────────────────────────
const toggle = document.getElementById("theme-toggle");

// Sauvegarde la préférence
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
  toggle.textContent = "☀️";
}

toggle.onclick = () => {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  toggle.textContent = isLight ? "☀️" : "🌙";
  localStorage.setItem("theme", isLight ? "light" : "dark");
};


// ─── Navigation active au scroll ────────────────────────────────────────────
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("nav a");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    const top = section.offsetTop - 120;
    if (window.scrollY >= top) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${current}`) {
      link.classList.add("active");
    }
  });
});


// ─── Menu burger mobile ─────────────────────────────────────────────────────
const burger = document.getElementById("burger");
const nav = document.getElementById("main-nav");

burger.onclick = () => {
  nav.classList.toggle("open");
  burger.textContent = nav.classList.contains("open") ? "✕" : "☰";
};

// Ferme le menu quand on clique sur un lien
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    burger.textContent = "☰";
  });
});


// ─── Bouton retour en haut ───────────────────────────────────────────────────
const backTop = document.getElementById("back-top");

window.addEventListener("scroll", () => {
  backTop.style.opacity = window.scrollY > 400 ? "1" : "0";
  backTop.style.pointerEvents = window.scrollY > 400 ? "auto" : "none";
});

backTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

// ─── Veille RSS ──────────────────────────────────────────────────────────────

const RSS_FEEDS = [
  {
    category: "ia",
    label: "Intelligence Artificielle",
    url: "https://rss.app/feeds/tOgNdRe2q5lJXEoY.xml", // MIT AI News
  },
  {
    category: "ia",
    label: "Intelligence Artificielle",
    url: "https://rss.app/feeds/vQxaZlZH3B4TrG5A.xml", // The Verge AI
  },
  {
    category: "cyber",
    label: "Cybersécurité",
    url: "https://rss.app/feeds/9Qz8Wk3LpYmXnE1R.xml", // Krebs on Security
  },
  {
    category: "cyber",
    label: "Cybersécurité",
    url: "https://rss.app/feeds/Hv7TmNqYjKpLsC2X.xml", // The Hacker News
  },
  {
    category: "dev",
    label: "Développement Web",
    url: "https://rss.app/feeds/uB6kPnWmZqYjEsL4.xml", // CSS-Tricks
  },
  {
    category: "dev",
    label: "Développement Web",
    url: "https://rss.app/feeds/xR3nMvTqKpYjWsL8.xml", // Smashing Magazine
  },
];

// On utilise rss2json qui contourne le CORS
const API = "https://api.rss2json.com/v1/api.json?rss_url=";

let allArticles = [];
let activeCategory = "all";

async function fetchFeed(feed) {
  try {
    const res = await fetch(`${API}${encodeURIComponent(feed.url)}&count=3`);
    const data = await res.json();
    if (data.status !== "ok") return [];
    return data.items.map(item => ({
      category: feed.category,
      label: feed.label,
      title: item.title,
      description: item.description?.replace(/<[^>]*>/g, "").slice(0, 150) + "…",
      link: item.link,
      date: item.pubDate ? new Date(item.pubDate).toLocaleDateString("fr-FR") : "",
      source: data.feed?.title || "",
    }));
  } catch {
    return [];
  }
}

function renderArticles(articles) {
  const grid = document.getElementById("veille-grid");
  const filtered = activeCategory === "all"
    ? articles
    : articles.filter(a => a.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="veille-loading"><p>Aucun article disponible.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(a => `
    <div class="card veille-article" data-category="${a.category}">
      <div>
        <span class="badge badge-${a.category}">${a.label}</span>
        <h3>${a.title}</h3>
        <p>${a.description}</p>
      </div>
      <div>
        <div class="veille-meta">${a.source} · ${a.date}</div>
        <a class="veille-link" href="${a.link}" target="_blank" rel="noopener">Lire l'article →</a>
      </div>
    </div>
  `).join("");
}

async function initVeille() {
  const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
  allArticles = results.flat().sort(() => Math.random() - 0.5);
  renderArticles(allArticles);
}

// Filtres
document.querySelectorAll(".veille-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".veille-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    renderArticles(allArticles);
  });
});

initVeille();