/* ============================================================
   main.js — Scroll Storytelling Engine
   Three.js (hero background) + GSAP ScrollTrigger (all sections)
   
   ARCHITECTURE:
   1. Three.js — Minimal particle field behind hero
   2. GSAP Hero — Z-depth parallax, dolly-in on scroll
   3. GSAP Highlights — Counter animation + stagger reveal
   4. GSAP About — Step-by-step content reveal
   5. GSAP Experience — Timeline reveal
   6. GSAP Projects — 3D depth card entrance from Z-axis
   7. GSAP Skills — Layered plane reveal
   8. GSAP Contact — Calm fade-in resolution
   9. Navigation — Mobile menu, active state, scroll progress
   
   CONSTANTS:
   - Camera perspective: 1200px (CSS --perspective)
   - Hero scroll range: 0 to 100vh
   - Project Z-offset: 200px (cards enter from behind)
   - Easing: power2.out (smooth, not flashy)
   - All scroll ranges use "top bottom" / "bottom top" triggers
   ============================================================ */

(function () {
  'use strict';

  /* --- Check for reduced motion preference --- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. THREE.JS — PARTICLE FIELD HERO BACKGROUND
     Lightweight: ~150 particles, no physics, no shaders.
     Fades out as user scrolls past the hero.
     ============================================================ */
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || prefersReducedMotion) return null;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 800; /* Camera distance constant */

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: false, /* Performance: skip AA */
      powerPreference: 'low-power'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); /* Cap for performance */

    /* Create particle geometry */
    const PARTICLE_COUNT = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3); /* Stored separately */

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 1600; /* X: spread */
      positions[i3 + 1] = (Math.random() - 0.5) * 1000; /* Y: spread */
      positions[i3 + 2] = (Math.random() - 0.5) * 800;  /* Z: depth */
      velocities[i3] = (Math.random() - 0.5) * 0.15;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    /* Material: tiny blue dots matching primary color */
    const material = new THREE.PointsMaterial({
      color: 0x2997ff, /* primary-on-dark */
      size: 2.5,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    /* Scroll-driven camera Z movement */
    let scrollProgress = 0;

    /* Render loop */
    let animationId;
    function animate() {
      animationId = requestAnimationFrame(animate);

      /* Gentle particle drift */
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        pos[i3] += velocities[i3];
        pos[i3 + 1] += velocities[i3 + 1];
        pos[i3 + 2] += velocities[i3 + 2];

        /* Wrap around boundaries */
        if (pos[i3] > 800) pos[i3] = -800;
        if (pos[i3] < -800) pos[i3] = 800;
        if (pos[i3 + 1] > 500) pos[i3 + 1] = -500;
        if (pos[i3 + 1] < -500) pos[i3 + 1] = 500;
      }
      geometry.attributes.position.needsUpdate = true;

      /* Dolly camera forward on scroll (0 → 200px into scene) */
      camera.position.z = 800 - scrollProgress * 200;
      material.opacity = 0.4 * (1 - scrollProgress);

      /* Fade out canvas as user scrolls past hero */
      canvas.style.opacity = 1 - scrollProgress;

      renderer.render(scene, camera);
    }

    animate();

    /* Resize handler */
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
     Types text one character at a time with a callback on complete.
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
     HELPER: Avatar Card 3D Tilt
     Rotates card based on mouse position for a 3D hover effect.
     Uses perspective in the transform for per-element 3D.
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
     HELPER: Create scroll-driven hero fade-out animations.
     Called AFTER the intro timeline completes to avoid conflicts.
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
     2. GSAP + SCROLLTRIGGER REGISTRATION
     ============================================================ */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    /* Global GSAP defaults: consistent easing */
    gsap.defaults({
      ease: 'power2.out',
      duration: 1
    });

    /* --------------------------------------------------------
       2a. HERO — Cinematic Intro Timeline
       Phase 1 (0–1s): Splash entrance — text fades in
       Phase 2 (3–4.5s): Transition — layout morph, nav + card enter
       Phase 3 (4.5–6s): Typing effect with blinking cursor
       After 6s: Interactive 3D tilt on avatar card
       -------------------------------------------------------- */
    if (!prefersReducedMotion) {
      const heroIntro = document.getElementById('hero-intro');
      const introGreeting = document.querySelector('.hero__intro-greeting');
      const introName = document.getElementById('hero-name-intro');
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

      /* Skip intro if page is already scrolled (e.g., reload mid-page) */
      if (window.scrollY > 100) {
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
      } else {
        /* Set initial hidden states */
        gsap.set(heroFinal, { opacity: 0, visibility: 'hidden' });
        gsap.set(heroCtas, { opacity: 0, y: 20 });
        gsap.set(heroTyping, { opacity: 0 });
        if (scrollHint) gsap.set(scrollHint, { opacity: 0 });
        if (heroGreetingFinal) gsap.set(heroGreetingFinal, { opacity: 0, y: 10 });
        if (heroTagline) gsap.set(heroTagline, { opacity: 0, y: 10 });

        /* ---- Master Timeline ---- */
        const heroTL = gsap.timeline();

        heroTL
          /* Phase 1: Splash entrance (0s–1s) */
          .from(introGreeting, {
            opacity: 0, y: 30,
            duration: 0.8, ease: 'power2.out'
          }, 0.3)
          .from(introName, {
            opacity: 0, y: 30, scale: 0.95,
            duration: 0.9, ease: 'power2.out'
          }, 0.7)

          /* Phase 2: Hero Transition (at t=3s) */
          .addLabel('transition', 3)

          /* "Hello, I'm" fades out + slides up */
          .to(introGreeting, {
            opacity: 0, y: -30,
            duration: 0.5, ease: 'power2.inOut'
          }, 'transition')

          /* Name scales down + fades */
          .to(introName, {
            opacity: 0, scale: 0.7, y: -20,
            duration: 0.6, ease: 'power2.inOut'
          }, 'transition+=0.15')

          /* Switch containers */
          .set(heroIntro, { display: 'none' }, 'transition+=0.7')
          .set(heroFinal, { visibility: 'visible' }, 'transition+=0.7')
          .to(heroFinal, {
            opacity: 1, duration: 0.01
          }, 'transition+=0.7')

          /* Greeting fades in */
          .from(heroGreetingFinal, {
            opacity: 0, y: 10,
            duration: 0.4, ease: 'power2.out'
          }, 'transition+=0.7')

          /* Final name enters from left */
          .from(heroNameFinal, {
            opacity: 0, x: -20,
            duration: 0.6, ease: 'power2.out'
          }, 'transition+=0.75')

          /* Navbar slides in from top */
          .to(globalNav, {
            y: 0, opacity: 1,
            duration: 1, ease: 'power2.out'
          }, 'transition+=1.5')

          /* Avatar card enters from right with scale */
          .fromTo(avatarCard, {
            opacity: 0, scale: 0.9, x: 80
          }, {
            opacity: 1, scale: 1, x: 0,
            duration: 0.7, ease: 'power2.out'
          }, 'transition+=0.9')

          /* CTAs fade in */
          .to(heroCtas, {
            opacity: 1, y: 0,
            duration: 0.4, ease: 'power2.out'
          }, 'transition+=1.1')

          /* Tagline fades in */
          .to(heroTagline, {
            opacity: 1, y: 0,
            duration: 0.5, ease: 'power2.out'
          }, 'transition+=1.2')

          /* Phase 3: Typing effect (at ~t=4.5s) */
          .set(heroTyping, { opacity: 1 }, 'transition+=1.3')
          .add(function () {
            typeText(typingTextEl, 'Aspiring Web Developer', 70, function () {
              /* Activate 3D tilt after typing completes */
              initAvatarTilt(avatarCard);
            });
          }, 'transition+=1.3')

          /* Show scroll hint after typing (~t=6s) */
          .to(scrollHint, {
            opacity: 1,
            duration: 0.5, ease: 'power2.out'
          }, 'transition+=3')

          /* Create scroll animations after intro finishes */
          .add(function () {
            createHeroScrollAnimations();
          }, 'transition+=3.5');
      }

      /* Drive Three.js camera with scroll (always active) */
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

    /* Counter animation for data-count elements */
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
       2c. ABOUT — Step-by-step 3D panel reveal
       Content rises from depth and fades in.
       -------------------------------------------------------- */
    document.querySelectorAll('#about .panel-3d').forEach((el, i) => {
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

    document.querySelectorAll('#about .journey-step').forEach(step => {
      gsap.from(step, {
        opacity: 0,
        y: 60,
        rotateX: prefersReducedMotion ? 0 : 3, /* Subtle 3D tilt */
        duration: 0.9,
        scrollTrigger: {
          trigger: step,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      });
    });

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

      /* Stagger list items */
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
       2e. PROJECTS — 3D DEPTH CARDS (MOST IMPORTANT)
       Each project card enters from Z-axis depth.
       Cards translate from behind (Z: -200px) to Z: 0.
       Alternating slide direction for visual rhythm.
       -------------------------------------------------------- */
    const PROJECT_Z_OFFSET = 200; /* Depth offset in px */
    const projectSections = document.querySelectorAll('.project-section');

    /* Projects header */
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

    /* Each project card: slide from depth */
    projectSections.forEach((section, index) => {
      const card = section.querySelector('.project-3d');
      if (!card) return;

      const isEven = index % 2 === 0;
      const xOffset = isEven ? -80 : 80; /* Alternate left/right */

      gsap.from(card, {
        opacity: 0,
        y: 80,
        x: prefersReducedMotion ? 0 : xOffset,
        rotateY: prefersReducedMotion ? 0 : (isEven ? -3 : 3), /* Subtle 3D turn */
        rotateX: prefersReducedMotion ? 0 : 2,
        duration: 1,
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 0.8 /* Tied to scroll for cinematic feel */
        }
      });

      /* Stagger list items within each project */
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

      /* Tech tags stagger */
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

      /* GitHub link entrance */
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
       2f. SKILLS — Layered plane depth reveal
       Each skill category enters from a different Z-depth,
       creating a camera-moving-through-layers effect.
       -------------------------------------------------------- */
    document.querySelectorAll('#skills .panel-3d').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0,
        y: 40 + i * 10, /* Deeper elements have more vertical offset */
        duration: 0.7,
        delay: i * 0.08,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });

    /* --------------------------------------------------------
       2g. CONTACT — Calm resolution
       Animation slows down. Content fades in gently.
       No 3D transforms—flat, quiet, confident.
       -------------------------------------------------------- */
    document.querySelectorAll('#contact .panel-3d').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0,
        y: 30,
        duration: 1.2, /* Slower = calmer */
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
      if (scrollY >= section.offsetTop) {
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
        const offsetTop = target.offsetTop - 44; /* Account for nav height */
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    });
  });

})();
