/**
 * Axon Website - Test Suite (Vite project structure)
 * Run with: node tests/test.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

// ── File existence tests ──
console.log('\n--- File Existence (Vite Structure) ---');
const requiredFiles = [
  'index.html',
  'src/main.js',
  'src/styles/main.css',
  'src/assets/favicon.svg',
  'package.json',
  'vite.config.js',
];
requiredFiles.forEach((f) => {
  assert(fs.existsSync(path.join(ROOT, f)), `${f} exists`);
});

// ── Package.json tests ──
console.log('\n--- Package Configuration ---');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
assert(pkg.name === 'axon-website', 'Package name is axon-website');
assert(pkg.type === 'module', 'Package type is module (ESM)');
assert(pkg.scripts && pkg.scripts.dev === 'vite', 'Dev script uses vite');
assert(pkg.scripts && pkg.scripts.build === 'vite build', 'Build script uses vite build');
assert(pkg.scripts && pkg.scripts.preview === 'vite preview', 'Preview script exists');
assert(pkg.scripts && pkg.scripts.test, 'Test script defined');
assert(pkg.devDependencies && pkg.devDependencies.vite, 'Vite is a devDependency');

// ── Vite config tests ──
console.log('\n--- Vite Configuration ---');
const viteConfig = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf-8');
assert(viteConfig.includes('defineConfig'), 'Vite config uses defineConfig');
assert(viteConfig.includes('outDir'), 'Vite config has output directory');

// ── HTML content tests ──
console.log('\n--- HTML Content ---');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');

assert(html.includes('<!DOCTYPE html>'), 'Valid DOCTYPE');
assert(html.includes('<html lang="en"'), 'HTML lang attribute set');
assert(html.includes('<meta charset="UTF-8"'), 'Charset meta tag present');
assert(html.includes('<meta name="viewport"'), 'Viewport meta tag present');
assert(html.includes('type="module"'), 'Script uses type="module" (Vite)');
assert(html.includes('/src/main.js'), 'Entry point references src/main.js');

// ── Branding tests ──
console.log('\n--- Branding (Axon) ---');
assert(html.includes('Axon'), 'Company name "Axon" appears in HTML');
assert(!html.includes('Tenfold'), 'No "Tenfold" branding present');
assert(!html.includes('tenfold.systems'), 'No tenfold.systems domain references');
assert(html.includes('axon'), 'Lowercase "axon" brand references exist');

// ── Section structure tests ──
console.log('\n--- Section Structure ---');
assert(html.includes('id="navbar"') || html.includes('navbar'), 'Navigation/header present');
assert(html.includes('We design, build'), 'Hero tagline present');
assert(html.includes('We turn your ideas into shipped products'), 'Hero subtitle present');
assert(html.includes('id="services"'), 'Services section present');
assert(html.includes('id="work"'), 'Work/portfolio section present');
assert(html.includes('id="pricing"'), 'Pricing section present');
assert(html.includes('id="contact"'), 'Contact section present');
assert(html.includes('<footer'), 'Footer present');

// ── Services content ──
console.log('\n--- Services ---');
const services = ['AI Agents', 'SaaS Platforms', 'Web Apps', 'Mobile Apps', 'UI/UX Design', 'Product Strategy'];
services.forEach((s) => {
  assert(html.includes(s), `Service "${s}" listed`);
});

// ── Process steps ──
console.log('\n--- Process Steps ---');
const steps = ['Discovery', 'Design', 'Build', 'Launch'];
steps.forEach((s) => {
  assert(html.includes(s), `Process step "${s}" present`);
});

// ── Portfolio projects ──
console.log('\n--- Portfolio Projects ---');
const projects = ['G-Facility', 'Eleken', 'TripKarao', 'StrideIQ', 'Sokrateque', 'Harbinger AI', 'EazyConnections', 'MediaNet'];
projects.forEach((p) => {
  assert(html.includes(p), `Project "${p}" listed`);
});

// ── Trust bar ──
console.log('\n--- Trust Bar ---');
assert(html.includes('Trusted by'), 'Trust bar heading present');
assert(html.includes('Startups'), 'Startups trust item');
assert(html.includes('SaaS Teams'), 'SaaS Teams trust item');
assert(html.includes('6+ Countries'), '6+ Countries trust item');

// ── Testimonials ──
console.log('\n--- Testimonials ---');
assert(html.includes('testimonial'), 'Testimonial section present');
assert(html.includes('Tjaco Walvis'), 'Client name present');

// ── Promises ──
console.log('\n--- Promises ---');
assert(html.includes('Friendly Relationship'), 'Promise 1 present');
assert(html.includes('Design you will love'), 'Promise 2 present');

// ── Newsletter ──
console.log('\n--- Newsletter ---');
assert(html.includes('Notes on what we build'), 'Newsletter heading present');
assert(html.includes('<form'), 'Newsletter form present');
assert(html.includes('type="email"'), 'Email input present');

// ── Footer content ──
console.log('\n--- Footer ---');
assert(html.includes('Privacy Policy'), 'Privacy policy link');
assert(html.includes('Terms & Conditions'), 'Terms link');
assert(html.includes('2026 Axon'), 'Copyright with Axon branding');

// ── JavaScript tests ──
console.log('\n--- JavaScript ---');
const js = fs.readFileSync(path.join(ROOT, 'src/main.js'), 'utf-8');
assert(js.includes("import './styles/main.css'"), 'CSS imported in JS entry (Vite pattern)');
assert(js.includes('navbar'), 'Navbar scroll behavior');
assert(js.includes('mobile-menu') || js.includes('mobileMenu'), 'Mobile menu logic');
assert(js.includes('IntersectionObserver'), 'Scroll animations (IntersectionObserver)');
assert(js.includes('testimonial'), 'Testimonial slider logic');
assert(js.includes('smooth'), 'Smooth scroll behavior');

// ── CSS tests ──
console.log('\n--- CSS Styles ---');
const css = fs.readFileSync(path.join(ROOT, 'src/styles/main.css'), 'utf-8');
assert(css.includes('Manrope'), 'Sans font (Manrope) loaded');
assert(css.includes('Playfair Display'), 'Serif font (Playfair Display) loaded');
assert(css.includes('--body-bg: #e9e3db'), 'Light body background (#e9e3db)');
assert(css.includes('--body-text: #2b1b1a'), 'Dark body text (#2b1b1a)');
assert(css.includes('--brand-accent: #c4a574'), 'Brand accent color (#c4a574)');
assert(css.includes('--color-border: rgba(43, 27, 26, 0.16)'), 'Border color token');
assert(css.includes('.dark-section'), 'Dark section styling');
assert(css.includes('--card-dark: #3a2726'), 'Card dark background (#3a2726)');
assert(css.includes('hero-aurora'), 'Hero aurora animation');
assert(css.includes('::selection'), 'Selection color styling');
assert(css.includes('.fade-in'), 'Fade-in animation classes');
assert(css.includes('.service-card'), 'Service card styles');
assert(css.includes('.project-card'), 'Project card styles');
assert(css.includes('.mobile-menu'), 'Mobile menu styles');
assert(css.includes('@media'), 'Responsive media queries present');

// ── Responsive behavior ──
console.log('\n--- Responsive Behavior ---');
assert(css.includes('min-width: 1024px'), 'Large breakpoint responsive rules');
assert(css.includes('min-width: 768px'), 'Medium breakpoint responsive rules');
assert(css.includes('min-width: 640px'), 'Small breakpoint responsive rules');
assert(css.includes('min-width: 1280px'), 'Extra-large breakpoint responsive rules');

// ── Summary ──
console.log(`\n=============================`);
console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`);
console.log(`=============================\n`);

process.exit(failed > 0 ? 1 : 0);
