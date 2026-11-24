/* Lógica de cada página. A página ativa é indicada por <body data-page="...">. */
(function () {
  const { C, esc, safeUrl, img, json, norm, ICON, rail, loadMembers, pop, animOn } = window.FM;
  const $ = (id) => document.getElementById(id);

  /* Grupo de chips de seleção única. items: [{id,label,count?}] */
  function chips(el, items, active, onChange) {
    el.innerHTML = items.map((i) => `<button class="chip" type="button" data-id="${esc(i.id)}" aria-pressed="${i.id === active}">${esc(i.label)}${i.count != null ? `<small>${i.count}</small>` : ""}</button>`).join("");
    el.onclick = (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      el.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      onChange(b.dataset.id);
    };
  }
  const fail = (el, what) => { el.innerHTML = `<p class="empty"><b>Não foi possível carregar ${what}.</b>Tenta novamente mais tarde.</p>`; };
  // logótipos PNG/JPG do Wix: pedir versão reduzida em vez do original (os SVG ficam como estão)
  const safeLogo = (u) => { const s = safeUrl(u); return /\/media\/[^/]+$/.test(s) ? `${s}/v1/fit/w_400,h_260,al_c,q_85/logo.${s.split(".").pop()}` : s; };

  const PAGES = {
    /* ================= INÍCIO ================= */
    home() {
      $("igFollow").href = C.social.instagram;
      loadMembers().then((m) => { const el = $("statMembers"); el.dataset.count = m.length; if (!animOn()) el.textContent = m.length; }).catch(() => {});

      // Empresas do MecanIST em faixa contínua
      json("data/mecanist-empresas.json").then((d) => {
        // sem loading="lazy": numa faixa em movimento os logótipos entrariam em branco
        const tiles = d.empresas.map((e) => `<div><img decoding="async" fetchpriority="low" src="${esc(safeLogo(e.logo))}" alt=""></div>`).join("");
        $("logoMarquee").innerHTML = tiles + tiles; // duplicado para o movimento não ter emenda
      }).catch(() => { $("marquee").hidden = true; });

      const feed = $("igFeed");
      const card = ({ href, image, badge, title, text }) => `<a class="card lift ncard" href="${esc(safeUrl(href) || C.social.instagram)}" target="_blank" rel="noopener">
            <span class="ncard-img"><img loading="lazy" draggable="false" src="${esc(image)}" alt=""></span>
            <span class="ncard-body">
              ${badge ? `<span class="badge" style="align-self:flex-start">${esc(badge)}</span>` : ""}
              <h3>${esc(title)}</h3>
              ${text ? `<span class="ncard-text">${esc(text)}</span>` : ""}
              <span class="ncard-foot">Ver no Instagram ${ICON.up}</span>
            </span></a>`;
      const show = (items) => {
        const r = rail(`<h3>Últimas publicações</h3>`, items.map(card));
        feed.append(r);
        pop(r.querySelectorAll(".ncard"));
      };
      const TYPE = { VIDEO: "Vídeo", CAROUSEL_ALBUM: "Galeria", IMAGE: "Publicação" };
      const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
      const day = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`; };
      // 1.º o Instagram ao vivo (função do Netlify); se não houver, as publicações guardadas em data/noticias.json
      json(C.instagram.endpoint).then((d) => {
        const posts = (d.posts || []).filter((p) => safeUrl(p.image));
        if (!posts.length) throw new Error("sem publicações");
        show(posts.map((p) => {
          const [first = "", ...rest] = String(p.caption || "").trim().split(/\n+/);
          return {
            href: p.url, image: safeUrl(p.image),
            badge: [TYPE[p.type] || "Publicação", p.date && day(p.date)].filter(Boolean).join(" · "),
            title: first.length > 90 ? first.slice(0, 88).trimEnd() + "…" : first || "Publicação no Instagram",
            text: rest.join("\n"),
          };
        }));
      }).catch(() => json("data/noticias.json").then((news) => show(news.slice(0, 10).map((n) => ({
        href: n.instagram, image: img(n.img, 560), badge: n.tag, title: n.title, text: n.text,
      }))))).catch(() => fail(feed, "as publicações"));
    },

    /* ================= EQUIPA (cartões por pelouro + pop-up com os membros) ================= */
    equipa() {
      const orgEl = $("tmOrgaos"), pelEl = $("tmPelouros");
      const BG = (id) => `https://static.wixstatic.com/media/${id}/v1/fill/w_900,h_600,al_c,q_80/pelouro.jpg`;
      const GROUPS = [
        { id: "direcao", label: "Direção", kind: "Órgão social" },
        { id: "CFD", label: "Conselho Fiscal e Disciplinar", short: "CFD", kind: "Órgão social" },
        { id: "MAG", label: "Mesa da Assembleia Geral", short: "MAG", kind: "Órgão social" },
        { id: "DEEM", label: "Divulgação Externa de Engenharia Mecânica", short: "DEEM", kind: "Pelouro", bg: BG("cafc0e_09d05525e4e14899a5ab87688b4db407~mv2.png") },
        { id: "FC", label: "Formação e Competências", short: "FC", kind: "Pelouro", bg: BG("cafc0e_9b33df9e8f4040c4bc17ae57afc679ec~mv2.jpeg") },
        { id: "IT", label: "Informática e Tecnologia", short: "IT", kind: "Pelouro", bg: BG("cafc0e_8f102099e3814678a599d900762c5200~mv2.jpeg") },
        { id: "Marketing", label: "Marketing", kind: "Pelouro", bg: BG("cafc0e_f8900b2e205a43828c3086134f8c5609~mv2.jpeg") },
        { id: "MecanIST", label: "MecanIST", kind: "Pelouro", bg: BG("cafc0e_1d50fe0411bd43ba855ed87d4e5e5889~mv2.jpeg") },
        { id: "RD", label: "Recreativa e Desportiva", short: "RD", kind: "Pelouro", bg: BG("cafc0e_4fa0e645502840b8976f08b07dad5f29~mv2.png") },
        { id: "REI", label: "Relações Empresariais e Institucionais", short: "REI", kind: "Pelouro", bg: BG("cafc0e_b79942989ab549ca83d025c74b4b0f42~mv2.jpeg") },
      ];
      const labelOf = Object.fromEntries(GROUPS.map((g) => [g.id, g.label]));
      const role = (m) => (m.role || "").toLowerCase();
      const isLead = (m) => m.is_coordinator || role(m).trim() === "presidente";
      const teamRank = (m) => (isLead(m) ? 0 : role(m).includes("vice-coordenad") ? 1 : 2);
      const dirRank = (m) => (m.team === "11o" ? 4 : role(m).includes("vice-presidente") ? 1 : role(m).includes("presidente") ? 0 : role(m).includes("tesour") ? 2 : 3);
      const by = (rank) => (a, b) => rank(a) - rank(b) || String(a.name).localeCompare(String(b.name), "pt");
      const initials = (n) => String(n || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
      const avatar = (m) => { const p = safeUrl(m.image_link); return p ? `<img loading="lazy" referrerpolicy="no-referrer" src="${esc(p)}" alt="">` : esc(initials(m.name)); };
      const nMembers = (n) => `${n} ${n === 1 ? "membro" : "membros"}`;

      const memberCard = (m, inDirecao) => {
        let r = (m.role || "").trim() || "Membro";
        if (inDirecao && m.is_coordinator && labelOf[m.team]) r += " · " + labelOf[m.team];
        const li = safeUrl(m.linkedin);
        const lead = inDirecao ? dirRank(m) === 0 : isLead(m);
        return `<article class="card member${lead ? " lead-card" : ""}">
          <div class="avatar">${avatar(m)}</div>
          <p class="member-name">${esc(m.name)}</p>
          <p class="member-role">${esc(r)}</p>
          <div class="member-links">
            ${m.email ? `<a class="ibtn" href="mailto:${esc(m.email)}" title="${esc(m.email)}" aria-label="Email de ${esc(m.name)}">${ICON.mail}</a>` : ""}
            ${li ? `<a class="ibtn" href="${esc(li)}" target="_blank" rel="noopener" aria-label="LinkedIn de ${esc(m.name)}">${ICON.linkedin}</a>` : ""}
          </div></article>`;
      };
      const deptCard = (g) => {
        const faces = g.members.slice(0, 5).map((m, i) => `<span class="face" style="--i:${i}">${avatar(m)}</span>`).join("");
        const more = g.members.length > 5 ? `<span class="face more">+${g.members.length - 5}</span>` : "";
        return `<button type="button" class="dept-card${g.bg ? " has-bg" : ""}" data-dept="${esc(g.id)}"${g.bg ? ` style="--bg:url('${esc(g.bg)}')"` : ""} aria-haspopup="dialog">
          ${g.bg ? `<span class="dept-media" aria-hidden="true"></span>` : ""}
          <span class="dept-info">
            <span class="dept-kicker">${esc(g.short || g.kind)} · ${nMembers(g.members.length)}</span>
            <b>${esc(g.label)}</b>
            <span class="faces">${faces}${more}</span>
          </span>
          <span class="dept-go" aria-hidden="true">${ICON.arrow}</span>
        </button>`;
      };

      // ----- pop-up -----
      const modal = $("tmModal"), list = $("tmMembers");
      $("tmClose").innerHTML = ICON.close;
      let lastFocus = null, current = null;
      const focusables = () => [...modal.querySelectorAll("a[href], button:not([disabled])")];
      const open = (g, push = true) => {
        current = g;
        lastFocus = document.activeElement;
        $("tmKind").textContent = g.kind;
        $("tmTitle").textContent = g.label;
        $("tmSub").textContent = nMembers(g.members.length);
        $("tmHead").classList.toggle("has-bg", !!g.bg);
        $("tmHead").style.setProperty("--bg", g.bg ? `url('${g.bg}')` : "none");
        list.innerHTML = g.members.map((m) => memberCard(m, g.id === "direcao")).join("");
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("no-scroll");
        modal.querySelector(".tm-body").scrollTop = 0;
        pop(list.children, { scrollTrigger: false, delay: 0.12, stagger: 0.035 });
        if (push) history.replaceState(null, "", "#" + g.id.toLowerCase());
        $("tmClose").focus();
      };
      const close = () => {
        if (!current) return;
        current = null;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("no-scroll");
        history.replaceState(null, "", location.pathname + location.search);
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
      };
      $("tmClose").onclick = close;
      modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
      addEventListener("keydown", (e) => {
        if (!current) return;
        if (e.key === "Escape") return close();
        if (e.key === "Tab") { // manter o foco dentro do pop-up
          const f = focusables(); if (!f.length) return;
          const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });

      loadMembers().then((members) => {
        const groups = GROUPS.map((g) => ({
          ...g,
          members: g.id === "direcao" ? members.filter((m) => m.is_management).sort(by(dirRank)) : members.filter((m) => m.team === g.id).sort(by(teamRank)),
        })).filter((g) => g.members.length);
        const byId = Object.fromEntries(groups.map((g) => [g.id.toLowerCase(), g]));
        $("tmCount").textContent = members.length;
        $("tmDepts").textContent = groups.filter((g) => g.kind === "Pelouro").length;
        orgEl.innerHTML = groups.filter((g) => g.kind !== "Pelouro").map(deptCard).join("");
        pelEl.innerHTML = groups.filter((g) => g.kind === "Pelouro").map(deptCard).join("");
        pop(orgEl.children); pop(pelEl.children);
        [orgEl, pelEl].forEach((el) => el.addEventListener("click", (e) => { const b = e.target.closest("[data-dept]"); if (b) open(byId[b.dataset.dept.toLowerCase()]); }));
        // ligação direta a um pelouro, ex.: equipa.html#rei
        const fromHash = () => { const g = byId[location.hash.slice(1).toLowerCase()]; if (g) open(g, false); else close(); };
        if (byId[location.hash.slice(1).toLowerCase()]) fromHash();
        addEventListener("hashchange", fromHash);
      }).catch((e) => { console.error(e); fail(orgEl, "a lista de membros"); });
    },

    /* ================= OPORTUNIDADES ================= */
    oportunidades() {
      const rails = $("oppRails");
      json("data/oportunidades.json").then((data) => {
        const all = data.oportunidades || [];
        const tipoLabel = Object.fromEntries(data.tipos.map((t) => [t.id, t.label]));
        const areaLabel = Object.fromEntries((data.areas || []).map((a) => [a.id, a.label]));
        let tipo = "all", area = "all", q = "";

        const card = (o) => {
          const url = safeUrl(o.url);
          const mail = `mailto:${C.email}?subject=${encodeURIComponent(`Oportunidade: ${o.empresa} (${tipoLabel[o.tipo] || o.tipo})`)}`;
          const prazo = o.prazo ? new Date(o.prazo + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" }) : "";
          return `<article class="card lift opp">
            <div class="opp-logo">${o.logo ? `<img loading="lazy" draggable="false" src="${img(o.logo, 400, 250).replace("/fill/", "/fit/")}" alt="Logótipo ${esc(o.empresa)}">` : ""}</div>
            <div class="opp-body">
              <div class="opp-meta"><span class="badge t-${esc(o.tipo)}">${esc(tipoLabel[o.tipo] || o.tipo)}</span>${o.area && areaLabel[o.area] ? `<span class="badge">${esc(areaLabel[o.area])}</span>` : ""}</div>
              <h4>${esc(o.titulo || o.empresa)}</h4>
              ${o.titulo ? `<p>${esc(o.empresa)}</p>` : ""}
              ${o.descricao ? `<p>${esc(o.descricao)}</p>` : ""}
              ${o.local || prazo ? `<p>${[o.local && esc(o.local), prazo && "Até " + prazo].filter(Boolean).join(" · ")}</p>` : ""}
              ${url ? `<a class="btn btn-sm" href="${esc(url)}" target="_blank" rel="noopener">Saber mais ${ICON.arrow}</a>` : `<a class="btn btn-sm btn-ghost" href="${mail}">Pedir informação</a>`}
            </div></article>`;
        };

        const draw = () => {
          rails.innerHTML = "";
          const match = (o) => (area === "all" || o.area === area) && (!q || norm([o.empresa, o.titulo, o.descricao].join(" ")).includes(q));
          let shown = 0;
          data.tipos.filter((t) => tipo === "all" || t.id === tipo).forEach((t) => {
            const items = all.filter((o) => o.tipo === t.id && match(o));
            if (!items.length) {
              // tipo escolhido explicitamente mas sem resultados
              if (tipo === t.id) {
                const p = document.createElement("p");
                p.className = "empty";
                p.innerHTML = q || area !== "all" ? `<b>Sem resultados em ${esc(t.label)}.</b>Experimenta outro filtro ou pesquisa.` : `<b>De momento não há ${esc(t.label.toLowerCase())} publicadas.</b>Volta em breve ou segue as nossas redes sociais.`;
                rails.append(p); shown++;
              }
              return;
            }
            shown++;
            const r = rail(`<h3>${esc(t.label)}</h3><span class="count">${items.length}</span>`, items.map(card));
            rails.append(r);
            pop(r.querySelectorAll(".opp"));
          });
          if (!shown) rails.innerHTML = `<p class="empty"><b>Sem oportunidades para este filtro.</b>Experimenta outra pesquisa.</p>`;
        };

        const count = (id) => all.filter((o) => o.tipo === id).length;
        chips($("oppTipos"), [{ id: "all", label: "Todas", count: all.length }, ...data.tipos.map((t) => ({ id: t.id, label: t.label, count: count(t.id) }))], tipo, (v) => { tipo = v; draw(); });
        // o filtro de área só aparece quando houver oportunidades com "area" preenchida
        const usedAreas = (data.areas || []).filter((a) => all.some((o) => o.area === a.id));
        if (usedAreas.length) {
          $("oppAreasBar").hidden = false;
          chips($("oppAreas"), [{ id: "all", label: "Todas" }, ...usedAreas], area, (v) => { area = v; draw(); });
        }
        $("oppSearch").addEventListener("input", (e) => { q = norm(e.target.value.trim()); draw(); });
        draw();
      }).catch((e) => { console.error(e); fail(rails, "as oportunidades"); });
    },

    /* ================= DRIVE (explorador + leitor) =================
       Lê data/drive-index.json (gerado por tools/atualizar_drive.py):
       { gerado, pastas: { id: { n: nome, p: idPai|null, c: [[id, nome, tipo, data], ...] } } }
       tipo "d" = pasta; os restantes são ficheiros. Endereço: #/<pasta> ou #/<pasta>/<ficheiro>. */
    drive() {
      const view = $("dxView");
      json("data/drive-index.json").then((data) => {
        const F = data.pastas;
        const STRUCT = /^\d\s*\.?[ºo°]?\s*(ano|semestre)$/i; // "1º Ano", "2º Semestre": níveis de organização, não cadeiras
        const pretty = (n) => n.replace(/^(\d)\s*\.?[ºo°]?\s*(ano|semestre)$/i, (_, d, w) => `${d}.º ${w[0].toUpperCase()}${w.slice(1).toLowerCase()}`);
        const subs = (id) => F[id].c.filter((it) => it[2] === "d" && F[it[0]]);
        const files = (id) => F[id].c.filter((it) => it[2] !== "d");
        const pathOf = (id) => { const p = []; for (let x = id; x && F[x]; x = F[x].p) p.unshift(x); return p; };
        const memo = {};
        const total = (id) => (memo[id] ??= F[id] ? F[id].c.reduce((s, it) => s + (it[2] === "d" ? total(it[0]) : 1), 0) : 0);
        const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
        const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });

        // Separadores: anos da licenciatura e ramos do mestrado
        const roots = Object.keys(F).filter((id) => F[id].p === null).sort((a, b) => F[a].n.localeCompare(F[b].n, "pt"));
        const tabs = [];
        roots.forEach((r) => {
          const kids = subs(r);
          const years = kids.every((k) => STRUCT.test(k[1]));
          kids.forEach((k) => tabs.push({ id: k[0], label: years ? pretty(k[1]) : `${F[r].n} · ${k[1]}` }));
        });
        const isTab = (id) => tabs.some((t) => t.id === id);
        // Cadeiras de um separador, agrupadas por "1.º Ano · 1.º Semestre"
        const groups = (id, trail = []) => {
          const out = [], courses = [];
          subs(id).forEach((k) => { if (STRUCT.test(k[1])) out.push(...groups(k[0], [...trail, pretty(k[1])])); else courses.push(k); });
          if (courses.length) out.unshift({ title: trail.join(" · "), courses });
          return out;
        };

        const KIND = { pdf: "PDF", doc: "DOC", gdoc: "DOC", txt: "TXT", xls: "XLS", gsheet: "XLS", ppt: "PPT", gslides: "PPT", img: "IMG", vid: "VID", aud: "AUD", zip: "ZIP", code: "&lt;/&gt;", cad: "CAD" };
        const KIND_NAME = { pdf: "PDF", doc: "Documento", gdoc: "Documento Google", txt: "Texto", xls: "Folha de cálculo", gsheet: "Folha de cálculo Google", ppt: "Apresentação", gslides: "Apresentação Google", img: "Imagem", vid: "Vídeo", aud: "Áudio", zip: "Arquivo comprimido", code: "Código", cad: "CAD", file: "Ficheiro" };
        const typeTile = (k) => `<span class="ftype k-${esc(k)}">${k === "d" ? ICON.folder : KIND[k] || ICON.doc}</span>`;
        const previewUrl = (id, k) => ({ gdoc: `https://docs.google.com/document/d/${id}/preview`, gsheet: `https://docs.google.com/spreadsheets/d/${id}/preview`, gslides: `https://docs.google.com/presentation/d/${id}/preview` }[k] || `https://drive.google.com/file/d/${id}/preview`);

        const state = { id: tabs[0].id, q: "" };
        const go = (folder, file) => { location.hash = "#/" + folder + (file ? "/" + file : ""); };

        /* ----- pesquisa global (cadeiras, pastas e ficheiros) ----- */
        let flat = null;
        const buildFlat = () => {
          flat = [];
          Object.keys(F).forEach((id) => {
            if (F[id].p === null) return;
            const names = pathOf(id).map((x) => pretty(F[x].n));
            const here = names.join(" › ");
            if (!STRUCT.test(F[id].n)) flat.push({ folder: id, name: F[id].n, kind: "d", where: names.slice(0, -1).join(" › "), key: norm(names.join(" ")) });
            files(id).forEach((it) => flat.push({ folder: id, file: it[0], name: it[1], kind: it[2], where: here, key: norm(it[1] + " " + names.join(" ")) }));
          });
        };
        const drawSearch = () => {
          if (!flat) buildFlat();
          const toks = state.q.split(/\s+/).filter(Boolean);
          const hits = flat.filter((x) => toks.every((t) => x.key.includes(t)));
          // primeiro o que coincide no próprio nome; pastas antes de ficheiros
          const inName = (x) => (toks.every((t) => norm(x.name).includes(t)) ? 0 : 1);
          hits.sort((a, b) => inName(a) - inName(b) || (a.kind !== "d") - (b.kind !== "d") || a.name.localeCompare(b.name, "pt", { numeric: true }));
          const shown = hits.slice(0, 80);
          $("dxTabs").hidden = true;
          $("dxCrumbs").innerHTML = `<span class="cur">Resultados da pesquisa</span>`;
          $("dxCount").textContent = hits.length > 80 ? `80 de ${hits.length} resultados` : plural(hits.length, "resultado", "resultados");
          view.innerHTML = shown.length ? shown.map((x) => `<button class="dx-row" type="button" data-folder="${esc(x.folder)}"${x.file ? ` data-file="${esc(x.file)}"` : ""}>
              ${typeTile(x.kind)}<span><b>${esc(x.name)}</b><small>${esc(x.where)}</small></span>
              <span class="meta">${x.kind === "d" ? plural(total(x.folder), "ficheiro", "ficheiros") : esc(KIND_NAME[x.kind] || "Ficheiro")}</span>${ICON.arrowR}</button>`).join("")
            : `<p class="empty"><b>Nada encontrado.</b>Experimenta outro termo, por exemplo o nome da cadeira ou "exame 2023".</p>`;
        };

        /* ----- vista de pastas ----- */
        const draw = () => {
          if (state.q) return drawSearch();
          const id = state.id, path = pathOf(id), tab = path.find(isTab);
          $("dxTabs").hidden = false;
          chips($("dxTabs"), tabs, tab, (v) => go(v));
          // caminho: raiz e níveis de organização são texto; separador e pastas são clicáveis
          $("dxCrumbs").innerHTML = (path.length > 2 ? `<button type="button" class="ibtn" data-folder="${esc(F[id].p)}" aria-label="Voltar à pasta anterior" style="margin-right:6px">${ICON.back}</button>` : "") +
            path.map((x, i) => {
              const name = esc(pretty(F[x].n));
              if (i === path.length - 1) return `<span class="cur">${name}</span>`;
              const clickable = isTab(x) || (i > 0 && !STRUCT.test(F[x].n));
              return (clickable ? `<button type="button" data-folder="${esc(x)}">${name}</button>` : `<span>${name}</span>`) + ICON.arrowR;
            }).join("");
          $("dxCrumbs").scrollLeft = 1e5; // em telemóvel o caminho desliza: mostrar o fim

          if (isTab(id)) {
            const gs = groups(id);
            $("dxCount").textContent = plural(total(id), "ficheiro", "ficheiros");
            view.innerHTML = gs.map((g) => `<div class="dx-group">${g.title ? `<h3>${esc(g.title)}</h3>` : ""}<div class="dx-courses">${g.courses.map((c) => {
              const n = total(c[0]);
              return `<button class="dx-course${n ? "" : " is-empty"}" type="button" data-folder="${esc(c[0])}"><span class="icon-tile">${ICON.folder}</span><span><b>${esc(c[1])}</b><small>${n ? plural(n, "ficheiro", "ficheiros") : "Ainda sem materiais"}</small></span>${ICON.arrowR}</button>`;
            }).join("")}</div></div>`).join("") || `<p class="empty"><b>Sem cadeiras nesta secção.</b></p>`;
            return;
          }
          const items = F[id].c.filter((it) => it[2] !== "d" || F[it[0]]);
          $("dxCount").textContent = plural(items.length, "item", "itens");
          view.innerHTML = items.length ? items.map((it) => it[2] === "d"
            ? `<button class="dx-row" type="button" data-folder="${esc(it[0])}">${typeTile("d")}<span><b>${esc(pretty(it[1]))}</b></span><span class="meta">${plural(total(it[0]), "ficheiro", "ficheiros")}</span>${ICON.arrowR}</button>`
            : `<button class="dx-row" type="button" data-folder="${esc(id)}" data-file="${esc(it[0])}">${typeTile(it[2])}<span><b>${esc(it[1])}</b><small>${esc(KIND_NAME[it[2]] || "Ficheiro")}</small></span><span class="meta">${it[3] >= "2000" ? fmtDate(it[3]) : ""}</span>${ICON.arrowR}</button>`).join("")
            : `<p class="empty"><b>Esta pasta ainda não tem materiais.</b>Tens apontamentos, testes ou resoluções desta cadeira? <a href="mailto:${C.email}?subject=${encodeURIComponent("Contribuição para a Drive: " + F[id].n)}">Envia-nos</a> para os acrescentarmos.</p>`;
        };

        /* ----- leitor ----- */
        const reader = $("reader"), stage = $("rdStage");
        let rd = null, lastFocus = null;
        $("rdPrev").innerHTML = ICON.arrowL; $("rdNext").innerHTML = ICON.arrowR;
        $("rdDown").innerHTML = ICON.download; $("rdClose").innerHTML = ICON.close;
        const openReader = (folder, fileId) => {
          const list = files(folder), i = list.findIndex((it) => it[0] === fileId);
          if (i < 0) return closeReader();
          const [fid, name, kind] = list[i];
          if (!rd) lastFocus = document.activeElement;
          rd = { folder, list, i };
          $("rdType").className = "ftype k-" + kind;
          $("rdType").innerHTML = KIND[kind] || ICON.doc;
          $("rdName").textContent = name;
          $("rdPath").textContent = pathOf(folder).slice(1).map((x) => pretty(F[x].n)).join(" › ");
          $("rdPos").textContent = `${i + 1} de ${list.length}`;
          $("rdPrev").disabled = i === 0;
          $("rdNext").disabled = i === list.length - 1;
          const native = ["gdoc", "gsheet", "gslides"].includes(kind);
          $("rdDown").hidden = native;
          $("rdDown").href = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fid)}`;
          // um iframe novo por documento: assim o botão "voltar" do browser não fica preso dentro do leitor
          stage.querySelector("iframe")?.remove();
          $("rdLoading").hidden = false;
          const frame = document.createElement("iframe");
          frame.title = name;
          frame.setAttribute("sandbox", "allow-scripts allow-same-origin"); // sem "allow-popups": o documento não consegue abrir a Drive noutro separador
          frame.setAttribute("allow", "autoplay; fullscreen");
          frame.addEventListener("load", () => { $("rdLoading").hidden = true; });
          frame.src = previewUrl(fid, kind);
          stage.append(frame);
          reader.hidden = false;
          document.body.classList.add("no-scroll");
          $("rdClose").focus();
        };
        function closeReader() {
          if (!rd) return;
          rd = null;
          reader.hidden = true;
          stage.querySelector("iframe")?.remove();
          document.body.classList.remove("no-scroll");
          if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
        }
        // trocar de ficheiro / fechar sem acumular entradas no histórico
        const swap = (folder, file) => { history.replaceState(null, "", "#/" + folder + (file ? "/" + file : "")); route(); };
        const step = (d) => { if (rd && rd.list[rd.i + d]) swap(rd.folder, rd.list[rd.i + d][0]); };
        $("rdPrev").onclick = () => step(-1);
        $("rdNext").onclick = () => step(1);
        $("rdClose").onclick = () => rd && swap(rd.folder);
        reader.addEventListener("click", (e) => { if (e.target === reader && rd) swap(rd.folder); });
        addEventListener("keydown", (e) => {
          if (!rd) return;
          if (e.key === "Escape") swap(rd.folder);
          else if (e.key === "ArrowLeft") step(-1);
          else if (e.key === "ArrowRight") step(1);
        });

        /* ----- navegação ----- */
        function route() {
          const [, folder, file] = location.hash.match(/^#\/([\w-]+)(?:\/([\w-]+))?/) || [];
          let id = F[folder] ? folder : tabs[0].id;
          if (F[id].p === null) id = (subs(id)[0] || [tabs[0].id])[0]; // raiz → primeiro separador
          const changed = id !== state.id;
          state.id = id;
          draw();
          if (file && F[folder]) openReader(folder, file); else closeReader();
          if (changed && !file && view.getBoundingClientRect().top < 0) $("dx").scrollIntoView({ block: "start" });
        }
        const onPick = (e) => {
          const b = e.target.closest("[data-folder]");
          if (!b) return;
          if (!b.dataset.file && state.q) { state.q = ""; $("driveSearch").value = ""; }
          const target = "#/" + b.dataset.folder + (b.dataset.file ? "/" + b.dataset.file : "");
          if (location.hash === target) route(); // mesma pasta (ex.: vindo da pesquisa): não há hashchange
          else location.hash = target;
        };
        view.addEventListener("click", onPick);
        $("dxCrumbs").addEventListener("click", onPick);
        $("driveSearch").addEventListener("input", (e) => { state.q = norm(e.target.value.trim()); draw(); });
        addEventListener("hashchange", route);

        const when = data.gerado ? new Date(data.gerado + "T00:00:00").toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }) : "";
        $("dxFoot").innerHTML = `<span>${plural(roots.reduce((s, r) => s + total(r), 0), "ficheiro", "ficheiros")} em ${Object.keys(F).length} pastas</span>${when ? `<span>Índice atualizado a ${esc(when)}</span>` : ""}`;
        route();
      }).catch((e) => { console.error(e); fail(view, "a Drive"); });
    },

    /* ================= MECANIST ================= */
    mecanist() {
      json("data/mecanist.json").then((d) => {
        $("mxHero").style.setProperty("--hero-img", `url('${img(d.fundo, 1920, 1080)}')`);
        $("mxMeta").innerHTML = [d.datas + " " + d.ano, d.local].map((t) => `<span>${esc(t)}</span>`).join("");
        $("mxLema").innerHTML = d.lema.map((l, i) => `<span${i ? ' class="hl"' : ""}>${esc(l)}</span>`).join(" ");
        pop([...$("mxLema").children, $("mxMeta")], { scrollTrigger: false, y: 44, duration: 1.1, stagger: 0.14 });
        const sched = $("mxSched");
        const drawDay = (dia) => {
          const day = d.programa.find((p) => p.dia === dia);
          sched.innerHTML = day.sessoes.map((s) => `<div class="sched-row"><time>${esc(s.hora)}</time><div><b>${esc(s.titulo)}</b>${s.detalhe ? `<small>${esc(s.detalhe)}</small>` : ""}</div>${s.sala ? `<span class="badge">${esc(s.sala)}</span>` : ""}</div>`).join("");
        };
        chips($("mxDays"), d.programa.map((p) => ({ id: p.dia, label: p.dia })), d.programa[0].dia, drawDay);
        drawDay(d.programa[0].dia);
        $("mxSpeakers").innerHTML = d.oradores.map((o) => `<article class="card lift speaker"><div class="ph"><img loading="lazy" src="${img(o.foto, 480)}" alt=""></div><div><b>${esc(o.nome)}</b><span>${esc(o.empresa)}</span></div></article>`).join("");
        pop($("mxSpeakers").children);
      }).catch((e) => console.error(e));

      json("data/mecanist-empresas.json").then((d) => {
        const CATS = [["all", "Todas"], ["energias", "Energias"], ["producao", "Produção"], ["sistemas", "Sistemas"], ["multidisciplinar", "Multidisciplinar"]];
        const grid = $("mxCompanies");
        const draw = (cat) => {
          grid.innerHTML = d.empresas.filter((e) => cat === "all" || e.cat === cat)
            .map((e) => `<div class="logo-tile"><img loading="lazy" src="${esc(safeLogo(e.logo))}" alt="Empresa"></div>`).join("");
        };
        chips($("mxCats"), CATS.map(([id, label]) => ({ id, label, count: id === "all" ? d.empresas.length : d.empresas.filter((e) => e.cat === id).length })), "all", draw);
        draw("all");
        $("mxSponsors").innerHTML = d.patrocinadores.map((p) => `<div class="logo-tile${p.cls.includes("featured") ? " featured" : ""}"><img loading="lazy" src="${esc(safeLogo(p.logo))}" alt="Patrocinador"></div>`).join("");
        pop($("mxSponsors").children, { stagger: 0.03 });
      }).catch((e) => console.error(e));
    },
  };

  const run = PAGES[document.body.dataset.page];
  if (run) run();
})();
