/* ============================================================
   SANTA ESTÉTICA — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. NAVBAR — scroll behavior
     ---------------------------------------------------------- */
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();


  /* ----------------------------------------------------------
     2. FADE-UP — IntersectionObserver
     ---------------------------------------------------------- */
  const fadeEls = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    fadeEls.forEach(function (el) { observer.observe(el); });
  } else {
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }


  /* ----------------------------------------------------------
     3. FAQ — accordion
     ---------------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    const btn = item.querySelector('.faq-item__pergunta');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const isOpen = item.classList.contains('open');

      faqItems.forEach(function (other) {
        other.classList.remove('open');
        const ob = other.querySelector('.faq-item__pergunta');
        if (ob) ob.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });


  /* ----------------------------------------------------------
     4. SCROLL SUAVE — links âncora
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = navbar ? navbar.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });


  /* ----------------------------------------------------------
     5. MENU MOBILE — hamburguer toggle
     ---------------------------------------------------------- */
  const menuToggle = document.getElementById('menuToggle');
  const navMenu    = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    function closeMenu() {
      navMenu.classList.remove('mobile-open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }

    menuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('mobile-open');
      menuToggle.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('.navbar__link').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function (e) {
      if (!navbar.contains(e.target)) closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900) closeMenu();
    });
  }


  /* ----------------------------------------------------------
     6. HERO — fade-up imediato acima da dobra
     ---------------------------------------------------------- */
  window.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      document.querySelectorAll('.hero .fade-up').forEach(function (el) {
        el.classList.add('visible');
      });
    }, 80);
  });


  /* ----------------------------------------------------------
     7. CARROSSEL DE RESULTADOS (vídeos)
     ---------------------------------------------------------- */
  (function initCarousel() {
    const track    = document.getElementById('resultadosTrack');
    const prevBtn  = document.getElementById('resultadosPrev');
    const nextBtn  = document.getElementById('resultadosNext');
    const dotsWrap = document.getElementById('resultadosDots');

    if (!track) return;

    const cards     = Array.from(track.querySelectorAll('.resultado-card'));
    const total     = cards.length;
    let   current   = 0;
    let   activeVideo = null;

    // Quantos cards visíveis por vez (responsivo)
    function visibleCount() {
      if (window.innerWidth >= 1024) return 4;
      if (window.innerWidth >= 640)  return 3;
      return 2;
    }

    // Largura de um card + gap
    function cardStep() {
      if (!cards[0]) return 0;
      const style = window.getComputedStyle(track);
      const gap   = parseFloat(style.gap) || 12;
      return cards[0].offsetWidth + gap;
    }

    // Máximo índice de scroll
    function maxIndex() {
      return Math.max(0, total - visibleCount());
    }

    // Construir dots
    function buildDots() {
      dotsWrap.innerHTML = '';
      const steps = maxIndex() + 1;
      for (let i = 0; i < steps; i++) {
        const d = document.createElement('button');
        d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Resultado ' + (i + 1));
        d.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(d);
      }
    }

    function updateDots() {
      const dots = dotsWrap.querySelectorAll('.carousel-dot');
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === current);
      });
    }

    function updateButtons() {
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current >= maxIndex();
    }

    function goTo(index) {
      current = Math.max(0, Math.min(index, maxIndex()));
      track.style.transform = 'translateX(-' + (cardStep() * current) + 'px)';
      updateDots();
      updateButtons();
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

    // Touch / swipe
    var touchStartX = 0;
    track.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        goTo(dx < 0 ? current + 1 : current - 1);
      }
    }, { passive: true });

    // Play / Pause ao clicar no card
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        const video  = card.querySelector('video');
        const poster = card.querySelector('.resultado-card__poster');

        if (!video) return;

        // Se já está tocando este card — pausar
        if (card.classList.contains('playing')) {
          video.pause();
          card.classList.remove('playing');
          if (poster) poster.style.opacity = '1';
          activeVideo = null;
          return;
        }

        // Pausar o card anteriormente ativo
        if (activeVideo && activeVideo !== video) {
          const prevCard   = activeVideo.closest('.resultado-card');
          const prevPoster = prevCard ? prevCard.querySelector('.resultado-card__poster') : null;
          activeVideo.pause();
          if (prevCard)   prevCard.classList.remove('playing');
          if (prevPoster) prevPoster.style.opacity = '1';
        }

        // Tocar este card
        if (poster) poster.style.opacity = '0';
        card.classList.add('playing');
        activeVideo = video;

        video.play().catch(function () {});
      });
    });

    // Pausar vídeos quando saem da viewport
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              const card   = entry.target;
              const video  = card.querySelector('video');
              const poster = card.querySelector('.resultado-card__poster');
              if (video && !video.paused) {
                video.pause();
                card.classList.remove('playing');
                if (poster) poster.style.opacity = '1';
                if (activeVideo === video) activeVideo = null;
              }
            }
          });
        },
        { threshold: 0.3 }
      );
      cards.forEach(function (card) { videoObserver.observe(card); });
    }

    // Init
    buildDots();
    updateButtons();

    // Recalcular no resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buildDots();
        goTo(Math.min(current, maxIndex()));
      }, 150);
    });

  })();

})();
