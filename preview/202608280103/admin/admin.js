(function () {
  const $ = (s, r = document) => r.querySelector(s);

  function fillDinnerForm() {
    const d = window.MHPStore.state().dinner;
    const f = $("#dinner-form");
    f.name.value = d.name || "";
    f.description.value = d.description || "";
    f.main.value = d.main || "";
    f.sides.value = (d.sides || []).join(", ");
    f.bread.value = d.bread || "";
    f.price.value = d.price || 17;
    f.qty.value = d.qty || 32;
    f.sold.value = d.sold || 0;
    f.status.value = d.status || "available";
  }

  function dash() {
    const st = window.MHPStore.state();
    const remaining = Math.max(0, (st.dinner.qty || 0) - (st.dinner.sold || 0));
    const itemCount = window.MHP.categories.reduce((n, c) => n + c.items.length, 0);
    $("#dash-cards").innerHTML = `
      <article class="stat"><p>Today’s menu</p><strong>${itemCount}</strong><p>plates, dishes, sides, desserts, drinks</p></article>
      <article class="stat"><p>What’s for dinner?</p><strong>${remaining}</strong><p>${st.dinner.name}<br>remaining of ${st.dinner.qty}</p></article>
      <article class="stat"><p>Truck</p><strong>${st.location.status}</strong><p>${st.location.label}</p></article>`;
  }

  function menu() {
    const st = window.MHPStore.state();
    $("#admin-menu").innerHTML = window.MHP.categories.map((cat) => `
      <h3>${cat.name}</h3>
      ${cat.items.map((i) => {
        const status = st.items[i.id]?.status || i.status;
        return `<div class="admin-item"><span><strong>${i.name}</strong> · $${i.price}</span>
          <select data-item="${i.id}">
            <option value="available"${status === "available" ? " selected" : ""}>Available</option>
            <option value="almost"${status === "almost" ? " selected" : ""}>Almost gone</option>
            <option value="sold"${status === "sold" ? " selected" : ""}>Sold out</option>
            <option value="coming"${status === "coming" ? " selected" : ""}>Coming soon</option>
            <option value="hidden"${status === "hidden" ? " selected" : ""}>Hidden</option>
          </select></div>`;
      }).join("")}`).join("");
    $("#admin-menu").querySelectorAll("select[data-item]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const items = { ...window.MHPStore.state().items, [sel.dataset.item]: { status: sel.value } };
        window.MHPStore.save({ items });
        dash();
      });
    });
  }

  function truckForm() {
    const loc = window.MHPStore.state().location;
    const f = $("#truck-form");
    f.status.value = loc.status || "open";
    f.label.value = loc.label || "";
    f.address.value = loc.address || "";
    f.hours.value = loc.hours || "";
    f.mapQuery.value = loc.mapQuery || "";
  }

  document.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      $("#dinner-builder").classList.toggle("hidden", btn.dataset.open !== "dinner");
      if (btn.dataset.open === "dinner") fillDinnerForm();
      if (btn.dataset.open !== "dinner") {
        alert("Preview: plate/dish builders would open here. Dinner + sold-out controls are live in this demo.");
      }
    });
  });

  $("#dinner-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    window.MHPStore.save({
      dinner: {
        name: f.name.value,
        description: f.description.value,
        main: f.main.value,
        sides: f.sides.value.split(",").map((s) => s.trim()).filter(Boolean),
        bread: f.bread.value,
        price: Number(f.price.value),
        qty: Number(f.qty.value),
        sold: Number(f.sold.value),
        status: f.status.value
      }
    });
    dash();
    alert("Dinner special published. Open the public site to see it.");
  });

  $("#mark-sold")?.addEventListener("click", () => {
    const dinner = { ...window.MHPStore.state().dinner, status: "sold" };
    window.MHPStore.save({ dinner });
    fillDinnerForm();
    dash();
  });

  $("#truck-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    window.MHPStore.save({
      location: {
        status: f.status.value,
        label: f.label.value,
        address: f.address.value,
        hours: f.hours.value,
        mapQuery: f.mapQuery.value
      }
    });
    dash();
    alert("Truck status updated on the public site.");
  });

  dash();
  menu();
  truckForm();
  fillDinnerForm();
})();
