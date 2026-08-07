/* ==================================================
   PER4MANCE X — site behaviour
   ================================================== */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isMobile = window.matchMedia("(max-width: 640px)").matches;
  var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  /* ==================================================
     EDITABLE DATA — testimonials
     Add real, client-approved testimonials to this array.
     Fields: quote, name, role, company, projectType, image (URL or null), rating (1-5 or null).
     While the array holds only the placeholder entry, the slider
     shows the awaiting-feedback state with no invented reviews.
     ================================================== */
  var TESTIMONIALS = [
    {
      placeholder: true,
      quote: "Verified client feedback will be added here once approved.",
      name: "Client Name",
      role: "Role",
      company: "Company",
      projectType: "Project Type",
      image: null,
      rating: null
    }
    /* Example of a real entry:
    {
      quote: "Approved quote text goes here.",
      name: "Jane Citizen",
      role: "Marketing Director",
      company: "Example Developments",
      projectType: "Residential Launch",
      image: "assets/img/testimonial-jane.jpg",
      rating: 5
    }
    */
  ];

  /* ---------- Split headings into masked words ---------- */
  function splitHeadings() {
    document.querySelectorAll(".split-reveal").forEach(function (el) {
      if (el.dataset.split) return;
      el.dataset.split = "1";
      var nodes = Array.prototype.slice.call(el.childNodes);
      el.textContent = "";
      var i = 0;
      function addWord(content) {
        var mask = document.createElement("span");
        mask.className = "word";
        var inner = document.createElement("span");
        inner.style.setProperty("--w", i++);
        if (typeof content === "string") inner.textContent = content;
        else inner.appendChild(content);
        mask.appendChild(inner);
        el.appendChild(mask);
        el.appendChild(document.createTextNode(" "));
      }
      nodes.forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/\s+/).filter(Boolean).forEach(function (word) { addWord(word); });
        } else if (node.nodeType === 1) {
          addWord(node);
        }
      });
    });
  }

  /* ---------- Full-screen logo opening (plays on every load) ---------- */
  var openingDone = false;
  function finishOpening() {
    if (openingDone) return;
    openingDone = true;
    var o = document.getElementById("opening");
    if (o) o.classList.add("is-done");
    document.documentElement.classList.remove("is-loading");
    initReveals();
    revealHero(isMobile ? 100 : 180);
    initCursor();
  }
  function runOpening() {
    var o = document.getElementById("opening");
    if (!o) { finishOpening(); return; }
    try {
      setTimeout(function () { o.classList.add("is-logo"); }, 250);
      setTimeout(function () { o.classList.add("is-open"); }, prefersReducedMotion ? 700 : 950);
      setTimeout(finishOpening, prefersReducedMotion ? 1000 : 1950);
    } catch (e) {
      finishOpening();
    }
    setTimeout(finishOpening, 4000); /* safety net — the overlay can never get stuck */
  }

  /* Stagger the hero content in as the opening completes */
  function revealHero(delay) {
    setTimeout(function () {
      document.querySelectorAll(".hero .reveal, .hero .split-reveal").forEach(function (el) {
        el.classList.add("in-view");
      });
    }, delay);
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  function initReveals() {
    var targets = document.querySelectorAll(".reveal, .split-reveal, .capability");
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      targets.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) {
      // Hero elements are staged by the intro sequence instead
      if (el.closest(".hero")) return;
      io.observe(el);
    });
  }

  /* ---------- Header scroll state + active nav ---------- */
  function initHeader() {
    var header = document.getElementById("siteHeader");
    var links = document.querySelectorAll(".nav-link");
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("href");
      if (id && id.charAt(0) === "#") {
        var sec = document.querySelector(id);
        if (sec) sections.push({ el: sec, link: link });
      }
    });

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
      var pos = window.scrollY + window.innerHeight * 0.35;
      var current = sections[0];
      sections.forEach(function (s) {
        if (s.el.offsetTop <= pos) current = s;
      });
      links.forEach(function (l) { l.classList.remove("is-active"); });
      if (current) current.link.classList.add("is-active");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile navigation ---------- */
  function initMobileNav() {
    var toggle = document.getElementById("menuToggle");
    var nav = document.getElementById("mobileNav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      nav.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("nav-open", open);
    }
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false);
    });
  }

  /* ---------- Scroll progress + process line ---------- */
  function initProgress() {
    var bar = document.getElementById("scrollProgressBar");
    var processBar = document.getElementById("processProgress");
    var processSection = document.getElementById("approach");
    var processGrid = document.querySelector(".process__grid");
    var ticking = false;

    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      if (bar) bar.style.transform = "scaleX(" + p + ")";

      if (processSection) {
        var rect = processSection.getBoundingClientRect();
        var total = rect.height + window.innerHeight * 0.2;
        var passed = window.innerHeight * 0.8 - rect.top;
        var sp = Math.min(1, Math.max(0, passed / total));
        if (processBar) processBar.style.transform = "scaleX(" + sp + ")";
        if (processGrid) processGrid.style.setProperty("--timeline", (sp * 100).toFixed(1) + "%");
      }
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Subtle parallax on decorated elements ---------- */
  function initParallax() {
    if (prefersReducedMotion) return;
    var els = document.querySelectorAll("[data-parallax]");
    if (!els.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        var depth = parseFloat(el.dataset.parallax) || 16;
        var centre = rect.top + rect.height / 2;
        var offset = ((centre - vh / 2) / vh) * -depth;
        el.style.setProperty("--py", offset.toFixed(2) + "px");
      });
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Hero collage cursor drift (desktop) ---------- */
  function initHeroDrift() {
    if (!isFinePointer || prefersReducedMotion) return;
    var visual = document.getElementById("heroVisual");
    if (!visual) return;
    var layers = visual.querySelectorAll(".hero__img, .hero__deco");
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    visual.closest(".hero").addEventListener("mousemove", function (e) {
      var rect = visual.getBoundingClientRect();
      tx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      ty = (e.clientY - rect.top - rect.height / 2) / rect.height;
      if (!raf) raf = requestAnimationFrame(step);
    });
    function step() {
      raf = null;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(function (layer, i) {
        var depth = 6 + i * 3;
        var py = layer.style.getPropertyValue("--py") || "0px";
        layer.style.transform =
          "translate(" + (cx * depth).toFixed(2) + "px, calc(" + (cy * depth).toFixed(2) + "px + " + py + "))";
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(step);
      }
    }
  }

  /* ---------- Magnetic buttons (desktop) ---------- */
  function initMagnetic() {
    if (!isFinePointer || prefersReducedMotion) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      var strength = 14;
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
        var y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
        btn.style.transform = "translate(" + x + "px, " + y + "px) scale(1.02)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform 380ms " + EASE;
        btn.style.transform = "";
        setTimeout(function () { btn.style.transition = ""; }, 380);
      });
    });
  }

  /* ---------- Logo cursor follower (desktop) ---------- */
  function initCursor() {
    if (!isFinePointer) return;
    var el = document.getElementById("logoCursor");
    if (!el) return;
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var cx = tx, cy = ty, visible = false, raf = null;
    var lerp = prefersReducedMotion ? 1 : 0.35;

    document.documentElement.classList.add("custom-cursor");

    function step() {
      raf = null;
      cx += (tx - cx) * lerp;
      cy += (ty - cy) * lerp;
      el.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)";
      if (Math.abs(tx - cx) > 0.2 || Math.abs(ty - cy) > 0.2) raf = requestAnimationFrame(step);
    }
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!visible) {
        visible = true;
        cx = tx; cy = ty;
        el.classList.add("is-visible");
      }
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    document.addEventListener("mouseover", function (e) {
      var t = e.target;
      el.classList.toggle("is-hover", !!(t.closest && t.closest("a, button")));
    });
    document.addEventListener("mousedown", function () { el.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { el.classList.remove("is-down"); });
    document.documentElement.addEventListener("mouseleave", function () {
      el.classList.remove("is-visible"); visible = false;
    });
    window.addEventListener("blur", function () {
      el.classList.remove("is-visible"); visible = false;
    });
  }

  /* ---------- Image fallback ---------- */
  function initImageFallback() {
    document.querySelectorAll(".img-frame img").forEach(function (img) {
      img.addEventListener("error", function () {
        var frame = img.closest(".img-frame");
        if (frame) frame.classList.add("img-fallback");
      });
      if (img.complete && img.naturalWidth === 0 && img.src) {
        var frame = img.closest(".img-frame");
        if (frame) frame.classList.add("img-fallback");
      }
    });
  }

  /* ---------- Testimonial slider ---------- */
  function initTestimonials() {
    var viewport = document.getElementById("testimonialViewport");
    var dotsWrap = document.getElementById("testimonialDots");
    var prev = document.getElementById("testimonialPrev");
    var next = document.getElementById("testimonialNext");
    if (!viewport) return;
    var index = 0;

    function starText(rating) {
      var out = "";
      for (var i = 0; i < rating; i++) out += "★";
      return out;
    }

    TESTIMONIALS.forEach(function (t, i) {
      var slide = document.createElement("article");
      slide.className = "testimonial-slide" + (i === 0 ? " is-active" : "");
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", (i + 1) + " of " + TESTIMONIALS.length);

      var quote = document.createElement("p");
      quote.className = "testimonial-slide__quote";
      quote.textContent = t.quote;
      slide.appendChild(quote);

      var meta = document.createElement("div");
      meta.className = "testimonial-slide__meta";

      var avatar = document.createElement("span");
      avatar.className = "testimonial-slide__avatar";
      if (t.image) {
        var img = document.createElement("img");
        img.src = t.image;
        img.alt = t.name;
        img.loading = "lazy";
        avatar.appendChild(img);
      } else {
        avatar.innerHTML = '<img src="assets/img/logo-x.png" alt="" style="width:18px;height:18px;object-fit:contain">';
      }
      meta.appendChild(avatar);

      var who = document.createElement("div");
      var name = document.createElement("p");
      name.className = "testimonial-slide__name";
      name.textContent = t.placeholder ? "Awaiting verified feedback" : t.name;
      var role = document.createElement("p");
      role.className = "testimonial-slide__role";
      role.textContent = t.placeholder
        ? "Client details will appear here"
        : [t.role, t.company, t.projectType].filter(Boolean).join(" · ");
      who.appendChild(name);
      who.appendChild(role);
      meta.appendChild(who);

      if (t.rating) {
        var stars = document.createElement("span");
        stars.className = "testimonial-slide__stars";
        stars.setAttribute("aria-label", t.rating + " out of 5 stars");
        stars.textContent = starText(t.rating);
        meta.appendChild(stars);
      }
      slide.appendChild(meta);
      viewport.appendChild(slide);

      var dot = document.createElement("button");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Go to testimonial " + (i + 1));
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });

    var slides = viewport.querySelectorAll(".testimonial-slide");
    var dots = dotsWrap.querySelectorAll("button");

    function goTo(i) {
      index = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
      slides.forEach(function (s, j) { s.classList.toggle("is-active", j === index); });
      dots.forEach(function (d, j) { d.classList.toggle("is-active", j === index); });
    }
    function updateDisabled() {
      var single = TESTIMONIALS.length <= 1;
      prev.disabled = single;
      next.disabled = single;
    }
    prev.addEventListener("click", function () { goTo(index - 1); });
    next.addEventListener("click", function () { goTo(index + 1); });
    updateDisabled();
  }

  /* ---------- Contact form validation ---------- */
  function initForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var status = document.getElementById("formStatus");

    function fieldWrap(input) { return input.closest(".field"); }

    function validateField(input) {
      var wrap = fieldWrap(input);
      var error = wrap.querySelector(".field__error");
      var message = "";
      var value = input.value.trim();

      if (input.hasAttribute("required") && !value) {
        message = "This field is required.";
      } else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        message = "Please enter a valid email address.";
      } else if (input.type === "tel" && value && !/^[\d\s()+\-]{6,}$/.test(value)) {
        message = "Please enter a valid phone number.";
      }
      wrap.classList.toggle("has-error", !!message);
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) error.textContent = message;
      return !message;
    }

    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        if (fieldWrap(input).classList.contains("has-error")) validateField(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      var firstInvalid = null;
      form.querySelectorAll("input, select, textarea").forEach(function (input) {
        if (!validateField(input)) {
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });
      if (!valid) {
        status.textContent = "Please review the highlighted fields.";
        status.className = "contact-form__status is-error";
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      /* Connect a real endpoint here (CRM, form handler or email service).
         Example: fetch("/api/enquiry", { method: "POST", body: new FormData(form) }) */
      status.textContent = "Thanks — your enquiry has been captured. We will be in touch shortly.";
      status.className = "contact-form__status is-success";
      form.reset();
    });
  }


  /* ---------- Service selector → WhatsApp request ---------- */
  function initServiceSelect() {
    var grid = document.getElementById("serviceGrid");
    var bar = document.getElementById("requestBar");
    if (!grid || !bar) return;
    var countEl = document.getElementById("requestCount");
    var listEl = document.getElementById("requestList");
    var sendBtn = document.getElementById("requestSend");
    var WA_NUMBER = "61405177627"; /* WhatsApp destination */

    function update() {
      var checked = Array.prototype.slice.call(grid.querySelectorAll("input:checked"));
      var names = checked.map(function (c) { return c.value; });
      grid.querySelectorAll(".svc-card").forEach(function (card) {
        card.classList.toggle("is-selected", card.querySelector("input").checked);
      });
      countEl.textContent = String(names.length);
      listEl.textContent = names.join(", ");
      bar.classList.toggle("is-visible", names.length > 0);
      var msg = "Hi PER4MANCE X, I'd like to book a discovery call for: " + names.join(", ");
      sendBtn.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
    }
    grid.addEventListener("change", update);
    update();
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var year = document.getElementById("footerYear");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ---------- Boot ---------- */
  function boot() {
    splitHeadings();
    initHeader();
    initMobileNav();
    initProgress();
    initParallax();
    initHeroDrift();
    initMagnetic();
    initImageFallback();
    initTestimonials();
    initForm();
    initServiceSelect();
    initYear();
    runOpening();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
