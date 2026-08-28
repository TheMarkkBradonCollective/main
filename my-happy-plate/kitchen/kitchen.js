(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const flow = ["new", "confirmed", "cooking", "ready", "picked_up"];

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
    const remaining = window.MHPStore.remainingDinner();
    const openOrders = st.orders.filter((o) => !["picked_up", "canceled"].includes(o.status)).length;
    $("#dash-cards").innerHTML = `
      <article class="stat"><p>Open pre-orders</p><strong>${openOrders}</strong><p>${st.orders.length} today</p></article>
      <article class="stat"><p>Dinner left</p><strong>${remaining}</strong><p>${st.dinner.name}</p></article>
      <article class="stat"><p>Truck</p><strong>${st.location.status}</strong><p>${st.location.label}</p></article>`;
  }

  function orders() {
    const list = window.MHPStore.state().orders;
    const board = $("#order-board");
    if (!list.length) {
      board.innerHTML = `<p class="sides">No pre-orders yet. When someone holds a plate, it shows up here.</p>`;
      return;
    }
    board.innerHTML = list.map((o) => {
      const when = o.pickupAt ? new Date(o.pickupAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
      const lines = o.items.map((i) => `${i.qty}× ${i.name}`).join(" · ");
      const next = flow[flow.indexOf(o.status) + 1];
      return `<article class="admin-item order-ticket">
        <div>
          <strong>${o.id}</strong> · ${o.status.replace("_", " ")}
          <p>${o.name} · ${o.phone} · pickup ${when}</p>
          <p>${lines}</p>
          ${o.note ? `<p>Note: ${o.note}</p>` : ""}
          <p>$${Number(o.total).toFixed(2)} · pay at pickup</p>
        </div>
        <div class="actions">
          ${next ? `<button class="btn btn-primary" type="button" data-id="${o.id}" data-status="${next}">Mark ${next.replace("_", " ")}</button>` : ""}
          ${o.status !== "canceled" && o.status !== "picked_up" ? `<button class="btn btn-ghost" type="button" data-id="${o.id}" data-status="canceled">Cancel</button>` : ""}
        </div>
      </article>`;
    }).join("");
    board.querySelectorAll("button[data-id]").forEach((b) => {
      b.onclick = () => {
        window.MHPStore.setOrderStatus(b.dataset.id, b.dataset.status);
        dash();
        orders();
      };
    });
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
  });

  $("#mark-sold")?.addEventListener("click", () => {
    window.MHPStore.save({ dinner: { ...window.MHPStore.state().dinner, status: "sold" } });
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
  });

  window.addEventListener("mhp-update", () => { dash(); orders(); });
  dash();
  orders();
  menu();
  truckForm();
  fillDinnerForm();
})();
