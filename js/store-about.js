(function () {
  let aboutData = null;

  function asset(path) {
    if (!path) return '#';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return new URL(path.replace(/^\//, ''), document.baseURI).href;
  }

  async function loadAboutData() {
    if (aboutData) return aboutData;
    const res = await fetch(asset('data/store-about.json'), { cache: 'no-store' });
    if (!res.ok) throw new Error('about data');
    aboutData = await res.json();
    return aboutData;
  }

  function certThumbGrid(certs) {
    return certs
      .map(
        (cert, i) => `
      <button type="button" class="store-about-cert" data-cert-index="${i}" aria-label="${cert.title}">
        <img src="${asset(cert.thumb || cert.image)}" alt="" loading="lazy" width="120" height="156">
        <span>${cert.title}</span>
      </button>`
      )
      .join('');
  }

  function renderAboutContent(data, catalog, escapeHtml, section) {
    const hero = data.hero;
    const cards = (data.storyCards || [])
      .map((card) => {
        let action = '';
        if (card.linkSlug) {
          action = `<a class="store-about-card-link" href="#/app/${encodeURIComponent(card.linkSlug)}">Open in store →</a>`;
        } else if (card.anchor) {
          action = `<a class="store-about-card-link" href="#/about/${card.anchor}">Read more →</a>`;
        }
        return `<article class="store-about-card">
          <p class="store-about-kicker">${escapeHtml(card.kicker)}</p>
          <h3>${escapeHtml(card.title)}</h3>
          <p class="store-about-deck">${escapeHtml(card.deck)}</p>
          <p>${escapeHtml(card.body)}</p>
          ${action}
        </article>`;
      })
      .join('');

    const timeline = (data.timeline || [])
      .map(
        (row) => `<li><span class="store-about-year">${escapeHtml(row.year)}</span>${escapeHtml(row.text)}</li>`
      )
      .join('');

    const bullets = (data.siteBullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('');

    const donationUses = (data.support?.donationUses || [])
      .map((u) => `<li>${escapeHtml(u)}</li>`)
      .join('');

    const companies = (data.security?.companies || [])
      .map(
        (co) => `<article class="store-about-company">
        <img src="${asset(co.icon)}" alt="" width="48" height="48" class="store-icon-sm">
        <div>
          <h4>${escapeHtml(co.name)}</h4>
          <p class="store-about-deck">${escapeHtml(co.tagline)}</p>
          <p>${escapeHtml(co.body)}</p>
          <a class="store-btn store-btn-secondary" href="${escapeHtml(co.webUrl)}" target="_blank" rel="noopener noreferrer">Visit site</a>
        </div>
      </article>`
      )
      .join('');

    const pdfs = (data.resume?.pdfs || [])
      .map(
        (pdf) =>
          `<a class="store-about-resume-link" href="${asset(pdf.href)}" download rel="noopener">${escapeHtml(pdf.label)}</a>`
      )
      .join('');

    const projects = (catalog?.apps || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(
        (app) => `<a class="store-list-row" href="#/app/${encodeURIComponent(app.slug)}">
          <img class="store-icon store-icon-sm" src="${asset(app.icon || 'icons/icon-192.png')}" alt="" width="48" height="48" loading="lazy">
          <div class="store-list-meta" style="flex:1"><h3>${escapeHtml(app.name)}</h3><p>${escapeHtml(app.tagline || '')}</p></div>
        </a>`
      )
      .join('');

    return `
      <div class="store-about" data-section="${escapeHtml(section || '')}">
        <section class="store-about-hero" id="about-top">
          <img class="store-about-logo" src="${asset(hero.logo)}" width="72" height="72" alt="">
          <h1 class="store-about-title">The Markk Brandon Collective</h1>
          <p class="store-about-tagline">${escapeHtml(hero.tagline)}</p>
          <figure class="store-about-portrait">
            <img src="${asset(hero.headshot)}" width="480" height="360" alt="Markeith Nicholas White at his desk" loading="lazy">
            <figcaption>${escapeHtml(hero.location)} · ${escapeHtml(hero.aliases)}</figcaption>
          </figure>
          <p class="store-about-name">${escapeHtml(hero.name)}</p>
          <p class="store-about-aliases">${escapeHtml(hero.aliases)}</p>
        </section>

        <section class="store-about-block" id="about-welcome">
          ${(data.welcome || []).map((p) => `<p class="store-description">${escapeHtml(p)}</p>`).join('')}
          ${(data.bio || []).map((p) => `<p class="store-description">${escapeHtml(p)}</p>`).join('')}
        </section>

        <section class="store-about-block store-about-callout" id="about-ai">
          <p class="store-about-kicker">${escapeHtml(data.aiNote?.label || 'Note')}</p>
          ${(data.aiNote?.paragraphs || []).map((p) => `<p class="store-description">${escapeHtml(p)}</p>`).join('')}
        </section>

        <section class="store-about-block" id="about-why">
          <h2 class="store-section-title">Why I build this stuff</h2>
          <div class="store-about-cards">${cards}</div>
        </section>

        <section class="store-about-block" id="about-timeline">
          <h2 class="store-section-title">Timeline</h2>
          <ul class="store-about-timeline">${timeline}</ul>
        </section>

        <section class="store-about-block" id="about-projects">
          <h2 class="store-section-title">All projects</h2>
          <p class="store-description">Every app in the MBC Store catalog — tap to open details and install.</p>
          <div class="store-about-project-list">${projects}</div>
        </section>

        <section class="store-about-block" id="about-security">
          <h2 class="store-section-title">Security showcase</h2>
          <p class="store-description">${escapeHtml(data.security?.lead || '')}</p>
          <div class="store-about-companies">${companies}</div>
          <p class="store-description">${escapeHtml(data.security?.certsIntro || '')}</p>
          <div id="store-about-cert-grid" class="store-about-cert-grid"><p class="store-empty">Loading certificates…</p></div>
        </section>

        <section class="store-about-block" id="about-support">
          <h2 class="store-section-title">${escapeHtml(data.support?.title || 'Support')}</h2>
          <p class="store-description">${escapeHtml(data.support?.intro || '')}</p>
          <ul class="store-about-list">${donationUses}</ul>
          <a class="store-btn store-btn-install" href="${escapeHtml(data.support?.gofundmeUrl || '#')}" target="_blank" rel="noopener noreferrer">Support on GoFundMe</a>
          <p class="store-about-footnote">${escapeHtml(data.support?.gofundmeNote || '')}</p>
        </section>

        <section class="store-about-block" id="about-hire">
          <h2 class="store-section-title">Hire me</h2>
          <p class="store-description">Request a website or app build. Tell me what you need and your budget min–max — I'll email you if it's a fit.</p>
          <form class="store-about-form" action="https://formsubmit.co/${escapeHtml(data.contact?.email || 'themarkkbrandoncollective@gmail.com')}" method="POST">
            <input type="hidden" name="_subject" value="MBC build request">
            <input type="hidden" name="_template" value="table">
            <input type="hidden" name="_captcha" value="false">
            <input type="text" name="_honey" class="store-about-honey" tabindex="-1" autocomplete="off">
            <label>Name<input name="name" type="text" required autocomplete="name"></label>
            <label>Email<input name="email" type="email" required autocomplete="email"></label>
            <label>Project type
              <select name="project_type" required>
                <option value="">Pick one</option>
                <option value="website">Website</option>
                <option value="web-app">Web app</option>
                <option value="mobile-pwa">Mobile / PWA</option>
                <option value="full-stack">Full-stack product</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Details<textarea name="details" rows="4" required placeholder="What are you building?"></textarea></label>
            <div class="store-about-form-row">
              <label>Budget min (USD)<input name="budget_min" type="number" min="0" step="50" required></label>
              <label>Budget max (USD)<input name="budget_max" type="number" min="0" step="50" required></label>
            </div>
            <label>Timeline (optional)<input name="timeline" type="text"></label>
            <button type="submit" class="store-btn store-btn-install">Send request</button>
          </form>
        </section>

        <section class="store-about-block" id="about-resume">
          <h2 class="store-section-title">Résumé</h2>
          <p class="store-description">${escapeHtml(data.resume?.intro || '')}</p>
          <div class="store-about-resume-links">${pdfs}</div>
        </section>

        <section class="store-about-block" id="about-contact">
          <h2 class="store-section-title">Contact</h2>
          <ul class="store-about-list">
            <li><a href="mailto:${escapeHtml(data.contact?.email)}">${escapeHtml(data.contact?.email)}</a></li>
            <li><a href="${escapeHtml(data.contact?.github)}" target="_blank" rel="noopener noreferrer">GitHub — TheMarkkBradonCollective</a></li>
          </ul>
          <h3 class="store-about-subhead">What this is</h3>
          <ul class="store-about-list">${bullets}</ul>
        </section>

        <blockquote class="store-about-motto">${escapeHtml(data.motto)}</blockquote>
        <p class="store-about-footer">${escapeHtml(data.footer)}</p>
      </div>`;
  }

  async function bindCerts() {
    const grid = document.getElementById('store-about-cert-grid');
    if (!grid) return;
    try {
      const res = await fetch(asset('security/certs.json'), { cache: 'no-store' });
      const data = await res.json();
      const training = data.training || [];
      grid.innerHTML = certThumbGrid(training);
      grid.querySelectorAll('[data-cert-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cert = training[Number(btn.getAttribute('data-cert-index'))];
          if (cert?.image) window.open(asset(cert.image), '_blank', 'noopener,noreferrer');
        });
      });
    } catch {
      grid.innerHTML = '<p class="store-empty">Certificates could not be loaded.</p>';
    }
  }

  function scrollToSection(section) {
    if (!section) return;
    const el = document.getElementById(`about-${section}`) || document.getElementById('about-top');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.MbcStoreAbout = {
    loadAboutData,
    renderAboutContent,
    bindCerts,
    scrollToSection,
  };
})();
