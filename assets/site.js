/* Just Blake Media site behaviour. One file, every page.
   Everything here is progressive enhancement: the pages read and link
   without it. */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header: condense on scroll, mobile menu, disclosure menus ---------- */

  const header = document.querySelector(".site-header");
  if (header) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("is-condensed", window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const navGrid = document.querySelector(".nav-grid");
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.getElementById("primary-menu");
  const mobileQuery = window.matchMedia("(max-width: 767px)");

  const setMenu = (open, returnFocus = false) => {
    if (!menuButton || !navGrid) return;
    menuButton.setAttribute("aria-expanded", String(open));
    navGrid.classList.toggle("is-open", open);
    if (returnFocus) menuButton.focus();
  };

  if (navGrid && menuButton && menu) {
    menuButton.addEventListener("click", () => {
      setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a") && mobileQuery.matches) setMenu(false);
    });
    mobileQuery.addEventListener("change", () => setMenu(false));
  }

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
      if (open) {
        const first = panel.querySelector("a");
        if (first) first.focus();
      }
    });
    /* Open on hover for mouse users, with a short grace period so a
       diagonal move into the panel does not close it. */
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
    if (openButton) {
      closeAll();
      openButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".has-menu")) closeAll();
  });

  /* ---------- analytics events ---------- */

  const track = (name, data) => {
    if (typeof window.va === "function") window.va("event", { name, data });
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, data || {}));
  };
  document.querySelectorAll('a[href*="calendar.google.com"]').forEach((link) => {
    link.addEventListener("click", () => track("book_call_click", { label: link.textContent.trim(), page: location.pathname }));
  });
  document.querySelectorAll(".door").forEach((door) => {
    door.addEventListener("click", () => track("door_click", { label: door.querySelector(".door-tag").textContent.trim() }));
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

  /* ---------- week ticks (home story band) ---------- */

  const ticks = document.querySelector(".ticks");
  if (ticks && !ticks.children.length) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 52; i += 1) {
      const tick = document.createElement("i");
      tick.style.setProperty("--i", String(i));
      if (i < 13) tick.classList.add("lit");
      frag.appendChild(tick);
    }
    ticks.appendChild(frag);
  }

  /* ---------- reveals ---------- */

  const heroReveal = document.querySelectorAll(".hero-copy [data-reveal], .page-hero [data-reveal]");
  if (heroReveal.length && !reduceMotion) {
    root.classList.add("reveal-ready");
    heroReveal.forEach((el) => el.classList.add("reveal-pending"));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroReveal.forEach((el) => el.classList.remove("reveal-pending"));
      });
    });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const revealItems = document.querySelectorAll("main > section:not(.hero):not(.page-hero)");
  if (revealItems.length) {
    root.classList.add("reveal-ready");
    let observer;
    const reveal = (el) => {
      el.classList.remove("reveal-pending");
      if (observer) observer.unobserve(el);
    };
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, { rootMargin: "0px", threshold: 0.05 });
    revealItems.forEach((item) => {
      item.dataset.reveal = "";
      item.classList.add("reveal-pending");
      observer.observe(item);
    });
    const revealRemaining = () => {
      if (window.innerHeight + window.scrollY < document.body.scrollHeight - 2) return;
      document.querySelectorAll(".reveal-pending").forEach(reveal);
    };
    window.addEventListener("scroll", revealRemaining, { passive: true });
    window.addEventListener("resize", revealRemaining, { passive: true });
    /* Backstop: whatever the observer does, nothing stays hidden for long. */
    setTimeout(() => document.querySelectorAll(".reveal-pending").forEach(reveal), 2500);
  }

  const storyVisual = document.querySelector(".story-visual");
  if (storyVisual) {
    const lanes = storyVisual.querySelector(".lanes");
    if (lanes) lanes.classList.add("lanes-ready");
    storyVisual.classList.add("ticks-ready");
    const storyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (lanes) lanes.classList.add("is-drawn");
        storyVisual.classList.add("is-lit");
        storyObserver.disconnect();
      });
    }, { threshold: 0.35 });
    storyObserver.observe(storyVisual);
  }

  /* ---------- counters ---------- */

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
        el.textContent = formatCount(el, 0);
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
    if (err) {
      if (on) input.setAttribute("aria-describedby", err.id);
      else input.removeAttribute("aria-describedby");
    }
  };
  const validate = (input) => {
    const ok = input.checkValidity();
    setError(input, !ok);
    return ok;
  };
  const required = () => Array.from(form.querySelectorAll("[required]"));
  required().forEach((input) => {
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => {
      if (fieldOf(input) && fieldOf(input).classList.contains("has-error")) validate(input);
    });
  });

  const show = (message, heading, isError) => {
    status.innerHTML = "";
    if (heading) {
      const strong = document.createElement("strong");
      strong.textContent = heading;
      status.appendChild(strong);
    }
    status.appendChild(document.createTextNode(message));
    status.classList.toggle("is-error", Boolean(isError));
    status.hidden = false;
  };

  form.addEventListener("submit", async (event) => {
    if (trap && trap.value) {
      event.preventDefault();
      return;
    }
    const invalid = required().filter((input) => !validate(input));
    if (invalid.length) {
      event.preventDefault();
      invalid[0].focus();
      return;
    }
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
