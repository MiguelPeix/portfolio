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

// ─── Hero canvas animation ────────────────────────────────────────────────────
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");

let particles = [];

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function isLight() {
  return document.body.classList.contains("light");
}

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function createParticles() {
  particles = [];
  const count = Math.floor((canvas.width * canvas.height) / 12000);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: randomBetween(0, canvas.width),
      y: randomBetween(0, canvas.height),
      r: randomBetween(1, 3.5),
      speedX: randomBetween(-0.3, 0.3),
      speedY: randomBetween(-0.4, -0.1),
      opacity: randomBetween(0.2, 0.7),
    });
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fond dégradé radial selon le thème
  const light = isLight();
  const grad = ctx.createRadialGradient(
    canvas.width * 0.2, canvas.height * 0.2, 0,
    canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.7
  );
  if (light) {
    grad.addColorStop(0, "rgba(14,165,233,0.08)");
    grad.addColorStop(1, "rgba(248,250,252,0)");
  } else {
    grad.addColorStop(0, "rgba(56,189,248,0.12)");
    grad.addColorStop(1, "rgba(15,23,42,0)");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Particules
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = light
      ? `rgba(14,165,233,${p.opacity})`
      : `rgba(56,189,248,${p.opacity})`;
    ctx.fill();

    // Déplacement
    p.x += p.speedX;
    p.y += p.speedY;

    // Reset quand la particule sort par le haut
    if (p.y < -10) {
      p.y = canvas.height + 10;
      p.x = randomBetween(0, canvas.width);
    }
    if (p.x < -10) p.x = canvas.width + 10;
    if (p.x > canvas.width + 10) p.x = -10;
  });

  // Lignes entre particules proches
  particles.forEach((p, i) => {
    particles.slice(i + 1).forEach(p2 => {
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = light
          ? `rgba(14,165,233,${0.08 * (1 - dist / 100)})`
          : `rgba(56,189,248,${0.15 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    });
  });

  requestAnimationFrame(drawParticles);
}

resizeCanvas();
createParticles();
drawParticles();

window.addEventListener("resize", () => {
  resizeCanvas();
  createParticles();
});

// Recalcule les couleurs au changement de thème
const _origToggle = toggle.onclick;
toggle.onclick = (e) => {
  _origToggle(e);
};


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


// ─── Veille RSS — API OCDE Incidents IA ──────────────────────────────────────

let allArticles = [];
let activeCategory = "all";

function dateENtoFR(date) {
  const list = date.split('-');
  const mois = {
    "01":"Janvier","02":"Février","03":"Mars","04":"Avril",
    "05":"Mai","06":"Juin","07":"Juillet","08":"Août",
    "09":"Septembre","10":"Octobre","11":"Novembre","12":"Décembre"
  };
  return `${list[2]} ${mois[list[1]]} ${list[0]}`;
}

async function fetchOCDE(searchTerm, category, label) {
  try {
    const res = await fetch('https://incidents-server.oecdai.org/api/v1/incidents/fetch-incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        and_condition: false,
        countries: [],
        format: 'JSON',
        from_date: "1900-01-01",
        to_date: new Date().toISOString().split('T')[0],
        num_results: 4,
        order_by: 'date',
        properties_config: {
          ai_tasks: [], autonomy_levels: [], business_functions: [],
          harm_levels: [], harm_types: [], harmed_entities: [],
          industries: [], languages: [], principles: []
        },
        search_terms: searchTerm ? [{ type: "KEYWORD", value: searchTerm }] : []
      })
    });
    const data = await res.json();
    return (data.incidents || []).map(item => ({
      category,
      label,
      title: item.title || "",
      description: item.summary?.slice(0, 150) + "…" || "",
      date: item.date ? dateENtoFR(item.date) : "",
      source: "OCDE AI Incidents",
      link: `https://oecd.ai/en/incidents/${item.id}`,
      harmTypes: item.properties?.harm_types || [],
    }));
  } catch (err) {
    console.error("Erreur OCDE :", err);
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
        ${a.harmTypes.length > 0 ? `
          <div class="veille-harm">
            ${a.harmTypes.map(h => `<span class="harm-tag">${h}</span>`).join("")}
          </div>` : ""}
      </div>
      <div>
        <div class="veille-meta">${a.source} · ${a.date}</div>
        <a class="veille-link" href="${a.link}" target="_blank" rel="noopener">Voir l'incident →</a>
      </div>
    </div>
  `).join("");
}

async function initVeille() {
  const grid = document.getElementById("veille-grid");
  grid.innerHTML = `<div class="veille-loading"><p>Chargement des articles...</p></div>`;

  const [ia, cyber, dev] = await Promise.all([
    fetchOCDE("artificial intelligence", "ia", "Intelligence Artificielle"),
    fetchOCDE("cybersecurity", "cyber", "Cybersécurité"),
    fetchOCDE("software", "dev", "Développement Web"),
  ]);

  allArticles = [...ia, ...cyber, ...dev];

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