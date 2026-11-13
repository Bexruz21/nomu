'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];

    /* Language versions are static HTML documents linked with ordinary anchors. */
    function initLang() {}
    /* ====== PRELOADER ====== */
    function initPreloader() {
      const el = $('#preloader'); if (!el) return;
      document.body.style.overflow = 'hidden';
      window.addEventListener('load', () => {
        setTimeout(() => {
          el.classList.add('hidden');
          document.body.style.overflow = '';
          if (typeof AOS !== 'undefined') AOS.refresh();
        }, 1100);
      });
    }

    /* ====== TICKER ====== */
    function getCarouselSpeed(variable, fallback) {
      const styles = getComputedStyle(document.documentElement);
      const base = parseFloat(styles.getPropertyValue(variable)) || fallback;
      const multiplier = parseFloat(styles.getPropertyValue('--carousel-speed-multiplier')) || 1;
      return base * multiplier;
    }

    function initSeamlessCarousel(track, speed) {
      const viewport = track.parentElement;
      const originals = Array.from(track.children);
      if (!viewport || !originals.length) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let cycleWidth = 0;
      let offset = 0;
      let paused = false;
      let running = false;
      let animationId = 0;
      let lastTime = 0;
      let resizeTimer = 0;

      function appendSet() {
        const fragment = document.createDocumentFragment();
        originals.forEach(item => {
          const clone = item.cloneNode(true);
          clone.classList.add('carousel-clone');
          clone.setAttribute('aria-hidden', 'true');
          clone.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
          fragment.appendChild(clone);
        });
        track.appendChild(fragment);
      }

      function measure() {
        if (!track.querySelector('.carousel-clone')) appendSet();
        const firstClone = track.children[originals.length];
        cycleWidth = firstClone.offsetLeft - track.children[0].offsetLeft;

        while (cycleWidth > 0 && track.scrollWidth < viewport.clientWidth + cycleWidth) {
          appendSet();
        }

        offset = cycleWidth > 0 ? offset % cycleWidth : 0;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }

      function animate(time) {
        if (!running) return;
        if (!lastTime) lastTime = time;
        const delta = Math.min((time - lastTime) / 1000, .05);
        lastTime = time;

        if (!paused && cycleWidth > 0) {
          offset = (offset + speed * delta) % cycleWidth;
          track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        }
        animationId = requestAnimationFrame(animate);
      }

      function start() {
        if (running || reduceMotion.matches || document.hidden) return;
        running = true;
        lastTime = 0;
        animationId = requestAnimationFrame(animate);
      }

      function stop() {
        running = false;
        cancelAnimationFrame(animationId);
        animationId = 0;
        lastTime = 0;
      }

      viewport.addEventListener('mouseenter', () => paused = true);
      viewport.addEventListener('mouseleave', () => paused = false);
      viewport.addEventListener('focusin', () => paused = true);
      viewport.addEventListener('focusout', () => paused = false);
      reduceMotion.addEventListener('change', () => {
        if (reduceMotion.matches) {
          stop();
          offset = 0;
          track.style.transform = 'none';
        } else {
          start();
        }
      });
      document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(measure, 120);
      });

      measure();
      start();
    }

    function initTicker() {
      const track = $('#tickerTrack'); if (!track) return;
      const brands = [
        {name: 'Partner 1', img: '/assets/images/clients/brand-1.webp'},
        {name: 'Partner 2', img: '/assets/images/clients/brand-2.webp'},
        {name: 'Partner 3', img: '/assets/images/clients/brand-3.webp'},
        {name: 'Partner 4', img: '/assets/images/clients/brand-4.webp'},
        {name: 'Partner 5', img: '/assets/images/clients/brand-5.webp'},
        {name: 'Partner 6', img: '/assets/images/clients/brand-6.webp'},
        {name: 'Partner 7', img: '/assets/images/clients/brand-7.webp'},
        {name: 'Partner 8', img: '/assets/images/clients/brand-8.webp'},
        {name: 'Partner 9', img: '/assets/images/clients/brand-9.webp'},
        {name: 'Partner 10', img: '/assets/images/clients/brand-10.webp'},
        {name: 'Partner 11', img: '/assets/images/clients/brand-11.webp'},
      ];

      function makeItem(brand) {
        const div = document.createElement('div');
        div.className = 'ticker-logo';
        div.innerHTML = `<img src="${brand.img}" alt="${brand.name}" width="400" height="250" decoding="async" loading="lazy" />`;
        return div;
      }

      function buildSet() {
        const f = document.createDocumentFragment();
        brands.forEach((b, i) => {
          f.appendChild(makeItem(b));
          if (i < brands.length - 1) {
            const s = document.createElement('div');
            s.className = 'ticker-sep';
            f.appendChild(s);
          }
        });
        return f;
      }

      track.appendChild(buildSet());
      initSeamlessCarousel(track, getCarouselSpeed('--carousel-ticker-speed', 42));
    }
    /* ====== NAVBAR ====== */
    function initNavbar() {
      const navbar = $('#navbar'), burger = $('#navBurger'), navLinks = $('#navLinks'), overlay = $('#navOverlay');
      if (!navbar) return;
      const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 50);
      window.addEventListener('scroll', onScroll, {passive: true}); onScroll();
      function closeMenu() {burger.setAttribute('aria-expanded', 'false'); navLinks.inert = window.matchMedia('(max-width:768px)').matches; burger.classList.remove('active'); navLinks.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = '';}
      if (burger && navLinks) {
        burger.addEventListener('click', () => {
          const open = navLinks.classList.toggle('open');
          burger.classList.toggle('active');
          burger.setAttribute('aria-expanded', String(open));
          navLinks.inert = !open;
          overlay.classList.toggle('open', open);
          document.body.style.overflow = open ? 'hidden' : '';
        });
        $$('.nav-link', navLinks).forEach(l => l.addEventListener('click', closeMenu));
        overlay.addEventListener('click', closeMenu);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && navLinks.classList.contains('open')) { closeMenu(); burger.focus(); } });
        const mobileMenu = window.matchMedia('(max-width:768px)');
        const syncMenu = () => { closeMenu(); navLinks.inert = mobileMenu.matches; };
        mobileMenu.addEventListener('change', syncMenu); syncMenu();
      }
      function updateActive() {
        const sy = window.scrollY + 120;
        $$('section[id]').forEach(s => {const l = $(`a[href="#${s.id}"]`, navLinks); if (l) l.classList.toggle('active', sy >= s.offsetTop && sy < s.offsetTop + s.offsetHeight);});
      }
      window.addEventListener('scroll', updateActive, {passive: true});
    }

    /* ====== PARTICLES ====== */
    function initParticles() {
      const canvas = $('#particleCanvas'); if (!canvas) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const ctx = canvas.getContext('2d');
      let particles = [], W, H;
      let animationId = 0;
      const N = 40;
      class P {
        constructor() {this.reset(true)}
        reset(init = false) {this.x = Math.random() * W; this.y = init ? Math.random() * H : H + 10; this.r = Math.random() * 1.6 + .3; this.vx = (Math.random() - .5) * .25; this.vy = -(Math.random() * .35 + .1); this.alpha = 0; this.maxA = Math.random() * .35 + .05; this.life = 0; this.maxL = Math.random() * 280 + 140;}
        update() {this.x += this.vx; this.y += this.vy; this.life++; const t = this.life / this.maxL; this.alpha = t < .2 ? (t / .2) * this.maxA : t > .8 ? ((1 - t) / .2) * this.maxA : this.maxA; if (this.life >= this.maxL) this.reset();}
        draw() {ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(0,245,160,${this.alpha})`; ctx.fill();}
      }
      function resize() {W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight;}
      function init() {resize(); particles = Array.from({length: N}, () => new P);}
      function animate() {if (document.hidden) return; ctx.clearRect(0, 0, W, H); particles.forEach(p => {p.update(); p.draw();}); animationId = requestAnimationFrame(animate);}
      init(); animate();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(animationId);
        else animate();
      });
      let t; window.addEventListener('resize', () => {clearTimeout(t); t = setTimeout(init, 200)});
    }

    /* ====== TEAM CAROUSEL ====== */
    function initTeamCarousel() {
      const track = $('#teamTrack'); if (!track) return;
      initSeamlessCarousel(track, getCarouselSpeed('--carousel-team-speed', 38));
    }

    function initPartnersCarousel() {
      const track = $('#partnersTrack'); if (!track) return;
      initSeamlessCarousel(track, getCarouselSpeed('--carousel-partners-speed', 44));
    }

    /* ====== FAQ ====== */
    function initFAQ() {
      $$('.faq-item').forEach(item => {
        const q = $('.faq-question', item); if (!q) return;
        q.addEventListener('click', () => {
          const active = item.classList.contains('active');
          $$('.faq-item').forEach(i => {i.classList.remove('active'); const qe = $('.faq-question', i); if (qe) qe.setAttribute('aria-expanded', 'false');});
          if (!active) {item.classList.add('active'); q.setAttribute('aria-expanded', 'true');}
        });
      });
    }

    /* ====== PORTFOLIO FILTER ====== */
    function initPortfolioFilter() {
      const btns = $$('.filter-btn'), items = $$('.portfolio-item'); if (!btns.length) return;
      btns.forEach(btn => btn.addEventListener('click', () => {
        const f = btn.dataset.filter;
        btns.forEach(b => b.classList.remove('active')); btn.classList.add('active');
        items.forEach(item => item.classList.toggle('hidden', f !== 'all' && item.dataset.category !== f));
      }));
    }

    /* ====== BACK TO TOP ====== */
    function initBackToTop() {
      const btn = $('#backToTop'); if (!btn) return;
      window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500), {passive: true});
      btn.addEventListener('click', () => window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
    }

    /* ====== SMOOTH SCROLL ====== */
    function initSmoothScroll() {
      $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
        const id = a.getAttribute('href'); if (id === '#') return;
        const t = $(id); if (t) {e.preventDefault(); window.scrollTo({top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth'});}
      }));
    }

    /* ====== CURSOR GLOW (desktop only) ====== */
    function initCursorGlow() {
      if (window.matchMedia('(hover:none), (prefers-reduced-motion: reduce)').matches) return;
      const g = document.createElement('div'); g.id = 'cursorGlow';
      Object.assign(g.style, {position: 'fixed', top: '0', left: '0', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,245,160,.05) 0%,transparent 70%)', pointerEvents: 'none', zIndex: '9', transform: 'translate(-50%,-50%)', transition: 'none'});
      document.body.appendChild(g);
      let mx = 0, my = 0, gx = 0, gy = 0, frameId = 0;
      const update = () => {
        gx += (mx - gx) * .16;
        gy += (my - gy) * .16;
        g.style.transform = `translate3d(${gx - 140}px, ${gy - 140}px, 0)`;
        if (Math.abs(mx - gx) > .2 || Math.abs(my - gy) > .2) frameId = requestAnimationFrame(update);
        else frameId = 0;
      };
      window.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        if (!frameId) frameId = requestAnimationFrame(update);
      }, {passive: true});
    }

    /* ====== REVEAL ====== */
    function initReveal() {
      const obs = new IntersectionObserver(entries => entries.forEach(e => {if (e.isIntersecting) {e.target.classList.add('visible'); obs.unobserve(e.target);} }), {threshold: .15});
      $$('.reveal-up').forEach(el => obs.observe(el));
    }

    /* ====== TILT ====== */
    function initTilt() {
      if (window.matchMedia('(hover:none), (prefers-reduced-motion: reduce)').matches) return;
      $$('.service-card,.niche-item').forEach(card => {
        let frameId = 0, pointerX = 0, pointerY = 0;
        card.addEventListener('pointermove', e => {
          pointerX = e.clientX;
          pointerY = e.clientY;
          if (frameId) return;
          frameId = requestAnimationFrame(() => {
            const r = card.getBoundingClientRect(), x = (pointerX - r.left) / r.width - .5, y = (pointerY - r.top) / r.height - .5;
            card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-4px)`;
            frameId = 0;
          });
        }, {passive: true});
        card.addEventListener('pointerleave', () => {
          if (frameId) cancelAnimationFrame(frameId);
          frameId = 0;
          card.style.transform = '';
        });
      });
    }

    /* ====== CONTACT FORM ====== */
    function initContactForm() {
      const messages = {"uz":{"required":"Iltimos, barcha majburiy maydonlarni to‘ldiring.","email":"To‘g‘ri elektron pochta manzilini kiriting.","success":"Xabar yuborildi! 24 soat ichida siz bilan bog‘lanamiz.","error":"Xabar yuborilmadi. Qayta urinib ko‘ring yoki Telegram orqali yozing."},"ru":{"required":"Пожалуйста, заполните все обязательные поля.","email":"Введите корректный адрес электронной почты.","success":"Сообщение отправлено! Мы свяжемся с вами в течение 24 часов.","error":"Не удалось отправить сообщение. Попробуйте ещё раз или напишите в Telegram."},"en":{"required":"Please fill in all required fields.","email":"Please enter a valid email address.","success":"Message sent! We’ll get back to you within 24 hours.","error":"Unable to send your message. Please try again or contact us on Telegram."}};
      const msg = messages[document.documentElement.lang] || messages.en;
      const form = $('#contactForm'), status = $('#formStatus'), submitBtn = $('#submitBtn'); if (!form) return;
      function showStatus(type, msg) {status.className = 'form-status ' + type; status.textContent = msg; status.style.display = 'block'; setTimeout(() => status.style.display = 'none', 5000);}
      function setLoading(on) {const sp = submitBtn.querySelector('i'); if (on) {sp.className = 'fa-solid fa-circle-notch fa-spin'; submitBtn.disabled = true;} else {sp.className = 'fa-solid fa-paper-plane'; submitBtn.disabled = false;} }
      async function sendContact(data) {
        const res = await fetch('/api/contact', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
        if (!res.ok) throw new Error('Send failed');
      }
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = {name: form.formName?.value.trim(), email: form.formEmail?.value.trim(), phone: form.formPhone?.value.trim(), service: form.formService?.value, message: form.formMessage?.value.trim()};
        if (!data.name || !data.email || !data.message) {showStatus('error', msg.required); return;}
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {showStatus('error', msg.email); return;}
        setLoading(true);
        try {
          await sendContact(data);
          showStatus('success', msg.success); form.reset();
        } catch (err) {showStatus('error', msg.error);}
        finally {setLoading(false);}
      });
    }

    /* ====== AOS ====== */
    function initAOS() {
      if (typeof AOS === 'undefined') return;
      AOS.init({duration: 480, easing: 'cubic-bezier(.16,1,.3,1)', once: true, offset: 35, disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches});
    }

    /* ====== NAV ACTIVE STYLE ====== */
    function initNavStyle() {
      const s = document.createElement('style');
      s.textContent = '.nav-link.active{color:var(--teal)!important}.nav-link.active::after{width:60%!important}';
      document.head.appendChild(s);
    }

    /* ====== INIT ALL ====== */
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.classList.add('js-ready'); initLang(); initAOS(); initPreloader(); initTicker(); initNavbar(); initParticles();
      initTeamCarousel(); initPartnersCarousel(); initFAQ(); initPortfolioFilter(); initBackToTop();
      initSmoothScroll(); initCursorGlow(); initReveal(); initContactForm(); initTilt(); initNavStyle();
    });

    let resizeT;
    window.addEventListener('resize', () => {clearTimeout(resizeT); resizeT = setTimeout(() => {if (typeof AOS !== 'undefined') AOS.refresh();}, 300);});
