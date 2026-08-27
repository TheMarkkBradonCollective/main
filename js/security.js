(function () {
  const SCRIPT = document.currentScript;
  const ROOT = SCRIPT ? new URL('../', SCRIPT.src) : new URL('../', window.location.href);

  function asset(rel) {
    return new URL(String(rel || '').replace(/^\//, ''), ROOT).href;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function hoursLabel(hours) {
    const n = Number(hours);
    if (!n) return '';
    return n === 1 ? '1 hour' : `${n} hours`;
  }

  function certCard(cert, index, listName) {
    const title = cert.title || 'Certificate';
    const hours = hoursLabel(cert.hours);
    const date = formatDate(cert.completed);
    const thumb = cert.thumb || cert.image;
    const badge = cert.badge ? `<span class="cert-badge">${escapeHtml(cert.badge)}</span>` : '';
    const note = cert.note ? `<span class="cert-note">${escapeHtml(cert.note)}</span>` : '';
    const modules = Array.isArray(cert.modules) && cert.modules.length
      ? `<span class="cert-modules">${escapeHtml(cert.modules.join(' · '))}</span>`
      : '';

    return `
      <button type="button" class="cert-card" data-list="${escapeHtml(listName)}" data-index="${index}" aria-label="View certificate: ${escapeHtml(title)}">
        <span class="cert-frame">
          <img src="${escapeHtml(asset(thumb))}" alt="" width="280" height="360" loading="lazy">
        </span>
        <span class="cert-body">
          ${badge}
          <span class="cert-hours">${escapeHtml(hours)}</span>
          <span class="cert-title">${escapeHtml(title)}</span>
          <span class="cert-meta">${escapeHtml(date)}${cert.course ? ` · ${escapeHtml(cert.course)}` : ''}</span>
          ${cert.serial ? `<span class="cert-serial">Serial ${escapeHtml(cert.serial)}</span>` : ''}
          ${modules}
          ${note}
        </span>
      </button>`;
  }

  function comingSoonCard() {
    return `
      <article class="cert-card coming-soon" aria-label="Operator certificates coming soon">
        <p class="cert-badge">BSIS operator</p>
        <h3 class="cert-title">Operator credentials</h3>
        <p>Guard card and related BSIS operator certificates will land in this slot.</p>
        <p class="cert-meta">Coming soon</p>
      </article>`;
  }

  function setStats(training) {
    const hoursEl = document.getElementById('cert-hours-stat');
    const countEl = document.getElementById('cert-count-stat');
    if (!training.length) return;
    const current = training.filter((c) => c.id !== 'pta-wmd-2018');
    const hours = current.reduce((sum, cert) => sum + (Number(cert.hours) || 0), 0);
    if (hoursEl) hoursEl.textContent = String(hours);
    if (countEl) countEl.textContent = String(training.length);
  }

  function bindLightbox(lists) {
    const dialog = document.getElementById('cert-lightbox');
    if (!dialog) return;

    const img = dialog.querySelector('.cert-lightbox-image');
    const titleEl = dialog.querySelector('.cert-lightbox-title');
    const metaEl = dialog.querySelector('.cert-lightbox-meta');
    const noteEl = dialog.querySelector('.cert-lightbox-note');
    const closeBtn = dialog.querySelector('.cert-lightbox-close');
    const prevBtn = dialog.querySelector('.cert-lightbox-prev');
    const nextBtn = dialog.querySelector('.cert-lightbox-next');

    let currentList = 'training';
    let currentIndex = 0;

    function items() {
      return lists[currentList] || [];
    }

    function show(index) {
      const list = items();
      if (!list.length) return;
      currentIndex = (index + list.length) % list.length;
      const cert = list[currentIndex];
      const title = cert.title || 'Certificate';
      img.src = asset(cert.image);
      img.alt = `${title} certificate`;
      titleEl.textContent = title;
      const bits = [
        hoursLabel(cert.hours),
        formatDate(cert.completed),
        cert.course ? `Course ${cert.course}` : '',
        cert.serial ? `Serial ${cert.serial}` : '',
        cert.issuer || '',
      ].filter(Boolean);
      metaEl.textContent = bits.join(' · ');
      noteEl.textContent = cert.note || '';
      noteEl.hidden = !cert.note;
      prevBtn.hidden = list.length < 2;
      nextBtn.hidden = list.length < 2;
    }

    function open(listName, index) {
      currentList = listName;
      show(index);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }

    function close() {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }

    document.querySelectorAll('.cert-card[data-index]').forEach((card) => {
      card.addEventListener('click', () => {
        open(card.dataset.list, Number(card.dataset.index));
      });
    });

    closeBtn?.addEventListener('click', close);
    prevBtn?.addEventListener('click', () => show(currentIndex - 1));
    nextBtn?.addEventListener('click', () => show(currentIndex + 1));

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });

    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(currentIndex - 1);
      if (event.key === 'ArrowRight') show(currentIndex + 1);
    });
  }

  async function init() {
    const trainingRoot = document.getElementById('cert-grid');
    const operatorRoot = document.getElementById('operator-grid');
    if (!trainingRoot || !operatorRoot) return;

    try {
      const res = await fetch(asset('security/certs.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load certificates');
      const data = await res.json();
      const training = Array.isArray(data.training) ? data.training : [];
      const operators = Array.isArray(data.operators) ? data.operators : [];

      setStats(training);
      trainingRoot.innerHTML = training.length
        ? training.map((cert, i) => certCard(cert, i, 'training')).join('')
        : '<p>Training certificates will appear here.</p>';
      operatorRoot.innerHTML = operators.length
        ? operators.map((cert, i) => certCard(cert, i, 'operators')).join('')
        : comingSoonCard();

      bindLightbox({ training, operators });
    } catch (err) {
      trainingRoot.innerHTML = `<p>Couldn’t load certificates. ${escapeHtml(err.message || err)}</p>`;
      operatorRoot.innerHTML = comingSoonCard();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
