
(() => {
  const path = location.pathname.split('/').pop() || 'index.html';
  const header = document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.site-nav a')];
  navLinks.forEach(a => {
    if ((a.getAttribute('href') || '').split('/').pop() === path) a.classList.add('active');
    a.addEventListener('click', () => document.body.classList.remove('nav-open'));
  });

  const navToggle = document.querySelector('.nav-toggle');
  navToggle?.addEventListener('click', () => document.body.classList.toggle('nav-open'));

  const themeToggle = document.querySelector('.theme-toggle');
  const themeStorageKey = 'theme-preference';
  const setTheme = (theme) => {
    const isLight = theme === 'light';
    document.body.classList.toggle('theme-light', isLight);
    if (themeToggle) {
      themeToggle.textContent = isLight ? 'Dark mode' : 'Light mode';
      themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
      themeToggle.setAttribute('aria-pressed', String(isLight));
    }
    localStorage.setItem(themeStorageKey, theme);
  };
  const storedTheme = localStorage.getItem(themeStorageKey);
  setTheme(storedTheme === 'light' ? 'light' : 'dark');
  themeToggle?.addEventListener('click', () => setTheme(document.body.classList.contains('theme-light') ? 'dark' : 'light'));

  const menu = document.querySelector('.menu');
  const menuBtn = document.querySelector('[data-menu-btn]');
  if (menu && menuBtn) {
    const closeMenu = () => {
      menu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    };
    const toggleMenu = (force) => {
      const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    };
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
    menu.addEventListener('mouseleave', () => {
      if (window.matchMedia('(min-width: 761px)').matches) closeMenu();
    });
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 6);
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  // Reveal on scroll
  const revealEls = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Counters
  const counters = [...document.querySelectorAll('[data-count]')];
  if (counters.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const end = Number(el.dataset.count || '0');
        const suffix = el.dataset.suffix || '';
        const duration = Number(el.dataset.duration || '1200');
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = Math.round(end * eased);
          el.textContent = value.toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.35 });
    counters.forEach(el => io.observe(el));
  }

  // Try to load official remote images, keep local SVG fallbacks if offline.
  [...document.querySelectorAll('img[data-remote-src]')].forEach(img => {
    const remote = img.dataset.remoteSrc;
    if (!remote) return;
    const test = new Image();
    test.onload = () => { img.src = remote; img.classList.add('is-remote'); };
    test.onerror = () => { img.classList.add('fallback'); };
    test.referrerPolicy = 'no-referrer';
    test.src = remote;
  });

  // Club filters
  const clubGrid = document.querySelector('[data-club-grid]');
  const searchInput = document.querySelector('[data-club-search]');
  const filterWrap = document.querySelector('[data-zone-filters]');
  if (clubGrid && filterWrap) {
    const cards = [...clubGrid.querySelectorAll('.club-card')];
    const zones = ['All', ...new Set(cards.map(card => card.dataset.zone))];
    let activeZone = 'All';

    filterWrap.innerHTML = zones.map(z => `<button type="button" class="filter-btn ${z === 'All' ? 'active' : ''}" data-zone="${z}">${z}</button>`).join('');

    const applyFilter = () => {
      const q = (searchInput?.value || '').trim().toLowerCase();
      cards.forEach(card => {
        const hay = (card.dataset.search || '').toLowerCase();
        const zoneOk = activeZone === 'All' || card.dataset.zone === activeZone;
        const searchOk = !q || hay.includes(q);
        card.classList.toggle('hidden', !(zoneOk && searchOk));
      });
      const visible = cards.filter(card => !card.classList.contains('hidden')).length;
      const empty = document.querySelector('[data-empty-state]');
      if (empty) empty.classList.toggle('hidden', visible > 0);
    };

    filterWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-zone]');
      if (!btn) return;
      activeZone = btn.dataset.zone;
      filterWrap.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.zone === activeZone));
      applyFilter();
    });

    searchInput?.addEventListener('input', applyFilter);
    applyFilter();
  }

  // Subtle motion on the hero image stack for a more premium feel.
  const heroPanel = document.querySelector('.hero-panel');
  const heroGrid = document.querySelector('.hero-grid');
  if (heroPanel && heroGrid) {
    let raf = 0;
    const onMove = (ev) => {
      const rect = heroPanel.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / rect.width - 0.5;
      const y = (ev.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        heroPanel.style.setProperty('--tilt-x', (x * 4).toFixed(2));
        heroPanel.style.setProperty('--tilt-y', (y * 4).toFixed(2));
        heroPanel.style.transform = `translate3d(0,0,0) perspective(1000px) rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.2).toFixed(2)}deg)`;
      });
    };
    const reset = () => {
      heroPanel.style.transform = '';
      heroPanel.style.removeProperty('--tilt-x');
      heroPanel.style.removeProperty('--tilt-y');
    };
    heroGrid.addEventListener('pointermove', onMove);
    heroGrid.addEventListener('pointerleave', reset);
  }

  // Slightly stagger initial reveal timing for a cleaner entrance.
  [...document.querySelectorAll('.reveal')].forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 40, 260)}ms`;
  });
})();
