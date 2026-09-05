/* Just Blake Media site behaviour. One file, every page. Progressive
   enhancement only: every page reads and links without it. */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileQuery = window.matchMedia("(max-width: 767px)");

  /* ---------- header: hide on scroll down, reveal on scroll up ---------- */

  const header = document.querySelector(".site-header");
  if (header) {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const menuOpen = document.querySelector(".nav-grid.is-open");
        if (menuOpen || y < 80) header.classList.remove("is-hidden");
        else if (y > lastY + 4) header.classList.add("is-hidden");
        else if (y < lastY - 4) header.classList.remove("is-hidden");
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile drawer ---------- */

  const navGrid = document.querySelector(".nav-grid");
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.getElementById("primary-menu");
  let backdrop = document.querySelector(".drawer-backdrop");
  if (!backdrop && navGrid) {
    backdrop = document.createElement("div");
    backdrop.className = "drawer-backdrop";
    document.body.appendChild(backdrop);
  }
  const setMenu = (open, returnFocus = false) => {
    if (!menuButton || !navGrid) return;
    menuButton.setAttribute("aria-expanded", String(open));
    navGrid.classList.toggle("is-open", open);
    if (backdrop) backdrop.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      const first = menu.querySelector("a, button");
      if (first) first.focus();
    } else if (returnFocus) menuButton.focus();
  };
  if (navGrid && menuButton && menu) {
    menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
    const closeBtn = menu.querySelector(".drawer-close");
    if (closeBtn) closeBtn.addEventListener("click", () => setMenu(false, true));
    if (backdrop) backdrop.addEventListener("click", () => setMenu(false, true));
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a") && mobileQuery.matches) setMenu(false);
    });
    mobileQuery.addEventListener("change", () => setMenu(false));
  }

  /* ---------- disclosure menus (desktop dropdown, mobile accordion) ---------- */

  const disclosures = Array.from(document.querySelectorAll(".nav-disclosure"));
  const closeAll = (except) => {
    disclosures.forEach((button) => {
      if (button === except) return;
      button.setAttribute("aria-expanded", "false");
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (panel) panel.classList.remove("is-open");
    });
  };
  disclosures.forEach((button) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      closeAll(button);
      button.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
    });
    const item = button.closest(".has-menu");
    let closeTimer;
    item.addEventListener("mouseenter", () => {
      if (mobileQuery.matches) return;
      clearTimeout(closeTimer);
      closeAll(button);
      button.setAttribute("aria-expanded", "true");
      panel.classList.add("is-open");
    });
    item.addEventListener("mouseleave", () => {
      if (mobileQuery.matches) return;
      closeTimer = setTimeout(() => {
        button.setAttribute("aria-expanded", "false");
        panel.classList.remove("is-open");
      }, 160);
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (menuButton && menuButton.getAttribute("aria-expanded") === "true") setMenu(false, true);
    const openButton = disclosures.find((b) => b.getAttribute("aria-expanded") === "true");
    if (openButton) { closeAll(); openButton.focus(); }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".has-menu") && !mobileQuery.matches) closeAll();
  });

  /* ---------- analytics events ---------- */

  const track = (name, data) => {
    if (typeof window.va === "function") window.va("event", { name, data });
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, data || {}));
  };
  document.querySelectorAll('a[href*="calendar.google.com"]').forEach((link) => {
    link.addEventListener("click", () => track("book_call_click", { label: link.textContent.trim(), page: location.pathname }));
  });
  document.querySelectorAll("[data-door]").forEach((door) => {
    door.addEventListener("click", () => track("door_click", { label: door.getAttribute("data-door") }));
  });

  /* ---------- carousels: centred card, blurred neighbours, arrows, keys, swipe ---------- */

  document.querySelectorAll(".carousel").forEach((carousel) => {
    const items = Array.from(carousel.querySelectorAll(".carousel-item"));
    if (items.length < 2) { items.forEach((i) => i.classList.add("is-active")); return; }
    let index = 0;
    const render = () => {
      items.forEach((item, i) => {
        item.classList.remove("is-active", "is-prev", "is-next");
        item.setAttribute("aria-hidden", "true");
        if (i === index) { item.classList.add("is-active"); item.removeAttribute("aria-hidden"); }
        else if (i === (index - 1 + items.length) % items.length) item.classList.add("is-prev");
        else if (i === (index + 1) % items.length) item.classList.add("is-next");
        item.querySelectorAll("a, button").forEach((el) => { el.tabIndex = i === index ? 0 : -1; });
      });
      const status = carousel.querySelector(".carousel-status");
      if (status) status.textContent = (index + 1) + " of " + items.length;
    };
    const go = (delta) => { index = (index + delta + items.length) % items.length; render(); };
    carousel.querySelectorAll("[data-prev]").forEach((b) => b.addEventListener("click", () => go(-1)));
    carousel.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", () => go(1)));
    items.forEach((item, i) => {
      item.addEventListener("click", (event) => {
        if (i !== index) { event.preventDefault(); index = i; render(); }
      });
    });
    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
    });
    let startX = null;
    carousel.addEventListener("pointerdown", (e) => { startX = e.clientX; });
    carousel.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      startX = null;
    });
    render();
  });

  /* ---------- tabs ---------- */

  document.querySelectorAll(".tabs").forEach((tabs) => {
    const tabButtons = Array.from(tabs.querySelectorAll(".tab"));
    const panels = tabButtons.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const select = (index, focus) => {
      tabButtons.forEach((t, i) => {
        const on = i === index;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus) tabButtons[index].focus();
    };
    tabButtons.forEach((t, i) => {
      t.addEventListener("click", () => select(i, false));
      t.addEventListener("keydown", (event) => {
        const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!delta) return;
        event.preventDefault();
        select((i + delta + tabButtons.length) % tabButtons.length, true);
      });
    });
  });

  /* ---------- week ticks ---------- */

  const ticks = document.querySelector(".ticks");
  if (ticks && !ticks.children.length) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 52; i += 1) {
      const tick = document.createElement("i");
      if (i < 13) tick.classList.add("lit");
      frag.appendChild(tick);
    }
    ticks.appendChild(frag);
  }

  /* ---------- marquee: duplicate the list once so the loop is seamless ---------- */

  document.querySelectorAll(".marquee-track").forEach((track) => {
    const list = track.querySelector("ul");
    if (list && track.children.length === 1) track.appendChild(list.cloneNode(true)).setAttribute("aria-hidden", "true");
  });

  /* ---------- counters ---------- */

  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const countEls = document.querySelectorAll(".num[data-count]");
  if (countEls.length) {
    const formatCount = (el, value) => {
      const prefix = el.getAttribute("data-prefix") || "";
      const suffix = el.getAttribute("data-suffix") || "";
      const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      return prefix + value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    };
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        const el = entry.target;
        const target = parseFloat(el.getAttribute("data-count"));
        const duration = 1200;
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = formatCount(el, target * eased);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    countEls.forEach((el) => countObserver.observe(el));
  }
})();

