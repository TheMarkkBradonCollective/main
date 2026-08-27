(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const data = window.RINK;

  document.body.classList.add("is-loading");
  window.addEventListener("load", () => {
    setTimeout(() => {
      $("#loader")?.classList.add("is-done");
      document.body.classList.remove("is-loading");
    }, 900);
  });

  const today = data.days[new Date().getDay()];
  const tonight = $("#tonight-track");
  data.tonight.forEach((ev) => {
    tonight.insertAdjacentHTML("beforeend", cardHTML(ev, ev.day === "Friday" || ev.day === today));
  });

  const nights = $("#nights-track");
  function renderEvents(filter) {
    nights.innerHTML = "";
    data.events.filter((e) => filter === "all" || e.tag === filter).forEach((ev) => {
      nights.insertAdjacentHTML("beforeend", cardHTML(ev));
    });
  }
  renderEvents("all");
  $$("#event-filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("#event-filters button").forEach((b) => b.classList.remove("is-on"));
      btn.classList.add("is-on");
      renderEvents(btn.dataset.filter);
    });
  });

  function cardHTML(ev) {
    return `<article class="event-card" data-tag="${ev.tag || ""}">
      <p class="day">${ev.day}</p>
      <h3>${ev.title}</h3>
      <p>${ev.time}</p>
      <p>${ev.meta || ""}</p>
      <a class="cta" href="#schedule">Get tickets →</a>
    </article>`;
  }

  const tabs = $("#day-tabs");
  const panel = $("#day-panel");
  data.days.forEach((d) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = d;
    if (d === today) b.classList.add("is-on");
    b.addEventListener("click", () => {
      $$("#day-tabs button").forEach((x) => x.classList.remove("is-on"));
      b.classList.add("is-on");
      showDay(d);
    });
    tabs.appendChild(b);
  });
  function showDay(d) {
    const rows = data.schedule[d] || [];
    panel.innerHTML = rows.map((s) => `<div class="session"><div><strong>${s.title}</strong><small>${s.note}</small></div><div><small>${s.time}</small><br><a class="cta" href="#contact">Get tickets</a></div></div>`).join("") || "<p>Closed for public skate — private bookings available.</p>";
  }
  showDay(today);

  $$(".rental").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".rental").forEach((b) => b.classList.remove("is-on"));
      btn.classList.add("is-on");
      $("#rental-detail").textContent = data.rentals[btn.dataset.kind];
    });
  });

  const mapInfo = $("#map-info");
  $$(".map-zone").forEach((z) => {
    const activate = () => {
      $$(".map-zone").forEach((x) => x.classList.remove("is-on"));
      z.classList.add("is-on");
      const info = data.map[z.dataset.zone];
      mapInfo.innerHTML = `<h3>${info.title}</h3><p>${info.copy}</p>`;
    };
    z.addEventListener("mouseenter", activate);
    z.addEventListener("click", activate);
  });

  const form = $("#party-builder");
  const estimate = $("#party-estimate");
  function calcParty() {
    const guests = Number(form.guests.value || 0);
    const hours = form.pkg.value;
    const base = hours === "3" ? 675 : 550;
    const extraRate = hours === "3" ? 8 : 7;
    const extra = Math.max(0, guests - 75) * extraRate;
    estimate.textContent = `Estimated from $${base + extra} · request only — no payment on this preview.`;
  }
  form?.addEventListener("input", calcParty);
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Preview only — this would send a party request to The Rink.");
  });
  calcParty();

  $("#apply-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Preview only — live applications would go to hiring.");
  });
  $("#contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Preview only — live messages would email therinksacramento@gmail.com.");
  });

  const musicBtn = $("#music-toggle");
  const eq = $("#eq");
  let playing = false;
  let ctx;
  musicBtn?.addEventListener("click", async () => {
    playing = !playing;
    musicBtn.textContent = playing ? "Pause vibe" : "Play vibe";
    eq.classList.toggle("is-on", playing);
    $("#now-track").textContent = playing ? "Floor mix · lights up" : "Press play — audio never autoplays.";
    if (!playing) {
      if (ctx) ctx.suspend();
      return;
    }
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 110;
      gain.gain.value = 0.03;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 1400);
    } catch {
      /* preview can run muted */
    }
  });

  const toggle = $(".nav-toggle");
  toggle?.addEventListener("click", () => {
    const open = $("#nav-links").classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  $(".logo")?.addEventListener("mouseenter", (e) => e.currentTarget.classList.add("is-spin"));
  $(".logo")?.addEventListener("mouseleave", (e) => e.currentTarget.classList.remove("is-spin"));

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    $$("[data-word]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        onEnter: () => el.classList.add("is-on"),
        onLeaveBack: () => el.classList.remove("is-on")
      });
    });
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate: (self) => {
        if (window.RinkSkate) window.RinkSkate.progress = self.progress;
      }
    });
    $$("[data-scene]").forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: "top 55%",
        end: "bottom 45%",
        onToggle: (self) => {
          if (self.isActive) window.RinkSkate?.setScene(sec.dataset.scene);
        }
      });
    });
  }

  let idle;
  const wake = () => {
    clearTimeout(idle);
    idle = setTimeout(() => {
      document.body.classList.add("idle-roll");
      setTimeout(() => document.body.classList.remove("idle-roll"), 2500);
    }, 10000);
  };
  ["pointermove", "scroll", "keydown"].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
  wake();
})();
