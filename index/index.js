/* app.js - versión segura: selecciona elementos tras DOMContentLoaded */

(function () {
  'use strict';

  // Helpers (seguimos disponibles fuera del DOMContentLoaded)
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const safeJSON = (str, fallback = {}) => {
    try { return JSON.parse(str || 'null') || fallback; }
    catch (e) { return fallback; }
  };

  // Ejecutar cuando el DOM esté listo (evita que las queries devuelvan listas vacías)
  document.addEventListener('DOMContentLoaded', () => {

    // Elements (ahora sí tras carga del DOM)
    const moduleBtns = $$('.module-btn');
    const accordion = $('#accordion') || $('.accordion') || $('#pageRoot') || document.body;
    const cards = $$('.topic-card', accordion);
    const searchBox = $('#searchBox') || $('.search-inline input') || null;
    const previewText = $('#previewText');
    const previewList = $('#previewList');
    const repoBtn = $('#repoBtn');

    // Estado persistente (localStorage)
    const saved = safeJSON(localStorage.getItem('diw_state'), {});
    let currentModule = saved.currentModule || (moduleBtns[0]?.dataset?.module) || (cards[0]?.dataset?.module) || 'lenguaje';

    // Guard: si no hay tarjetas, conectamos botones mínimos y salimos sin errores
    if (!cards.length) {
      if (repoBtn) {
        repoBtn.addEventListener('click', (e) => { e.preventDefault(); alert('Añade aquí el enlace a tu repositorio'); });
      }
      return;
    }

    /* ========== Funciones principales ========== */

    function applyModule(module) {
      currentModule = module;
      moduleBtns.forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.module === module ? 'true' : 'false'));
      cards.forEach(card => {
        if (card.dataset.module === module) {
          card.hidden = false;
        } else {
          card.hidden = true;
          card.setAttribute('aria-expanded', 'false');
        }
      });
      try {
        localStorage.setItem('diw_state', JSON.stringify({ currentModule }));
      } catch (e) {}
    }

    function showPreview(card) {
      if (!previewText || !previewList) return;
      const titleEl = card.querySelector('.topic-header h3') || card.querySelector('h3');
      const title = titleEl ? titleEl.textContent.trim() : 'Tema';
      const descEl = card.querySelector('.topic-body .small-muted') || null;
      const desc = descEl ? descEl.textContent.trim() : '';
      const links = $$('.ej-btn', card);

      previewText.textContent = title + (desc ? ' — ' + desc : '');
      previewList.innerHTML = '';
      links.forEach(a => {
        const link = document.createElement('a');
        link.className = 'ej-btn';
        link.href = a.getAttribute('href') || '#';
        link.textContent = a.textContent || 'Ejercicio';
        link.style.display = 'inline-block';
        link.style.padding = '8px 10px';
        link.style.borderRadius = '8px';
        link.style.textDecoration = 'none';
        previewList.appendChild(link);
      });
    }

    function clearPreview() {
      if (!previewText || !previewList) return;
      previewText.textContent = 'Selecciona un tema para ver descripción y ejercicios.';
      previewList.innerHTML = '';
    }

    function toggleCard(card) {
      if (!card) return;
      const expanded = card.getAttribute('aria-expanded') === 'true';
      cards.forEach(c => {
        if (c !== card && c.dataset.module === card.dataset.module) {
          c.setAttribute('aria-expanded', 'false');
        }
      });
      card.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (!expanded) showPreview(card);
      else clearPreview();
    }

    function filter(q) {
      const ql = (q || '').trim().toLowerCase();
      cards.forEach(c => {
        const text = (c.textContent || '').toLowerCase();
        const matches = !ql || text.indexOf(ql) !== -1;
        if (c.dataset.module === currentModule) {
          c.hidden = !matches;
          if (!matches) c.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* ========== Eventos ========== */

    if (moduleBtns.length) {
      moduleBtns.forEach(btn => {
        btn.addEventListener('click', () => applyModule(btn.dataset.module));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            applyModule(btn.dataset.module);
          }
        });
      });
    } else {
      const modulesFound = Array.from(new Set(cards.map(c => c.dataset.module).filter(Boolean)));
      if (modulesFound.length && !saved.currentModule) {
        currentModule = modulesFound[0];
      }
    }

    accordion.addEventListener('click', (e) => {
      const header = e.target.closest && e.target.closest('.topic-header');
      if (!header) return;
      const card = header.closest('.topic-card');
      toggleCard(card);
    });

    accordion.addEventListener('keydown', (e) => {
      const header = e.target.closest && e.target.closest('.topic-header');
      if (!header) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const card = header.closest('.topic-card');
        toggleCard(card);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = header.closest('.topic-card').nextElementSibling;
        next?.querySelector('.topic-header')?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = header.closest('.topic-card').previousElementSibling;
        prev?.querySelector('.topic-header')?.focus();
      }
    });

    if (searchBox) {
      searchBox.addEventListener('input', (e) => filter(e.target.value));
      window.addEventListener('beforeunload', () => {
        try {
          const s = safeJSON(localStorage.getItem('diw_state'), {});
          s.lastSearch = searchBox.value || '';
          localStorage.setItem('diw_state', JSON.stringify(s));
        } catch (err) {}
      });
    }

    if (repoBtn) {
      repoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Añade aquí el enlace a tu repositorio');
      });
    }

    /* ========== Inicialización ========== */
    applyModule(currentModule);

    const prevState = safeJSON(localStorage.getItem('diw_state'), {});
    if (prevState.lastSearch && searchBox) {
      searchBox.value = prevState.lastSearch;
      filter(prevState.lastSearch);
    }

    const firstVisible = cards.find(c => !c.hidden);
    if (firstVisible) {
      const header = firstVisible.querySelector('.topic-header');
      if (header) header.setAttribute('tabindex', '0');
    }

    clearPreview();
  });

})();
