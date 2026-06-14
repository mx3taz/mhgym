/* ============================================================
   MH GYM CENTER UNDERGROUND — Interactive Engine
   Parallax · 3D Mouse Tracking · Scroll Reveal · Counters
   ============================================================ */

'use strict';

(function () {
  /* ---------- Utility: Throttle via rAF ---------- */
  function rafThrottle(fn) {
    let ticking = false;
    return function (...args) {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          fn.apply(this, args);
          ticking = false;
        });
      }
    };
  }

  /* ---------- Utility: Detect reduced motion ---------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Utility: Detect mobile ---------- */
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;

  /* ============================================================
     1. NAVIGATION — Scroll effect & hamburger
     ============================================================ */
  const nav = document.getElementById('main-nav');
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');
  const backToTop = document.getElementById('back-to-top');

  // Scroll state for nav
  function updateNav() {
    const scrollY = window.scrollY || window.pageYOffset;

    if (scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    // Back to top button
    if (scrollY > window.innerHeight) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', rafThrottle(updateNav), { passive: true });
  updateNav();

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen.toString());
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    navLinks.querySelectorAll('.nav__link, .nav__cta').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Back to top
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = nav.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
     2. PARALLAX ENGINE — Multi-layer depth scrolling
     ============================================================ */
  const parallaxLayers = document.querySelectorAll('.parallax-layer');

  function updateParallax() {
    if (prefersReducedMotion || isMobile) return;

    const scrollY = window.scrollY || window.pageYOffset;

    parallaxLayers.forEach(layer => {
      const speed = parseFloat(layer.dataset.parallaxSpeed) || 0.3;
      const parent = layer.parentElement;
      const parentRect = parent.getBoundingClientRect();

      // Only animate when in viewport
      if (parentRect.bottom > 0 && parentRect.top < window.innerHeight) {
        const yOffset = scrollY * speed;
        layer.style.transform = `translate3d(0, ${yOffset}px, 0)`;
      }
    });
  }

  window.addEventListener('scroll', rafThrottle(updateParallax), { passive: true });
  updateParallax();

  /* ============================================================
     3. HERO 3D MOUSE TRACKING — Gyroscope-like tilt
     ============================================================ */
  const hero3dTarget = document.getElementById('hero-3d-target');
  const heroSection = document.querySelector('.hero');

  if (hero3dTarget && heroSection && !isMobile && !prefersReducedMotion) {
    heroSection.addEventListener('mousemove', rafThrottle((e) => {
      const rect = heroSection.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Normalize to -1...1
      const normalizedX = (mouseX - centerX) / centerX;
      const normalizedY = (mouseY - centerY) / centerY;

      // Apply subtle tilt (max 5 degrees)
      const rotateX = normalizedY * -4;
      const rotateY = normalizedX * 4;
      const translateZ = 10;

      hero3dTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`;
    }));

    heroSection.addEventListener('mouseleave', () => {
      hero3dTarget.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      hero3dTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      setTimeout(() => {
        hero3dTarget.style.transition = '';
      }, 600);
    });
  }

  /* ============================================================
     4. SCROLL REVEAL — Intersection Observer
     ============================================================ */
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  if (!prefersReducedMotion && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // If reduced motion, show everything immediately
    revealElements.forEach(el => el.classList.add('revealed'));
  }

  /* ============================================================
     5. ANIMATED COUNTERS — Number increment on scroll
     ============================================================ */
  const counterElements = document.querySelectorAll('[data-counter]');

  function animateCounter(element) {
    const target = parseInt(element.dataset.counter, 10);
    const duration = 2000; // ms
    const startTime = performance.now();

    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = Math.floor(easedProgress * target);

      element.textContent = current.toLocaleString('fr-FR');

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toLocaleString('fr-FR');
      }
    }

    requestAnimationFrame(update);
  }

  if (counterElements.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });

    counterElements.forEach(el => counterObserver.observe(el));
  }

  /* ============================================================
     6. FEATURE CARDS — 3D Mouse Follow Glow
     ============================================================ */
  const featureCards = document.querySelectorAll('.feature-card');

  if (!isMobile && !prefersReducedMotion) {
    featureCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      });
    });
  }

  /* ============================================================
     7. EXPERIENCE GALLERY — 3D Tilt on Hover
     ============================================================ */
  const experienceItems = document.querySelectorAll('.experience__item');

  if (!isMobile && !prefersReducedMotion) {
    experienceItems.forEach(item => {
      item.addEventListener('mousemove', rafThrottle((e) => {
        const rect = item.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const rotateY = ((mouseX - centerX) / centerX) * 5;
        const rotateX = ((centerY - mouseY) / centerY) * 5;

        item.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      }));

      item.addEventListener('mouseleave', () => {
        item.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        item.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        setTimeout(() => {
          item.style.transition = '';
        }, 500);
      });
    });
  }

  /* ============================================================
     8. ACTIVE NAV LINK — Highlight current section
     ============================================================ */
  const sections = document.querySelectorAll('section[id]');
  const navLinkElements = document.querySelectorAll('.nav__link');

  function updateActiveNav() {
    const scrollY = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinkElements.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', rafThrottle(updateActiveNav), { passive: true });

  /* ============================================================
     9. PRELOADER — Simple content-ready transition
     ============================================================ */
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });

  /* ============================================================
     10. PERFORMANCE — Pause animations when tab not visible
     ============================================================ */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.body.classList.add('tab-hidden');
    } else {
      document.body.classList.remove('tab-hidden');
    }
  });

})();
