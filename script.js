// ─── Scroll reveal ───────────────────────────────────────────────────────────
const reveals = document.querySelectorAll(".reveal");

function checkReveal() {
  reveals.forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 80) {
      el.classList.add("active");
    }
  });
}
window.addEventListener("scroll", checkReveal);
checkReveal();


// ─── Dark mode ───────────────────────────────────────────────────────────────
const toggle = document.getElementById("theme-toggle");

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


// ─── Navigation active au scroll ─────────────────────────────────────────────
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("nav a");

window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 120) {
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


// ─── Menu burger mobile ───────────────────────────────────────────────────────
const burger = document.getElementById("burger");
const nav = document.getElementById("main-nav");

burger.onclick = () => {
  nav.classList.toggle("open");
  burger.textContent = nav.classList.contains("open") ? "✕" : "☰";
};

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    burger.textContent = "☰";
  });
});


// ─── Bouton retour en haut ────────────────────────────────────────────────────
const backTop = document.getElementById("back-top");

window.addEventListener("scroll", () => {
  backTop.style.opacity = window.scrollY > 400 ? "1" : "0";
  backTop.style.pointerEvents = window.scrollY > 400 ? "auto" : "none";
});

backTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });


// ─── Veille RSS ───────────────────────────────────────────────────────────────
const RSS_FEEDS = [
  {
    category: "ia",
    label: "Intelligence Artificielle",
    url: "https://corsproxy.io/?https://hnrss.org/newest?q=artificial+intelligence&count=4",
  },
  {
    category: "cyber",
    label: "Cybersécurité",
    url: "https://corsproxy.io/?https://hnrss.org/newest?q=cybersecurity&count=4",
  },
  {
    category: "dev",
    label: "Développement Web",
    url: "https://corsproxy.io/?https://hnrss.org/newest?q=web+development&count=4",
  },
];

let allArticles = [];
let activeCategory = "all";

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url);
    if (!res.ok) return [];
    const text = await res.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const items = [...xml.querySelectorAll("item")].slice(0, 4);

    return items.map(item => ({
      category: feed.category,
      label: feed.label,
      title: item.querySelector("title")?.textContent || "",
      description: item.querySelector("description")?.textContent
        ?.replace(/<[^>]*>/g, "").slice(0, 150) + "…",
      link: item.querySelector("link")?.textContent || "",
      date: item.querySelector("pubDate")?.textContent
        ? new Date(item.querySelector("pubDate").textContent).toLocaleDateString("fr-FR")
        : "",
      source: xml.querySelector("channel > title")?.textContent || "",
    }));
  } catch (err) {
    console.error("Erreur feed :", feed.url, err);
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
  const grid = document.getElementById("veille-grid");
  const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
  allArticles = results.flat().sort(() => Math.random() - 0.5);

  if (allArticles.length === 0) {
    grid.innerHTML = `<div class="veille-loading"><p>Impossible de charger les articles.</p></div>`;
    return;
  }

  renderArticles(allArticles);
}

document.querySelectorAll(".veille-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".veille-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.category;
    renderArticles(allArticles);
  });
});

initVeille();