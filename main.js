/* ============================================================
   main.js — Scroll Storytelling Engine
   Three.js (hero background) + GSAP ScrollTrigger (all sections)
   ============================================================ */

(function () {
  'use strict';

  /* --- Check for reduced motion preference --- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     SCROLL LOCK — Block scroll during intro animation
     Uses both overflow:hidden and wheel/touch event blocking
     for maximum compatibility across browsers/devices.
     ============================================================ */
  function lockScroll() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  /* ============================================================
     1. THREE.JS — PARTICLE FIELD HERO BACKGROUND
     ============================================================ */
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || prefersReducedMotion) return null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 800;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const PARTICLE_COUNT = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 1600;
      positions[i3 + 1] = (Math.random() - 0.5) * 1000;
      positions[i3 + 2] = (Math.random() - 0.5) * 800;
      velocities[i3] = (Math.random() - 0.5) * 0.15;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x2997ff,
      size: 2.5,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let scrollProgress = 0;

    let animationId;
    function animate() {
      animationId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        pos[i3] += velocities[i3];
        pos[i3 + 1] += velocities[i3 + 1];
        pos[i3 + 2] += velocities[i3 + 2];

        if (pos[i3] > 800) pos[i3] = -800;
        if (pos[i3] < -800) pos[i3] = 800;
        if (pos[i3 + 1] > 500) pos[i3 + 1] = -500;
        if (pos[i3 + 1] < -500) pos[i3 + 1] = 500;
      }
      geometry.attributes.position.needsUpdate = true;

      camera.position.z = 800 - scrollProgress * 200;
      material.opacity = 0.4 * (1 - scrollProgress);
      canvas.style.opacity = 1 - scrollProgress;

      renderer.render(scene, camera);
    }

    animate();

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    return {
      setScrollProgress: function (p) { scrollProgress = p; },
      destroy: function () {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', onResize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      }
    };
  }

  const heroScene = initHeroCanvas();

  /* ============================================================
     HELPER: Typing Animation
     ============================================================ */
  function typeText(element, text, speed, callback) {
    var i = 0;
    function tick() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(tick, speed);
      } else if (callback) {
        callback();
      }
    }
    tick();
  }

  /* ============================================================
     HELPER: Play / Replay Typing
     Resets text rồi gõ lại từ đầu.
     typingActive — tránh chạy đè nhau nếu trigger liên tục.
     ============================================================ */
  var typingActive = false;   /* đang gõ thì không trigger thêm */
  var introComplete = false;   /* chỉ replay SAU khi intro xong   */

  function playTypingAnimation() {
    var el = document.getElementById('typing-text');
    if (!el || typingActive) return;
    typingActive = true;
    el.textContent = '';         /* reset về trống */
    typeText(el, 'Aspiring Web Developer', 40, function () {
      typingActive = false;
    });
  }

  /* ============================================================
     HELPER: Setup IntersectionObserver để replay typing
     khi hero section quay lại viewport (scroll về top hoặc
     click Home trên navbar).
     ============================================================ */
  function setupHeroReplayObserver() {
    var heroSection = document.getElementById('hero');
    if (!heroSection || !('IntersectionObserver' in window)) return;

    var wasHidden = false;  /* true khi hero đã ra khỏi màn hình ít nhất 1 lần */

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!introComplete) return; /* intro chưa xong → bỏ qua */

        if (!entry.isIntersecting) {
          /* Hero ra khỏi viewport → đánh dấu */
          wasHidden = true;
        } else if (wasHidden) {
          /* Hero quay lại viewport → replay typing */
          wasHidden = false;
          playTypingAnimation();
        }
      });
    }, {
      threshold: 0.3   /* hero phải hiện ít nhất 30% mới coi là "quay lại" */
    });

    observer.observe(heroSection);
  }

  /* ============================================================
     HELPER: Avatar Card 3D Tilt
     ============================================================ */
  function initAvatarTilt(card) {
    if (!card || prefersReducedMotion) return;
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -10;
      var rotateY = ((x - centerX) / centerX) * 10;
      card.style.transition = 'transform 0.1s ease-out';
      card.style.transform =
        'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transition = 'transform 0.4s ease-out';
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
    });
  }

  /* ============================================================
     HELPER: Hero scroll-driven fade-out animations
     Called AFTER intro timeline completes.
     ============================================================ */
  function createHeroScrollAnimations() {
    gsap.fromTo('#hero-final',
      { opacity: 1, y: 0 },
      {
        opacity: 0, y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5
        }
      }
    );

    var hintEl = document.getElementById('scroll-hint');
    if (hintEl) {
      gsap.fromTo(hintEl,
        { opacity: 1, y: 0 },
        {
          opacity: 0, y: 20,
          scrollTrigger: {
            trigger: '#hero',
            start: '5% top',
            end: '20% top',
            scrub: true
          }
        }
      );
    }
  }

  /* ============================================================
     2. GSAP + SCROLLTRIGGER
     ============================================================ */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    gsap.defaults({
      ease: 'power2.out',
      duration: 1
    });

    /* --------------------------------------------------------
       2a. HERO — Cinematic Intro Timeline
       -------------------------------------------------------- */
    if (!prefersReducedMotion) {
      const heroIntro = document.getElementById('hero-intro');
      const introGreeting = document.querySelector('.hero__intro-greeting');
      const introName = document.getElementById('hero-name-intro');
      const introWelcome = document.getElementById('hero-intro-welcome');
      const heroFinal = document.getElementById('hero-final');
      const heroNameFinal = document.getElementById('hero-name-final');
      const globalNav = document.querySelector('.global-nav');
      const avatarCard = document.getElementById('hero-avatar-card');
      const heroCtas = document.getElementById('hero-ctas');
      const heroTyping = document.getElementById('hero-typing');
      const typingTextEl = document.getElementById('typing-text');
      const scrollHint = document.getElementById('scroll-hint');
      const heroGreetingFinal = document.getElementById('hero-greeting-final');
      const heroTagline = document.getElementById('hero-tagline');

      /* --- Case 1: Page reloaded while already scrolled --- */
      if (window.scrollY > 100) {
        /* No animation needed, scroll already unlocked */
        gsap.set(heroIntro, { display: 'none' });
        gsap.set(heroFinal, { opacity: 1, visibility: 'visible' });
        gsap.set(globalNav, { opacity: 1, y: 0 });
        gsap.set(heroCtas, { opacity: 1, y: 0 });
        gsap.set(heroTyping, { opacity: 1 });
        if (typingTextEl) typingTextEl.textContent = 'Aspiring Web Developer';
        if (scrollHint) gsap.set(scrollHint, { opacity: 1 });
        if (heroGreetingFinal) gsap.set(heroGreetingFinal, { opacity: 1 });
        if (heroTagline) gsap.set(heroTagline, { opacity: 1, y: 0 });
        initAvatarTilt(avatarCard);
        createHeroScrollAnimations();
        introComplete = true;
        setupHeroReplayObserver();

      } else {
        /* --- Case 2: Fresh page load at top — lock scroll during animation --- */
        lockScroll();

        gsap.set(heroFinal, { opacity: 0, visibility: 'hidden' });
        gsap.set(heroCtas, { opacity: 0, y: 20 });
        gsap.set(heroTyping, { opacity: 0 });
        if (scrollHint) gsap.set(scrollHint, { opacity: 0 });
        if (heroGreetingFinal) gsap.set(heroGreetingFinal, { opacity: 0, y: 10 });
        if (heroTagline) gsap.set(heroTagline, { opacity: 0, y: 10 });

        const heroTL = gsap.timeline();

        heroTL
          /* Phase 1: Splash entrance (0s – 1s) */
          .from(introGreeting, {
            opacity: 0, y: 30,
            duration: 0.8, ease: 'power2.out'
          }, 0.3)
          .from(introName, {
            opacity: 0, y: 30, scale: 0.95,
            duration: 0.9, ease: 'power2.out'
          }, 0.7)
          /* Dòng welcome fade in sau tên */
          .to(introWelcome, {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power2.out'
          }, 1.4)

          /* Phase 2: Transition (t = 3s) */
          .addLabel('transition', 3)

          .to(introGreeting, {
            opacity: 0, y: -30,
            duration: 0.5, ease: 'power2.inOut'
          }, 'transition')
          /* Welcome fade out cùng lúc với greeting */
          .to(introWelcome, {
            opacity: 0, y: -20,
            duration: 0.4, ease: 'power2.inOut'
          }, 'transition')

          .to(introName, {
            opacity: 0, scale: 0.7, y: -20,
            duration: 0.6, ease: 'power2.inOut'
          }, 'transition+=0.15')

          .set(heroIntro, { display: 'none' }, 'transition+=0.7')
          .set(heroFinal, { visibility: 'visible' }, 'transition+=0.7')
          .to(heroFinal, { opacity: 1, duration: 0.01 }, 'transition+=0.7')

          .from(heroGreetingFinal, {
            opacity: 0, y: 10,
            duration: 0.4, ease: 'power2.out'
          }, 'transition+=0.7')

          .from(heroNameFinal, {
            opacity: 0, x: -20,
            duration: 0.6, ease: 'power2.out'
          }, 'transition+=0.75')

          .to(globalNav, {
            y: 0, opacity: 1,
            duration: 1, ease: 'power2.out'
          }, 'transition+=1.5')

          .fromTo(avatarCard, {
            opacity: 0, scale: 0.9, x: 80
          }, {
            opacity: 1, scale: 1, x: 0,
            duration: 0.7, ease: 'power2.out'
          }, 'transition+=0.9')

          .to(heroCtas, {
            opacity: 1, y: 0,
            duration: 0.4, ease: 'power2.out'
          }, 'transition+=1.1')

          .to(heroTagline, {
            opacity: 1, y: 0,
            duration: 0.5, ease: 'power2.out'
          }, 'transition+=1.2')

          /* Phase 3: Typing effect (t ≈ 4.5s) */
          .set(heroTyping, { opacity: 1 }, 'transition+=1.3')
          .add(function () {
            typeText(typingTextEl, 'Aspiring Web Developer', 40, function () {
              initAvatarTilt(avatarCard);
            });
          }, 'transition+=1.3')

          .to(scrollHint, {
            opacity: 1,
            duration: 0.5, ease: 'power2.out'
          }, 'transition+=3')

          /* ✅ Unlock scroll + register scroll animations AFTER intro is fully done */
          .add(function () {
            unlockScroll();
            createHeroScrollAnimations();
            introComplete = true;        /* ← đánh dấu intro xong */
            setupHeroReplayObserver();   /* ← bắt đầu lắng nghe quay về hero */
          }, 'transition+=3.5');
      }

      /* Drive Three.js camera with scroll */
      if (heroScene) {
        ScrollTrigger.create({
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.3,
          onUpdate: function (self) {
            heroScene.setScrollProgress(self.progress);
          }
        });
      }
    }

    /* --------------------------------------------------------
       2b. HIGHLIGHTS — Counter animation + stagger
       -------------------------------------------------------- */
    const highlightItems = document.querySelectorAll('.highlight-item');
    highlightItems.forEach((item, i) => {
      gsap.from(item, {
        opacity: 0,
        y: 40,
        duration: 0.7,
        delay: i * 0.1,
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });

    document.querySelectorAll('[data-count]').forEach(el => {
      const target = el.getAttribute('data-count');
      const suffix = el.getAttribute('data-suffix') || '';
      const isFloat = target.includes('.');
      const end = parseFloat(target);

      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to({ val: 0 }, {
            val: end,
            duration: 1.2,
            ease: 'power2.out',
            onUpdate: function () {
              const current = this.targets()[0].val;
              el.textContent = isFloat
                ? current.toFixed(2) + suffix
                : Math.round(current) + suffix;
            }
          });
        }
      });
    });

    /* --------------------------------------------------------
       2c. ABOUT — Pinned stacked cards animation
       -------------------------------------------------------- */
    (function initAboutStackAnimation() {
      var aboutSection = document.querySelector('.about-stack');
      var cards = gsap.utils.toArray('.about-card');
      if (!aboutSection || cards.length < 2) return;

      gsap.set(cards.slice(1), { yPercent: 110, opacity: 0 });

      var numTransitions = cards.length - 1;

      var stackTL = gsap.timeline({
        scrollTrigger: {
          trigger: aboutSection,
          start: 'top top',
          end: '+=' + (numTransitions * window.innerHeight * 0.35),
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          pinSpacing: true,
          snap: {
            snapTo: 1 / numTransitions,
            duration: { min: 0.4, max: 0.8 },
            ease: 'power3.inOut'
          }
        }
      });

      cards.forEach(function (card, i) {
        if (i === 0) return;
        stackTL.to(card, {
          yPercent: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.inOut'
        });
      });

      gsap.from('.about-stack__header', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        scrollTrigger: {
          trigger: '.about-stack__header',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    })();

    /* --------------------------------------------------------
       2d. EXPERIENCE — Timeline-style reveal
       -------------------------------------------------------- */
    document.querySelectorAll('#experience .panel-3d').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        delay: i * 0.1,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });

    document.querySelectorAll('#experience .journey-step').forEach(step => {
      gsap.from(step, {
        opacity: 0,
        y: 60,
        duration: 0.9,
        scrollTrigger: {
          trigger: step,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });

      const items = step.querySelectorAll('li');
      items.forEach((li, i) => {
        gsap.from(li, {
          opacity: 0,
          x: -30,
          duration: 0.5,
          delay: i * 0.08,
          scrollTrigger: {
            trigger: step,
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        });
      });
    });

    /* --------------------------------------------------------
       2e. PROJECTS — 3D Depth Cards
       -------------------------------------------------------- */
    const PROJECT_Z_OFFSET = 200;
    const projectSections = document.querySelectorAll('.project-section');

    document.querySelectorAll('#projects .panel-3d').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        delay: i * 0.12,
        scrollTrigger: {
          trigger: '#projects',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
    });

    projectSections.forEach((section, index) => {
      const card = section.querySelector('.project-3d');
      if (!card) return;

      const isEven = index % 2 === 0;
      const xOffset = isEven ? -80 : 80;

      gsap.from(card, {
        opacity: 0,
        y: 80,
        x: prefersReducedMotion ? 0 : xOffset,
        rotateY: prefersReducedMotion ? 0 : (isEven ? -3 : 3),
        rotateX: prefersReducedMotion ? 0 : 2,
        duration: 1,
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 0.8
        }
      });

      const listItems = card.querySelectorAll('.project-card__outcomes li');
      listItems.forEach((li, i) => {
        gsap.from(li, {
          opacity: 0,
          x: isEven ? -20 : 20,
          duration: 0.4,
          delay: i * 0.06,
          scrollTrigger: {
            trigger: card,
            start: 'top 65%',
            toggleActions: 'play none none none'
          }
        });
      });

      const tags = card.querySelectorAll('.project-card__tech-tag');
      tags.forEach((tag, i) => {
        gsap.from(tag, {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          delay: i * 0.04,
          scrollTrigger: {
            trigger: card,
            start: 'top 60%',
            toggleActions: 'play none none none'
          }
        });
      });

      const link = card.querySelector('.project-card__links');
      if (link) {
        gsap.from(link, {
          opacity: 0,
          y: 15,
          duration: 0.5,
          scrollTrigger: {
            trigger: card,
            start: 'top 55%',
            toggleActions: 'play none none none'
          }
        });
      }
    });

    /* --------------------------------------------------------
       2f. SKILLS — Tools & Stack: Bubble title + stagger cards
       -------------------------------------------------------- */
    (function initSkillsAnimation() {
      var skillsSection = document.querySelector('#skills');
      if (!skillsSection) return;

      /* 1. BUBBLE animation cho title — từng từ spring bounce */
      var titleWords = skillsSection.querySelectorAll('.ts-word, .ts-amp');
      var tsTitle = skillsSection.querySelector('.ts-title');
      var tsDivider = skillsSection.querySelector('.ts-divider');

      if (tsTitle && titleWords.length) {
        gsap.set(tsTitle, { opacity: 1 });
        gsap.set(titleWords, { scale: 0, opacity: 0, transformOrigin: 'center bottom' });

        var bubbleTL = gsap.timeline({
          scrollTrigger: {
            trigger: skillsSection,
            start: 'top 78%',
            toggleActions: 'play none none none'
          }
        });

        bubbleTL.to(titleWords, {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          ease: 'back.out(2.2)',   /* spring bounce = "bubble" effect */
          stagger: 0.12
        });

        if (tsDivider) {
          bubbleTL.to(tsDivider, {
            width: 60,
            duration: 0.5,
            ease: 'power2.out'
          }, '-=0.2');
        }
      }

      /* 2. STAGGER fade-up từng card */
      var cards = skillsSection.querySelectorAll('[data-ts-card]');
      if (cards.length) {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: { each: 0.07, from: 'start' },
          scrollTrigger: {
            trigger: skillsSection,
            start: 'top 72%',
            toggleActions: 'play none none none'
          }
        });
      }
    })();

    /* --------------------------------------------------------
       2g. CONTACT — Calm resolution
       -------------------------------------------------------- */
    document.querySelectorAll('#contact .panel-3d').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0,
        y: 30,
        duration: 1.2,
        delay: i * 0.15,
        scrollTrigger: {
          trigger: '#contact',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
    });
  }

  /* ============================================================
     3. SCROLL PROGRESS BAR
     ============================================================ */
  const progressBar = document.getElementById('scroll-progress');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && docHeight > 0) {
      progressBar.style.width = (scrollTop / docHeight * 100) + '%';
    }
  }

  /* ============================================================
     4. ACTIVE NAV LINK
     ============================================================ */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.global-nav__links a, .mobile-menu a');

  function updateActiveNav() {
    const scrollY = window.scrollY + 100;
    let currentSection = '';

    sections.forEach(section => {
      let offsetTop = section.offsetTop;
      if (section.parentElement && section.parentElement.classList.contains('pin-spacer')) {
        offsetTop = section.parentElement.offsetTop;
      }
      if (scrollY >= offsetTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && href.includes(currentSection)) {
        link.classList.add('active');
      }
    });
  }

  /* ============================================================
     5. MOBILE MENU
     ============================================================ */
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ============================================================
     6. SCROLL EVENT (progress + nav — throttled via rAF)
     ============================================================ */
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        updateActiveNav();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateProgress();
  updateActiveNav();

  /* ============================================================
     7. SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        let targetEl = target;
        if (target.parentElement && target.parentElement.classList.contains('pin-spacer')) {
          targetEl = target.parentElement;
        }

        if (typeof gsap !== 'undefined' && gsap.plugins.ScrollToPlugin) {
          gsap.to(window, {
            duration: 1,
            scrollTo: { y: targetEl, offsetY: 44 },
            ease: 'power3.inOut'
          });
        } else {
          const offsetTop = targetEl.offsetTop - 44;
          window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        }
      }
    });
  });

})();