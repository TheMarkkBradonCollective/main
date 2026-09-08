(function () {
  const cfg = window.RINK?.googleForm;
  if (!cfg) return;

  const shells = document.querySelectorAll("[data-google-form]");
  if (!shells.length) return;

  shells.forEach((shell) => {
    const minHeight = shell.dataset.minHeight || "1400";
    const loading = document.createElement("p");
    loading.className = "google-form-loading";
    loading.textContent = "Loading application…";

    const frame = document.createElement("iframe");
    frame.className = "google-form-frame";
    frame.title = "The Rink Studios team application";
    frame.src = cfg.embedUrl;
    frame.loading = "lazy";
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.setAttribute("allow", "fullscreen");
    frame.style.minHeight = `${minHeight}px`;

    frame.addEventListener("load", () => {
      loading.hidden = true;
      shell.classList.add("is-ready");
    });

    shell.append(loading, frame);
  });
})();