/* ---------- audit form ---------- */
(() => {
  const form = document.getElementById("audit-form");
  if (!form) return;
  const status = document.getElementById("audit-status");
  const submit = document.getElementById("audit-submit");
  const key = form.querySelector('input[name="access_key"]');
  const trap = form.querySelector('input[name="botcheck"]');
  const configured = key && key.value && !key.value.startsWith("REPLACE_WITH");
  const submitLabel = submit ? submit.textContent : "";
  const fieldOf = (input) => input.closest(".field");
  const setError = (input, on) => {
    const field = fieldOf(input);
    if (!field) return;
    field.classList.toggle("has-error", on);
    input.setAttribute("aria-invalid", String(on));
    const err = field.querySelector(".field-error");
    if (err) { if (on) input.setAttribute("aria-describedby", err.id); else input.removeAttribute("aria-describedby"); }
  };
  const validate = (input) => { const ok = input.checkValidity(); setError(input, !ok); return ok; };
  const required = () => Array.from(form.querySelectorAll("[required]"));
  required().forEach((input) => {
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => { if (fieldOf(input) && fieldOf(input).classList.contains("has-error")) validate(input); });
  });
  const show = (message, heading, isError) => {
    status.innerHTML = "";
    if (heading) { const strong = document.createElement("strong"); strong.textContent = heading; status.appendChild(strong); }
    status.appendChild(document.createTextNode(message));
    status.classList.toggle("is-error", Boolean(isError));
    status.hidden = false;
  };
  form.addEventListener("submit", async (event) => {
    if (trap && trap.value) { event.preventDefault(); return; }
    const invalid = required().filter((input) => !validate(input));
    if (invalid.length) { event.preventDefault(); invalid[0].focus(); return; }
    if (!configured) {
      event.preventDefault();
      show("This form is not connected yet. Email justin@justblakemedia.com directly and it will reach me just as fast.", "Not set up yet.", true);
      return;
    }
    event.preventDefault();
    submit.setAttribute("aria-disabled", "true");
    submit.textContent = "Sending";
    try {
      const response = await fetch(form.action, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
      if (!response.ok) throw new Error("Request failed with " + response.status);
      form.querySelectorAll(".field").forEach((f) => f.remove());
      submit.remove();
      show("I have it. I will read the account over and write back within two business days, from my own address.", "Request received.", false);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "audit_request_submit" });
      if (window.va) window.va("event", { name: "audit_request_submit" });
    } catch (error) {
      submit.removeAttribute("aria-disabled");
      submit.textContent = submitLabel;
      show("That did not send. Email justin@justblakemedia.com and I will pick it up there.", "Something went wrong.", true);
    }
  });
})();
