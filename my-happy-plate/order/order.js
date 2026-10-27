(function () {
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  if (params.get("add")) {
    window.MHPStore.addToCart({
      id: params.get("add"),
      name: params.get("name") || "Plate",
      price: Number(params.get("price") || 0),
      qty: 1
    });
    history.replaceState({}, "", "index.html");
  }

  function slots() {
    const loc = window.MHPStore.state().location;
    const start = loc.openHour || 11;
    const end = loc.closeHour || 19;
    const now = new Date();
    const out = [];
    for (let h = start; h < end; h++) {
      for (const m of [0, 15, 30, 45]) {
        const t = new Date();
        t.setHours(h, m, 0, 0);
        if (t.getTime() < now.getTime() + 10 * 60 * 1000) continue;
        const label = t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        out.push({ value: t.toISOString(), label });
      }
    }
    return out;
  }

  function renderCart() {
    const cart = window.MHPStore.cart();
    const box = $("#cart");
    if (!cart.length) {
      box.innerHTML = `<p>Your bag is empty. Grab tonight’s dinner or anything on the menu.</p>`;
      $("#order-total").textContent = "";
      return;
    }
    const total = cart.reduce((n, i) => n + i.price * i.qty, 0);
    box.innerHTML = cart.map((i, idx) => `
      <div class="menu-item">
        <div><strong>${i.name}</strong><p>$${i.price} × ${i.qty}</p></div>
        <div>
          <button class="btn btn-ghost" type="button" data-minus="${idx}">−</button>
          <button class="btn btn-ghost" type="button" data-plus="${idx}">+</button>
        </div>
      </div>`).join("");
    $("#order-total").textContent = `Total due at pickup: $${total.toFixed(2)}`;
    box.querySelectorAll("[data-minus]").forEach((b) => b.onclick = () => bump(+b.dataset.minus, -1));
    box.querySelectorAll("[data-plus]").forEach((b) => b.onclick = () => bump(+b.dataset.plus, 1));
  }

  function bump(i, d) {
    const cart = window.MHPStore.cart();
    cart[i].qty += d;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    window.MHPStore.setCart(cart);
    renderCart();
  }

  const sel = document.querySelector("select[name=pickup]");
  slots().forEach((s) => {
    const o = document.createElement("option");
    o.value = s.value;
    o.textContent = s.label;
    sel.appendChild(o);
  });
  if (!sel.options.length) {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = "Pickup windows resume at open";
    sel.appendChild(o);
  }

  renderCart();
  window.addEventListener("mhp-cart", renderCart);

  document.querySelector(".nav-toggle")?.addEventListener("click", () => {
    const links = document.getElementById("nav-links");
    const open = links.classList.toggle("is-open");
    document.querySelector(".nav-toggle").setAttribute("aria-expanded", String(open));
  });

  $("#order-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const cart = window.MHPStore.cart();
    if (!cart.length) {
      alert("Add a plate first.");
      return;
    }
    const f = e.target;
    try {
      const order = window.MHPStore.placeOrder({
        name: f.name.value.trim(),
        phone: f.phone.value.trim(),
        note: f.note.value.trim(),
        pickupAt: f.pickup.value,
        lines: cart
      });
      $("#order-form").classList.add("hidden");
      document.querySelector(".order-layout").classList.add("hidden");
      $("#confirm").classList.remove("hidden");
      $("#confirm-code").textContent = order.id;
      const when = new Date(order.pickupAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      $("#confirm-copy").textContent = `${order.name}, Tyrone’s got you for ${when}. Show this code at the window. Pay there.`;
    } catch (err) {
      alert(err.message);
    }
  });
})();
