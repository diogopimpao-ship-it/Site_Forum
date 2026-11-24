/* Código partilhado por todas as páginas: cabeçalho, rodapé, ícones, animações e utilitários. */
(function () {
  const C = window.FM_CONFIG;
  const WIX = "https://static.wixstatic.com/media/";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Só aceita ligações http(s)/mailto vindas de dados externos
  const safeUrl = (u) => (/^(https?:|mailto:)/i.test(String(u || "").trim()) ? String(u).trim() : "");
  // Imagens alojadas no Wix: aceita id ("cafc0e_...~mv2.png") ou URL completo; w/h pedem uma versão redimensionada
  const img = (id, w, h) => {
    if (!id) return "";
    if (/^https?:/.test(id)) return id;
    if (!w) return WIX + id;
    const ext = id.split(".").pop();
    return `${WIX}${id}/v1/fill/w_${w},h_${h || w},al_c,q_80/i.${ext}`;
  };
  const json = (path) => fetch(path).then((r) => { if (!r.ok) throw new Error(path + " " + r.status); return r.json(); });
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  /* Ícones de traço (24×24). Uso: ICON.nome */
  const S = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
  const ICON = {
    arrowL: S('<path d="M15 5l-7 7 7 7"/>'),
    arrowR: S('<path d="M9 5l7 7-7 7"/>'),
    arrow: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    back: S('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    up: S('<path d="M7 17L17 7M8 7h9v9"/>'),
    search: S('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    close: S('<path d="M6 6l12 12M18 6L6 18"/>'),
    menu: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    download: S('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
    folder: S('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    users: S('<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c.600-3.400 3.200-5.500 6.500-5.500s5.900 2.100 6.500 5.500"/><circle cx="17.500" cy="9" r="2.500"/><path d="M17.500 14c2.300.200 3.700 1.800 4 4.500"/>'),
    doc: S('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    mail: S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 6l8 7 8-7"/>'),
    pin: S('<path d="M12 21s7-6.200 7-11.500A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>'),
    instagram: S('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.500" cy="6.500" r=".600" fill="currentColor"/>'),
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.940 8.500H3.560V20h3.380zM5.250 4a1.960 1.960 0 1 0 0 3.920A1.960 1.960 0 0 0 5.250 4zM20.440 20h-3.370v-5.600c0-1.340-.030-3.060-1.870-3.060-1.870 0-2.160 1.460-2.160 2.960V20H9.680V8.500h3.240v1.570h.050c.450-.850 1.560-1.750 3.200-1.750 3.420 0 4.050 2.250 4.050 5.180z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.500 3c.300 2.100 1.600 3.600 3.700 3.800v3c-1.300.100-2.600-.300-3.700-1v6.100c0 3.300-2.500 5.600-5.600 5.600-3 0-5.400-2.400-5.400-5.400 0-3.200 2.700-5.700 6.100-5.300v3.100c-1.500-.400-3 .600-3 2.200 0 1.300 1 2.300 2.300 2.300 1.400 0 2.400-1 2.400-2.700V3z"/></svg>',
    spotify: S('<circle cx="12" cy="12" r="9"/><path d="M7.500 9.800c3.200-.900 6.500-.600 9.300 1M8.200 13c2.500-.700 5-.400 7.200.800M9 15.900c1.800-.400 3.500-.200 5 .700"/>'),
  };

  /* ---------- Cabeçalho ---------- */
  const NAV = [
    ["index.html", "Início"], ["equipa.html", "Equipa"], ["mecanist.html", "MecanIST XV"],
    ["oportunidades.html", "Oportunidades"], ["drive.html", "Drive"],
  ];
  function header() {
    const here = location.pathname.split("/").pop() || "index.html";
    const cur = here.includes(".") ? here : here + ".html";
    const el = document.getElementById("site-header");
    if (!el) return;
    el.className = "site-header dark";
    el.innerHTML = `<a class="skip" href="#main">Ir para o conteúdo principal</a>
      <div class="shell">
        <a class="brand" href="index.html" aria-label="Fórum Mecânica — início">
          <img src="${WIX}cafc0e_69063a6dc76e4cad97d2abdb1eff56f1~mv2.png/v1/crop/x_0,y_1174,w_2550,h_919/fill/w_296,h_102,al_c,q_85/logo.png" alt="Fórum Mecânica" width="148" height="51">
        </a>
        <nav class="nav" id="nav" aria-label="Principal">
          ${NAV.map(([h, t]) => `<a href="${h}"${h === cur ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
        </nav>
        <a class="btn btn-sm btn-ghost head-cta" href="mailto:${C.email}">Contactar</a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="nav" aria-label="Menu">${ICON.menu}</button>
      </div>
      <div class="scroll-progress" aria-hidden="true"></div>`;
    const btn = el.querySelector(".nav-toggle"), nav = el.querySelector(".nav");
    btn.addEventListener("click", () => btn.setAttribute("aria-expanded", String(nav.classList.toggle("is-open"))));
    const stuck = () => el.classList.toggle("is-stuck", scrollY > 8);
    addEventListener("scroll", stuck, { passive: true });
    stuck();
  }

  /* ---------- Rodapé ---------- */
  function footer() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer dark";
    const s = C.social;
    el.innerHTML = `<div class="shell">
      <div class="ft-top">
        <div class="ft-brand">
          <img src="${WIX}cafc0e_69063a6dc76e4cad97d2abdb1eff56f1~mv2.png/v1/crop/x_0,y_1174,w_2550,h_919/fill/w_296,h_102,al_c,q_85/logo.png" alt="Fórum Mecânica" width="148" height="51" loading="lazy">
          <p>NEMIST – Núcleo de Estudantes de Engenharia Mecânica do Instituto Superior Técnico. A casa dos estudantes de Engenharia Mecânica no Técnico.</p>
          <div class="ft-social" aria-label="Redes sociais">
            <a href="${s.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICON.instagram}</a>
            <a href="${s.tiktok}" target="_blank" rel="noopener" aria-label="TikTok">${ICON.tiktok}</a>
            <a href="${s.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON.linkedin}</a>
            <a href="${s.spotify}" target="_blank" rel="noopener" aria-label="Spotify">${ICON.spotify}</a>
          </div>
        </div>
        <div>
          <h3>Navegação</h3>
          <ul class="ft-list">${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul>
        </div>
        <div>
          <h3>Documentos</h3>
          <ul class="ft-list">
            <li><a href="${C.docs.informacoes}" target="_blank" rel="noopener">Informações gerais</a></li>
            <li><a href="${C.docs.regulamento}" target="_blank" rel="noopener">Regulamento interno</a></li>
          </ul>
        </div>
        <div>
          <h3>Contacto</h3>
          <ul class="ft-list ft-contact">
            <li>${ICON.mail}<a href="mailto:${C.email}">${C.email}</a></li>
            <li>${ICON.pin}<span>Instituto Superior Técnico — Campus Alameda<br>Av. Rovisco Pais, 1 · 1049-001 Lisboa</span></li>
          </ul>
        </div>
      </div>
      <div class="ft-bottom">
        <span>© ${new Date().getFullYear()} Fórum Mecânica · NEMIST · Associação sem fins lucrativos · NIPC 513006370</span>
        <a class="ft-ist" href="https://tecnico.ulisboa.pt/" target="_blank" rel="noopener"><img src="${WIX}cafc0e_9a52c2787db943ae9bcf4c0ef14ad396~mv2.png" alt="Instituto Superior Técnico" loading="lazy"></a>
      </div>
    </div>`;
  }

  /* ---------- Carrossel horizontal ("cards rolantes") ----------
     rail(titleHtml, cardsHtml[]) devolve um elemento com setas, arrasto com o rato e scroll-snap. */
  function rail(titleHtml, cards) {
    const wrap = document.createElement("section");
    wrap.className = "rail";
    wrap.innerHTML = `<div class="rail-head">${titleHtml}
        <div class="rail-nav">
          <button class="rail-btn" data-dir="-1" aria-label="Anterior">${ICON.arrowL}</button>
          <button class="rail-btn" data-dir="1" aria-label="Seguinte">${ICON.arrowR}</button>
        </div></div>
      <div class="rail-track" tabindex="0">${cards.join("")}</div>`;
    const track = wrap.querySelector(".rail-track");
    const [prev, next] = wrap.querySelectorAll(".rail-btn");
    const step = () => Math.max(260, track.clientWidth * 0.8);
    const sync = () => {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
      wrap.classList.toggle("no-scroll", prev.disabled && next.disabled);
    };
    wrap.querySelectorAll(".rail-btn").forEach((b) => b.addEventListener("click", () => track.scrollBy({ left: step() * Number(b.dataset.dir), behavior: "smooth" })));
    track.addEventListener("scroll", sync, { passive: true });
    new ResizeObserver(sync).observe(track);
    // arrastar com o rato
    let down = false, startX = 0, startL = 0, moved = false;
    track.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; startX = e.clientX; startL = track.scrollLeft; });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; track.classList.add("is-dragging"); }
      if (moved) track.scrollLeft = startL - dx;
    });
    addEventListener("pointerup", () => { down = false; track.classList.remove("is-dragging"); });
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener("dragstart", (e) => e.preventDefault());
    requestAnimationFrame(sync);
    return wrap;
  }

  /* ---------- Membros (Supabase → GitHub) ---------- */
  async function loadMembers() {
    const m = C.members;
    if (m.supabaseUrl && m.supabaseAnonKey) {
      try {
        const r = await fetch(`${m.supabaseUrl.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(m.table)}?select=*`, {
          headers: { apikey: m.supabaseAnonKey, Authorization: "Bearer " + m.supabaseAnonKey },
        });
        if (!r.ok) throw new Error("Supabase " + r.status);
        const rows = await r.json();
        if (Array.isArray(rows) && rows.length) return rows;
      } catch (e) { console.warn("Membros: Supabase falhou, a usar o ficheiro de reserva.", e); }
    }
    return json(m.fallbackUrl);
  }

  /* ---------- Animações (GSAP + ScrollTrigger) ----------
     O <head> põe a classe "anim" no <html> (esconde [data-hero], [data-reveal] e [data-split] até animarem).
     Se o GSAP não carregar ou o utilizador preferir menos movimento, nada fica escondido. */
  const root = document.documentElement;
  let stalled = false; // o browser não está a desenhar frames (ver salvaguarda no fim de motion())
  const animOn = () => !stalled && !!window.gsap && root.classList.contains("anim");

  // Parte um título em palavras para as fazer "subir" uma a uma (mantém <em> e outros elementos)
  function splitWords(el) {
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement("span"), i = document.createElement("span");
          w.className = "w"; i.className = "wi"; i.textContent = part;
          w.append(i); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n);
    });
    return el.querySelectorAll(".wi");
  }

  // Entrada em cascata de elementos criados depois de a página carregar (cards, membros…)
  function pop(els, opts = {}) {
    els = [...(els || [])].filter(Boolean);
    if (!els.length || !animOn()) return;
    gsap.from(els, {
      opacity: 0, y: 26, duration: 0.7, ease: "power3.out", stagger: 0.06, clearProps: "opacity,transform", ...opts,
      scrollTrigger: opts.scrollTrigger === false ? undefined : { trigger: els[0], start: "top 92%", once: true },
    });
  }

  function motion() {
    if (!animOn()) { root.classList.remove("anim"); return; }
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out" });

    // Barra de progresso de leitura no cabeçalho
    gsap.to(".scroll-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    // Abertura: palavras do título + restantes elementos marcados com data-hero
    const intro = gsap.timeline({ delay: 0.05 });
    document.querySelectorAll("[data-split]").forEach((h) => {
      const words = splitWords(h);
      gsap.set(h, { opacity: 1 });
      intro.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.045, ease: "power4.out" }, 0.1);
    });
    const hero = gsap.utils.toArray("[data-hero]");
    if (hero.length) intro.fromTo(hero, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0);
    const heroImg = document.querySelector("[data-hero-img]");
    if (heroImg) intro.fromTo(heroImg, { opacity: 0, scale: 1.08, clipPath: "inset(8% 8% 8% 8% round 22px)" }, { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.3, ease: "expo.out", clearProps: "clipPath" }, 0.15);

    // Secções: entram em cascata quando aparecem no ecrã
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%", once: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, overwrite: true }),
    });

    // Números que contam até ao valor final (data-count; o valor pode mudar depois, ex.: membros)
    document.querySelectorAll("[data-count]").forEach((el) => {
      const from = Number(el.dataset.from || 0), pre = el.dataset.prefix || "", st = { p: 0 };
      el.textContent = pre + from;
      gsap.to(st, {
        p: 1, duration: 1.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: () => { el.textContent = pre + Math.round(from + (Number(el.dataset.count) - from) * st.p); },
      });
    });

    // Parallax suave em imagens (data-parallax = deslocação em px)
    document.querySelectorAll("[data-parallax]").forEach((el) => {
      const d = Number(el.dataset.parallax) || 40;
      gsap.fromTo(el, { y: d }, { y: -d, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    // Fundo do topo do MecanIST: desloca-se com o scroll
    const mx = document.querySelector(".mx-hero");
    if (mx) gsap.fromTo(mx, { "--bgy": "35%" }, { "--bgy": "75%", ease: "none", scrollTrigger: { trigger: mx, start: "top top", end: "bottom top", scrub: true } });

    // as imagens e os dados carregados depois mudam a altura da página
    addEventListener("load", () => ScrollTrigger.refresh());

    // Salvaguarda: se a página está visível mas o browser não desenha frames (algumas pré-visualizações,
    // poupança de energia…), as animações nunca avançariam e o conteúdo ficava escondido. Mostra tudo.
    setTimeout(function check() {
      if (gsap.ticker.frame > 2) return;
      if (document.visibilityState !== "visible") { setTimeout(check, 1000); return; } // separador em segundo plano: espera
      stalled = true;
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.scrub) t.kill(true); // parallax/progresso: volta ao estado normal
        else { if (t.animation) t.animation.progress(1); t.kill(); }
      });
      // 2 passagens: completar a 1.ª pode criar animações novas (as revelações agrupadas usam um atraso)
      for (let i = 0; i < 2; i++) gsap.globalTimeline.getChildren(true, true, false).forEach((t) => t.progress(1));
      const marked = "[data-reveal],[data-hero],[data-split],[data-hero-img]";
      gsap.killTweensOf(marked);
      gsap.set(marked, { clearProps: "opacity,transform" });
      root.classList.remove("anim");
    }, 3000);
  }

  /* ---------- Brilho que segue o rato nos cartões (.lift, .dept-card) ---------- */
  function spotlight() {
    if (!matchMedia("(hover: hover)").matches) return;
    document.addEventListener("pointermove", (e) => {
      const c = e.target.closest && e.target.closest(".lift, .dept-card");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", `${e.clientX - r.left}px`);
      c.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  window.FM = { C, esc, safeUrl, img, json, norm, ICON, rail, loadMembers, pop, animOn };
  header(); footer(); motion(); spotlight();
})();
