(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const ROOT = document.body.dataset.root || "./";
  const PAGE = document.body.dataset.page || "";
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  const longFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function eventDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function statusLabel(status) {
    return (
      {
        "on-sale": "On sale",
        rsvp: "Free RSVP",
        almost: "Almost gone",
        soon: "Soon",
        sold: "Sold out",
      }[status] || status
    );
  }

  function img(file) {
    return ROOT + "images/" + file;
  }

  function eventHref(id) {
    return ROOT + "events/show.html?id=" + encodeURIComponent(id);
  }

  function ticketCard(ev) {
    const dt = eventDate(ev.date);
    return `<article class="ticket">
      <a href="${eventHref(ev.id)}">
        <div class="ticket-photo" style="background-image:url('${img(ev.image)}')"></div>
        <div class="ticket-body">
          <p class="ticket-date"><span>${monthFmt.format(dt)}</span><strong>${dt.getDate()}</strong></p>
          <div class="ticket-copy">
            <p class="kicker">${ev.category} · ${ev.age}</p>
            <h3>${ev.title}</h3>
            <p class="meta">${ev.start} · ${ev.price}</p>
          </div>
          <span class="ticket-cta">${statusLabel(ev.status)}</span>
        </div>
      </a>
    </article>`;
  }

  function navClass(hrefPage) {
    return PAGE === hrefPage ? "active" : "";
  }

  function injectChrome() {
    const header = document.createElement("div");
    header.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <div class="preview-banner">
        Concept redesign · not the official site ·
        <a href="${window.RINK.venue.official}" target="_blank" rel="noopener">therinkstudiossac.com</a>
        · by <a href="${ROOT}../">The Markk Brandon Collective</a>
      </div>
      <header class="site-header">
        <div class="nav-inner">
          <a class="brand" href="${ROOT}">
            <img class="brand-mark" src="${img("mark.png")}" width="48" height="48" alt="">
            <span class="brand-text">
              <span>The Rink</span>
              <span>Studios</span>
            </span>
          </a>
          <nav class="nav-links" id="nav-links" aria-label="Primary">
            <a class="${navClass("home")}" href="${ROOT}">Home</a>
            <a class="${navClass("events")}" href="${ROOT}events/">Shows</a>
            <a class="${navClass("about")}" href="${ROOT}about/">About</a>
            <a class="${navClass("rent")}" href="${ROOT}rent/">Rent</a>
            <a class="${navClass("faq")}" href="${ROOT}faq/">FAQ</a>
            <a class="${navClass("team")}" href="${ROOT}team/">Team</a>
            <a class="${navClass("contact")}" href="${ROOT}contact/">Contact</a>
          </nav>
          <a class="btn btn-gold btn-nav" href="${ROOT}events/">Get tickets</a>
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links">Menu</button>
        </div>
      </header>`;
    document.body.prepend(...header.childNodes);

    const footer = document.createElement("footer");
    footer.className = "site-footer";
    const v = window.RINK.venue;
    footer.innerHTML = `
      <div class="footer-grid">
        <div>
          <p class="footer-mark">The Rink Studios</p>
          <p class="footer-tag">A home for the bold on Del Paso Blvd.</p>
        </div>
        <div>
          <p class="footer-label">Visit</p>
          <p>${v.address}<br>${v.region}</p>
          <p><a href="${v.mapLink}" target="_blank" rel="noopener">Open map</a></p>
        </div>
        <div>
          <p class="footer-label">Talk</p>
          <p><a href="${v.phoneHref}">${v.phone}</a></p>
          <p><a href="mailto:${v.email}">${v.email}</a></p>
          <p>
            <a href="${v.instagram}" target="_blank" rel="noopener">Instagram</a> ·
            <a href="${v.facebook}" target="_blank" rel="noopener">Facebook</a>
          </p>
        </div>
        <div>
          <p class="footer-label">House</p>
          <p><a href="${ROOT}rent/">Rent the venue</a></p>
          <p><a href="${ROOT}team/">Join the team</a></p>
          <p><a href="${ROOT}privacy/">Privacy</a></p>
        </div>
      </div>
      <p class="footer-legal">© ${new Date().getFullYear()} The Rink Studios Sacramento · This page is a concept redesign and is not affiliated with the official venue site.</p>`;
    document.body.append(footer);
  }

  function bindNav() {
    const toggle = $(".nav-toggle");
    const links = $("#nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      links.classList.toggle("open", !open);
      document.body.classList.toggle("nav-open", !open);
      toggle.textContent = open ? "Menu" : "Close";
    });
  }

  function renderHome() {
    const featured = $("#featured-events");
    if (featured) {
      featured.innerHTML = window.RINK.events.slice(0, 3).map(ticketCard).join("");
    }
    const marquee = $("#show-marquee");
    if (marquee) {
      const line = window.RINK.events
        .map((ev) => {
          const dt = eventDate(ev.date);
          return `${ev.title}  ·  ${monthFmt.format(dt)} ${dt.getDate()}`;
        })
        .join("   ✦   ");
      marquee.innerHTML = `<div class="marquee-track"><span>${line}   ✦   ${line}</span></div>`;
    }
    const amen = $("#amenity-grid");
    if (amen) {
      amen.innerHTML = window.RINK.amenities
        .slice(0, 8)
        .map((a) => `<article class="stat-card"><h3>${a.label}</h3><p>${a.detail}</p></article>`)
        .join("");
    }
  }

  function renderEventsPage() {
    const grid = $("#event-grid");
    if (!grid) return;
    const buttons = $$("[data-filter]");
    const empty = $("#event-empty");
    function draw(filter) {
      const list =
        filter === "all"
          ? window.RINK.events
          : window.RINK.events.filter((e) => e.category === filter);
      grid.innerHTML = list.map(ticketCard).join("");
      if (empty) empty.hidden = list.length > 0;
    }
    draw("all");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        draw(btn.dataset.filter);
      });
    });
  }

  function renderEventShow() {
    const root = $("#event-detail");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const ev = window.RINK.events.find((e) => e.id === id);
    if (!ev) {
      root.innerHTML = `<section class="page-block">
        <p class="kicker">Shows</p>
        <h1>That night is not on the board</h1>
        <p class="lede">The link may be old. See everything still on sale.</p>
        <p><a class="btn btn-gold" href="${ROOT}events/">All upcoming shows</a></p>
      </section>`;
      return;
    }
    const dt = eventDate(ev.date);
    document.title = `${ev.title} | The Rink Studios`;
    root.innerHTML = `
      <section class="event-hero">
        <div class="event-hero-photo" style="background-image:url('${img(ev.image)}')"></div>
        <div class="event-hero-copy">
          <p class="kicker">${ev.category} · ${ev.age} · ${statusLabel(ev.status)}</p>
          <h1>${ev.title}</h1>
          <p class="lede">${ev.subtitle}</p>
          <dl class="fact-list">
            <div><dt>Date</dt><dd>${longFmt.format(dt)}</dd></div>
            <div><dt>Doors</dt><dd>${ev.doors}</dd></div>
            <div><dt>Show</dt><dd>${ev.start} – ${ev.end}</dd></div>
            <div><dt>Tickets</dt><dd>${ev.price}</dd></div>
            <div><dt>Room</dt><dd>The Rink Studios, 1031 Del Paso Blvd</dd></div>
          </dl>
          <p class="hero-actions">
            <button class="btn btn-gold" type="button" data-ticket>Get tickets</button>
            <a class="btn btn-ghost" href="${ROOT}events/">All shows</a>
          </p>
          <p class="ticket-note" hidden>This is a concept site — no real checkout. Use the official box office on therinkstudiossac.com for actual tickets.</p>
        </div>
      </section>
      <section class="page-block narrow">
        <h2>About the night</h2>
        <p>${ev.blurb}</p>
        <p>House rules still apply: cashless bar, small bags, and no re-entry unless the door team posts it. Read the <a href="${ROOT}faq/">FAQ</a> before you ride over.</p>
      </section>`;
    const ticketBtn = $("[data-ticket]", root);
    ticketBtn?.addEventListener("click", () => {
      const note = $(".ticket-note", root);
      if (note) note.hidden = false;
    });
  }

  function renderRent() {
    const pack = $("#package-grid");
    if (pack) {
      pack.innerHTML = window.RINK.packages
        .map(
          (p) => `<article class="package-card${p.featured ? " featured" : ""}">
            ${p.featured ? `<p class="kicker">Most booked</p>` : `<p class="kicker">Rental</p>`}
            <h3>${p.name}</h3>
            <p class="package-price">${p.price}</p>
            <p class="meta">${p.meta}</p>
            <ul>${p.points.map((x) => `<li>${x}</li>`).join("")}</ul>
          </article>`
        )
        .join("");
    }
    const amen = $("#rent-amenities");
    if (amen) {
      amen.innerHTML = window.RINK.amenities
        .map((a) => `<li><strong>${a.label}</strong><span>${a.detail}</span></li>`)
        .join("");
    }
  }

  function renderFaq() {
    const list = $("#faq-list");
    const tabs = $$("[data-faq-tab]");
    if (!list) return;
    function draw(key) {
      const items = window.RINK.faqs[key] || [];
      list.innerHTML = items
        .map(
          (item, i) => `<details class="faq-item"${i === 0 ? " open" : ""}>
            <summary>${item.q}</summary>
            <p>${item.a}</p>
          </details>`
        )
        .join("");
    }
    draw("attendee");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        draw(tab.dataset.faqTab);
      });
    });
  }

  function renderTeam() {
    const grid = $("#role-grid");
    if (!grid) return;
    grid.innerHTML = window.RINK.roles
      .map((r) => `<article class="role-card"><h3>${r.title}</h3><p>${r.detail}</p></article>`)
      .join("");
  }

  function bindForms() {
    $$("form[data-mock]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!form.reportValidity()) return;
        const done = form.parentElement.querySelector("[data-success]");
        form.hidden = true;
        if (done) done.hidden = false;
      });
    });
  }

  injectChrome();
  bindNav();
  bindForms();
  if (PAGE === "home") renderHome();
  if (PAGE === "events") renderEventsPage();
  if (PAGE === "show") renderEventShow();
  if (PAGE === "rent") renderRent();
  if (PAGE === "faq") renderFaq();
  if (PAGE === "team") renderTeam();
})();
