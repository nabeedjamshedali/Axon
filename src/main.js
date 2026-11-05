// ── Import styles ──
import './styles/main.css';

// ── Navbar scroll behavior ──
const navbar = document.getElementById('navbar');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  if (currentScrollY > 80) {
    navbar.style.backgroundColor = 'rgba(255,255,255,0.92)';
    navbar.style.backdropFilter = 'blur(12px)';
    navbar.style.borderColor = '#e6e6e6';
  } else {
    navbar.style.backgroundColor = 'transparent';
    navbar.style.backdropFilter = 'none';
    navbar.style.borderColor = 'transparent';
  }
  if (currentScrollY > lastScrollY && currentScrollY > 300) {
    navbar.style.transform = 'translateY(-100%)';
  } else {
    navbar.style.transform = 'translateY(0)';
  }
  lastScrollY = currentScrollY;
});

// ── Mobile menu ──
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

// Expose globally for onclick handlers
window.closeMobileMenu = closeMobileMenu;

menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});

// ── Fade-in on scroll (Intersection Observer) ──
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
fadeEls.forEach((el) => fadeObserver.observe(el));

// ── Testimonial slider ──
const track = document.getElementById('testimonial-track');
const slides = track ? track.children : [];
const totalSlides = slides.length;
let currentSlide = 0;

function goToSlide(index) {
  if (index < 0) index = totalSlides - 1;
  if (index >= totalSlides) index = 0;
  currentSlide = index;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  const currentEl = document.getElementById('current-slide');
  if (currentEl) currentEl.textContent = String(currentSlide + 1).padStart(2, '0');
}

const prevBtn = document.getElementById('prev-testimonial');
const nextBtn = document.getElementById('next-testimonial');

if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

// Auto-advance testimonials every 6 seconds
let autoSlide = setInterval(() => goToSlide(currentSlide + 1), 6000);
[prevBtn, nextBtn].forEach((btn) => {
  if (btn) {
    btn.addEventListener('click', () => {
      clearInterval(autoSlide);
      autoSlide = setInterval(() => goToSlide(currentSlide + 1), 6000);
    });
  }
});

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMobileMenu();
    }
  });
});

// ── Newsletter: POST to the application tier ──
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = newsletterForm.querySelector('button');
    const email = new FormData(newsletterForm).get('email');
    button.disabled = true;
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      button.textContent = res.ok ? 'Subscribed!' : 'Try again';
      if (res.ok) newsletterForm.reset();
    } catch {
      button.textContent = 'Try again';
    }
    setTimeout(() => { button.textContent = 'Subscribe'; button.disabled = false; }, 2500);
  });
}

// ── System status: shows which instance/zone served the API call (load-balancing evidence) ──
const statusEl = document.getElementById('system-status');
if (statusEl) {
  fetch('/api/health')
    .then((r) => r.json())
    .then((d) => {
      const i = d.instance || {};
      statusEl.textContent = `API ${d.status} · DB ${d.database} · served by ${i.hostname || 'unknown'} (${i.az || '?'}) · v${i.version || '?'}`;
    })
    .catch(() => { statusEl.textContent = 'API unreachable'; });
}
