// animations.js — GSAP animations for HomeSync Landing Page
// Handles: hero entrance, scroll-triggered reveals, parallax, navbar, mobile nav

document.addEventListener('DOMContentLoaded', () => {

    // ─── Navbar scroll shadow ────────────────────────────────────────────────
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    // ─── Mobile Navigation Toggle ────────────────────────────────────────────
    const navToggle = document.getElementById('nav-toggle');
    const navLinks  = document.getElementById('nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', String(isOpen));

            // Animate hamburger to X
            const spans = navToggle.querySelectorAll('span');
            if (isOpen) {
                spans[0].style.transform = 'translateY(7px) rotate(45deg)';
                spans[1].style.opacity   = '0';
                spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity   = '';
                spans[2].style.transform = '';
            }
        });

        // Close when a nav link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.querySelectorAll('span').forEach(s => {
                    s.style.transform = '';
                    s.style.opacity   = '';
                });
            });
        });
    }

    // ─── GSAP Animations ─────────────────────────────────────────────────────
    if (typeof gsap === 'undefined') {
        // Fallback: use CSS-only reveal for .gs-fade-up elements
        fallbackReveal();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // ── Hero Entrance Timeline ──────────────────────────────────────────────
    const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTL
        .from('.hero-eyebrow', { y: 30, opacity: 0, duration: 0.7 })
        .from('.hero-title',   { y: 50, opacity: 0, duration: 1.0 }, '-=0.4')
        .from('.hero-subtitle',{ y: 30, opacity: 0, duration: 0.8 }, '-=0.7')
        .from('.hero-actions', { y: 20, opacity: 0, duration: 0.7 }, '-=0.6')
        .from('.hero-trust',   { y: 20, opacity: 0, duration: 0.6 }, '-=0.5')
        .from('#hero-img',     { scale: 0.92, opacity: 0, duration: 1.2, ease: 'power2.out' }, '-=1.3')
        .from('.floating-badge', {
            y: 24, opacity: 0, duration: 0.7,
            stagger: 0.2, ease: 'back.out(1.5)'
        }, '-=0.9');

    // ── Scroll-triggered .gs-fade-up ────────────────────────────────────────
    gsap.utils.toArray('.gs-fade-up').forEach((el, i) => {
        gsap.fromTo(el,
            { y: 40, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.75,
                ease: 'power3.out',
                delay: parseFloat(el.style.transitionDelay) || 0,
                scrollTrigger: {
                    trigger:       el,
                    start:         'top 88%',
                    toggleActions: 'play none none reverse'
                }
            }
        );
    });

    // ── Stat Numbers Count-Up ────────────────────────────────────────────────
    gsap.utils.toArray('.stat-number').forEach(el => {
        const rawText = el.textContent.trim();
        // Only animate if it's a pure number
        const num = parseFloat(rawText);
        if (!isNaN(num) && rawText === String(Math.round(num))) {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start:   'top 85%'
                },
                textContent: 0,
                duration:    1.5,
                ease:        'power2.out',
                snap:        { textContent: 1 },
                onUpdate: function() {
                    el.textContent = Math.round(this.targets()[0].textContent);
                }
            });
        }
    });

    // ── Section headings stagger ─────────────────────────────────────────────
    gsap.utils.toArray('.section-heading').forEach(el => {
        gsap.from(el, {
            scrollTrigger: { trigger: el, start: 'top 88%' },
            y: 30, opacity: 0, duration: 0.8, ease: 'power3.out'
        });
    });
    gsap.utils.toArray('.section-subheading').forEach(el => {
        gsap.from(el, {
            scrollTrigger: { trigger: el, start: 'top 88%' },
            y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1
        });
    });

    // ── Parallax Background Orbs ─────────────────────────────────────────────
    gsap.to('.background-decor-1', {
        scrollTrigger: {
            trigger: 'body',
            start:   'top top',
            end:     'bottom bottom',
            scrub:   1
        },
        y: 250, x: -50, rotation: 30
    });

    gsap.to('.background-decor-2', {
        scrollTrigger: {
            trigger: 'body',
            start:   'top top',
            end:     'bottom bottom',
            scrub:   1.5
        },
        y: -200, x: 60, rotation: -20
    });

    // ── Product cards stagger on scroll ──────────────────────────────────────
    gsap.utils.toArray('.product-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 88%' },
            y: 50, opacity: 0,
            duration: 0.7, delay: i * 0.12, ease: 'power3.out'
        });
    });

    // ── Testimonial cards stagger ─────────────────────────────────────────────
    gsap.utils.toArray('.testimonial-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 88%' },
            y: 40, opacity: 0,
            duration: 0.65, delay: i * 0.15, ease: 'power3.out'
        });
    });

    // ── Ecosystem steps ───────────────────────────────────────────────────────
    gsap.utils.toArray('.eco-step').forEach((step, i) => {
        gsap.from(step, {
            scrollTrigger: { trigger: step, start: 'top 88%' },
            x: -30, opacity: 0,
            duration: 0.6, delay: i * 0.15, ease: 'power3.out'
        });
    });

    // ── Ecosystem mockup ──────────────────────────────────────────────────────
    gsap.from('.ecosystem-mockup', {
        scrollTrigger: { trigger: '.ecosystem-mockup', start: 'top 85%' },
        scale: 0.93, opacity: 0, y: 30,
        duration: 0.9, ease: 'power3.out'
    });

    // ── CTA Section ───────────────────────────────────────────────────────────
    gsap.from('.cta-section h2, .cta-section p, .cta-actions', {
        scrollTrigger: { trigger: '.cta-section', start: 'top 80%' },
        y: 30, opacity: 0,
        duration: 0.8, stagger: 0.15, ease: 'power3.out'
    });

});

// ─── CSS Fallback Reveal (no GSAP) ─────────────────────────────────────────────
function fallbackReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.gs-fade-up').forEach(el => observer.observe(el));
}
