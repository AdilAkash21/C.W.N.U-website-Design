/**
 * C.W.N.U site main JS
 *  - Mobile nav with backdrop + body scroll lock
 *  - Sticky nav shadow on scroll
 *  - Back-to-top button
 *  - Scroll reveal via IntersectionObserver
 *  - Dark/light theme with localStorage persistence
 *  - Smooth-scroll for in-page anchors
 *  - Contact form (Formspree fetch)
 *  - Blog comments (localStorage)
 */

const ready = (fn) => {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
};

ready(() => {
    initTheme();
    initMobileNav();
    initStickyNav();
    initBackToTop();
    initReveal();
    initSmoothScroll();
    initContactForm();
    initComments();
});

/* -------------------- Theme -------------------- */
function initTheme() {
    const STORAGE_KEY = 'cwnu-theme';
    const root = document.documentElement;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
        root.setAttribute('data-theme', saved);
    } else {
        root.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    const nav = document.querySelector('.site-nav');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.innerHTML = `<i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i>`;
    btn.addEventListener('click', () => {
        const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', current);
        localStorage.setItem(STORAGE_KEY, current);
    });
    nav.appendChild(btn);
}

/* -------------------- Mobile nav -------------------- */
function initMobileNav() {
    const overlay = document.getElementById('navLinks');
    const toggle = document.querySelector('.nav-toggle');
    const backdrop = document.querySelector('[data-nav-backdrop]');
    if (!overlay || !toggle) return;

    const open = () => {
        overlay.dataset.open = 'true';
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        if (backdrop) {
            backdrop.hidden = false;
            requestAnimationFrame(() => backdrop.dataset.show = 'true');
        }
    };
    const close = () => {
        overlay.dataset.open = 'false';
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        if (backdrop) {
            backdrop.dataset.show = 'false';
            setTimeout(() => (backdrop.hidden = true), 350);
        }
    };

    toggle.addEventListener('click', () => {
        if (overlay.dataset.open === 'true') close(); else open();
    });
    backdrop?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    overlay.querySelectorAll('.nav-overlay-links a').forEach((a) => a.addEventListener('click', close));
}

/* -------------------- Sticky nav shadow -------------------- */
function initStickyNav() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

/* -------------------- Back to top -------------------- */
function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    btn.hidden = false;
    const onScroll = () => btn.dataset.show = window.scrollY > 400 ? 'true' : 'false';
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* -------------------- Scroll reveal -------------------- */
function initReveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || !targets.length) {
        targets.forEach((t) => t.classList.add('is-visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    targets.forEach((t) => io.observe(t));
}

/* -------------------- Smooth scroll -------------------- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (!id || id === '#') return;
            const el = document.querySelector(id);
            if (!el) return;
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.pushState(null, '', id);
        });
    });
}

/* -------------------- Contact form (Formspree) -------------------- */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (form.querySelector('[name="website"]')?.value) {
            if (status) status.innerHTML = '<p class="form-status form-status--ok" role="status">Thanks! Your message has been sent.</p>';
            form.reset();
            return;
        }

        const data = new FormData(form);
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: data,
                headers: { 'Accept': 'application/json' }
            });

            if (res.ok) {
                if (status) status.innerHTML = '<p class="form-status form-status--ok" role="status">Thanks! Your message has been sent.</p>';
                form.reset();
            } else {
                const json = await res.json();
                if (json.errors) {
                    const msg = json.errors.map((e) => e.message).join(', ');
                    if (status) status.innerHTML = `<p class="form-status form-status--err" role="alert">${msg}</p>`;
                } else {
                    if (status) status.innerHTML = '<p class="form-status form-status--err" role="alert">Something went wrong. Please try again.</p>';
                }
            }
        } catch {
            if (status) status.innerHTML = '<p class="form-status form-status--err" role="alert">Network error. Please check your connection and try again.</p>';
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Submit'; }
        }
    });
}

/* -------------------- Blog comments (localStorage) -------------------- */
const COMMENTS_KEY = 'cwnu-comments';

function getComments() {
    try { return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || []; }
    catch { return []; }
}

function saveComments(list) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(list));
}

function renderComments() {
    const container = document.getElementById('commentsContainer');
    const countEl = document.getElementById('commentCount');
    if (!container) return;

    const comments = getComments();
    if (countEl) countEl.textContent = comments.length;

    if (!comments.length) {
        container.innerHTML = '<p style="color:#666;font-size:14px;">No comments yet. Be the first to comment!</p>';
        return;
    }

    container.innerHTML = comments.slice(-10).map((c) => `
        <article class="blog-comment-item">
            <div class="blog-comment-header">
                <div class="blog-comment-avatar">${escapeHtml(c.name).charAt(0).toUpperCase()}</div>
                <div>
                    <div class="blog-comment-author">${escapeHtml(c.name)}</div>
                    <time class="blog-comment-date" datetime="${escapeHtml(c.date)}">${escapeHtml(c.date)}</time>
                </div>
            </div>
            <p class="blog-comment-body">${escapeHtml(c.message).replace(/\n/g, '<br>')}</p>
        </article>
    `).join('');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function initComments() {
    const form = document.getElementById('commentForm');
    if (!form) return;

    renderComments();

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (form.querySelector('[name="website"]')?.value) {
            form.reset();
            return;
        }

        const name = form.querySelector('[name="name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const message = form.querySelector('[name="message"]').value.trim();

        if (!name || !email || !message) return;

        const comments = getComments();
        comments.push({
            name: name,
            email: email,
            message: message,
            date: new Date().toISOString()
        });
        saveComments(comments);

        form.reset();
        renderComments();

        const box = document.getElementById('comments');
        if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
