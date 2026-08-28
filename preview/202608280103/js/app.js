(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function statusLabel(s) {
    return {
      available: "Available today",
      almost: "Almost gone",
      sold: "Sold out",
      coming: "Coming soon",
      open: "We’re open ❤️",
      closed: "Closed for now",
      soon: "Opening soon"
    }[s] || s;
  }

  function render() {
    const st = window.MHPStore.state();
    const dinner = st.dinner;
    const loc = st.location;
    document.body.dataset.season = st.season || "fall";

    const remaining = Math.max(0, (dinner.qty || 0) - (dinner.sold || 0));
    const dinnerCard = $("#dinner-card");
    if (dinner.status === "sold" || remaining === 0) {
      dinnerCard.innerHTML = `
        <p class="dinner-heart">❤️</p>
        <div class="sold-out-msg">
          <p class="kicker">You guys ate it all!</p>
          <h2>Tonight’s dinner is sold out</h2>
          <p>Check back tomorrow for another Happy Plate.</p>
        </div>`;
    } else {
      dinnerCard.innerHTML = `
        <p class="kicker dinner-heart">❤️ What’s for dinner?</p>
        <h2>Tonight’s Happy Plate</h2>
        <div class="dinner-plate">
          <h3>${dinner.name}</h3>
          <p>${dinner.description || ""}</p>
          <p class="sides">${[dinner.main, ...(dinner.sides || []), dinner.bread].filter(Boolean).join(" · ")}</p>
          <p class="price">$${Number(dinner.price).toFixed(0)}</p>
          <p class="badge">${statusLabel(dinner.status)}${remaining ? ` · ${remaining} remaining` : ""}</p>
          <p><a class="btn btn-primary" href="#find">Get your Happy Plate</a></p>
        </div>`;
    }

    $("#happy-card").innerHTML = `
      <h3>${window.MHP.happyPlate.name}</h3>
      <p class="sides">${window.MHP.happyPlate.sides}</p>
      <p class="price">$${window.MHP.happyPlate.price}</p>
      <p><a class="btn btn-green" href="#find">Get your Happy Plate</a></p>`;

    $("#menu-date").textContent = `Today’s menu · ${window.MHP.menuDate}`;
    $("#menu-grid").innerHTML = window.MHP.categories.map((cat) => {
      const items = cat.items.filter((i) => (st.items[i.id]?.status || i.status) !== "hidden");
      return `<div class="menu-cat"><h3>${cat.name}</h3>${items.map((i) => {
        const status = st.items[i.id]?.status || i.status;
        return `<article class="menu-item">
          <div><strong>${i.name}</strong>${i.desc ? `<p>${i.desc}</p>` : ""}
          <span class="badge ${status}">${statusLabel(status)}</span></div>
          <div>$${i.price}</div>
        </article>`;
      }).join("")}</div>`;
    }).join("");

    $("#truck-status").textContent = statusLabel(loc.status);
    $("#truck-status").className = "status-pill" + (loc.status === "open" ? "" : " closed");
    $("#truck-label").textContent = loc.label || "We’re here today";
    $("#truck-address").textContent = loc.address || "";
    $("#truck-hours").textContent = loc.hours || "";
    const q = encodeURIComponent(loc.mapQuery || loc.address || "Sacramento CA");
    $("#directions").href = `https://maps.google.com/?q=${q}`;
    $("#gmap").src = `https://maps.google.com/maps?q=${q}&output=embed`;

    $("#history").innerHTML = window.MHP.history.map((h) =>
      `<article class="fav"><strong>${h.date}</strong><p>${h.name}</p></article>`
    ).join("");
  }

  render();
  window.addEventListener("mhp-update", render);
  window.addEventListener("storage", (e) => { if (e.key === window.MHPStore.key) render(); });

  $(".nav-toggle")?.addEventListener("click", () => {
    const open = $("#nav-links").classList.toggle("is-open");
    $(".nav-toggle").setAttribute("aria-expanded", String(open));
  });

  $("#contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Preview only — live notes would go to Tyrone.");
  });
})();
