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


// ─── Veille — API OCDE ────────────────────────────────────────────────────────

function dateENtoFR(date) {
  const list = date.split('-');
  const mois = {
    "01":"Janvier","02":"Février","03":"Mars","04":"Avril",
    "05":"Mai","06":"Juin","07":"Juillet","08":"Août",
    "09":"Septembre","10":"Octobre","11":"Novembre","12":"Décembre"
  };
  return `${list[2]} ${mois[list[1]]} ${list[0]}`;
}

function getDateNow() {
  const date = new Date();
  let jour = date.getUTCDate().toString().padStart(2, "0");
  let mois = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

// Date par défaut = aujourd'hui
document.getElementById("dateSelect").value = getDateNow();

async function updateOCDE() {
  const grid = document.getElementById("veille-grid");
  const filtre = document.getElementById("filtreVeille").value.trim();
  const date = document.getElementById("dateSelect").value || getDateNow();

  grid.innerHTML = `<div class="veille-loading"><p>Chargement des articles...</p></div>`;
  document.getElementById("nbResultOCDE").textContent = "0";

  try {
    const terms = [];
    if (filtre) terms.push({ type: "KEYWORD", value: filtre });

    const res = await fetch('https://incidents-server.oecdai.org/api/v1/incidents/fetch-incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        and_condition: false,
        countries: [],
        format: 'JSON',
        from_date: "1900-01-01",
        to_date: date,
        num_results: 12,
        order_by: 'date',
        properties_config: {
          ai_tasks: [], autonomy_levels: [], business_functions: [],
          harm_levels: [], harm_types: [], harmed_entities: [],
          industries: [], languages: [], principles: []
        },
        search_terms: terms
      })
    });

    const data = await res.json();
    const articles = data.incidents || [];
    document.getElementById("nbResultOCDE").textContent = data.total_results ?? articles.length;

    if (articles.length === 0) {
      grid.innerHTML = `<div class="veille-loading"><p>Aucun article trouvé avec ces critères.</p></div>`;
      return;
    }

    grid.innerHTML = articles.map(item => {
      const harmTypes = item.properties?.harm_types || [];
      return `
        <div class="card veille-article">
          <div>
            <h3>${item.title || ""}</h3>
            <p>${(item.summary?.slice(0, 150) || "") + "…"}</p>
            ${harmTypes.length > 0 ? `
              <div class="veille-harm">
                ${harmTypes.map(h => `<span class="harm-tag">${h}</span>`).join("")}
              </div>` : ""}
          </div>
          <div>
            <div class="veille-meta">OCDE AI Incidents · ${item.date ? dateENtoFR(item.date) : ""}</div>
            <a class="veille-link" href="https://oecd.ai/en/incidents/${item.id}" target="_blank" rel="noopener">Voir l'incident →</a>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Erreur OCDE :", err);
    grid.innerHTML = `<div class="veille-loading"><p>Impossible de charger les articles.</p></div>`;
  }
}

// Bouton rechercher
document.getElementById("sendFiltreVeille").addEventListener("click", updateOCDE);

// Touche Entrée dans le champ texte
document.getElementById("filtreVeille").addEventListener("keypress", e => {
  if (e.key === "Enter") updateOCDE();
});

// Chargement initial
updateOCDE();