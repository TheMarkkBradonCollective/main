(function () {
  const timeline = document.getElementById('timeline');
  if (!timeline || timeline.tagName !== 'DETAILS') return;

  function openFromHash() {
    if (window.location.hash === '#timeline') {
      timeline.open = true;
      window.requestAnimationFrame(() => {
        timeline.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
