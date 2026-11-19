/* EB Lawyers — cookie consent manager. Stores choice in a first-party cookie (180 days). */
(function () {
  'use strict';
  var NAME = 'eb_consent', VERSION = 1, DAYS = 180;
  var CATS = [
    { id: 'necessary', locked: true, title: 'Necesarias',
      text: 'Permiten que el sitio funcione y recuerdan tu elección sobre cookies. No se pueden desactivar.' },
    { id: 'thirdparty', title: 'Contenido de terceros',
      text: 'Cargan el reproductor de YouTube de nuestro podcast “Letra Fina”. YouTube (Google) puede instalar cookies y recibir tu dirección IP.' },
    { id: 'analytics', title: 'Analítica',
      text: 'Medirían de forma agregada cómo se usa el sitio. Hoy no usamos herramientas de analítica; si las incorporamos, solo se activarán con tu permiso.' }
  ];

  function read() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + NAME + '=([^;]*)'));
    if (!m) return null;
    try { var c = JSON.parse(decodeURIComponent(m[1])); return c && c.v === VERSION ? c : null; } catch (e) { return null; }
  }
  function write(c) {
    c.v = VERSION; c.necessary = true; c.ts = new Date().toISOString();
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = NAME + '=' + encodeURIComponent(JSON.stringify(c)) + '; max-age=' + DAYS * 86400 + '; path=/; SameSite=Lax' + secure;
    document.dispatchEvent(new CustomEvent('eb-consent-change', { detail: c }));
    return c;
  }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html) n.innerHTML = html;
    return n;
  }
  function removeBanner() { var b = document.getElementById('ebc-banner'); if (b) b.remove(); }

  function save(opts) { var c = write(opts); removeBanner(); closeModal(); applyEmbeds(); return c; }

  var lastFocus = null;
  function closeModal() {
    var o = document.getElementById('ebc-overlay'); if (!o) return;
    o.remove(); document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') { if (read()) closeModal(); }
    if (e.key === 'Tab') {
      var o = document.getElementById('ebc-overlay'); if (!o) return;
      var f = o.querySelectorAll('button,input:not([disabled])'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function openModal() {
    if (document.getElementById('ebc-overlay')) return;
    lastFocus = document.activeElement;
    var cur = read() || {};
    var ov = el('div', { id: 'ebc-overlay', class: 'ebc-overlay' });
    var m = el('div', { class: 'ebc-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ebc-title' });
    m.appendChild(el('button', { class: 'ebc-close', type: 'button', 'aria-label': 'Cerrar' }, '&times;'));
    m.appendChild(el('h2', { id: 'ebc-title' }, 'Preferencias de cookies'));
    m.appendChild(el('p', {}, 'Elige qué categorías permites. Puedes cambiar tu decisión en cualquier momento desde el pie de página. Más información en la <a href="/cookies.html">Política de Cookies</a>.'));
    CATS.forEach(function (c) {
      var row = el('div', { class: 'ebc-cat' });
      row.appendChild(el('div', {}, '<h3>' + c.title + '</h3><p>' + c.text + '</p>'));
      var sw = el('label', { class: 'ebc-switch' });
      var inp = el('input', { type: 'checkbox', 'data-cat': c.id, 'aria-label': c.title });
      if (c.locked) { inp.checked = true; inp.disabled = true; } else { inp.checked = !!cur[c.id]; }
      sw.appendChild(inp); sw.appendChild(el('span', {}));
      row.appendChild(sw); m.appendChild(row);
    });
    var act = el('div', { class: 'ebc-actions' });
    var bSave = el('button', { class: 'ebc-btn ebc-btn-primary', type: 'button' }, 'Guardar selección');
    var bAll = el('button', { class: 'ebc-btn ebc-btn-ghost', type: 'button' }, 'Aceptar todas');
    var bNone = el('button', { class: 'ebc-btn ebc-btn-ghost', type: 'button' }, 'Rechazar opcionales');
    bSave.onclick = function () {
      var o = {}; m.querySelectorAll('input[data-cat]').forEach(function (i) { o[i.getAttribute('data-cat')] = i.checked; }); save(o);
    };
    bAll.onclick = function () { save({ thirdparty: true, analytics: true }); };
    bNone.onclick = function () { save({ thirdparty: false, analytics: false }); };
    act.appendChild(bSave); act.appendChild(bAll); act.appendChild(bNone); m.appendChild(act);
    m.querySelector('.ebc-close').onclick = function () { if (read()) closeModal(); else { closeModal(); } };
    ov.appendChild(m); document.body.appendChild(ov);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov && read()) closeModal(); });
    document.addEventListener('keydown', onKey);
    bSave.focus();
  }

  function showBanner() {
    if (document.getElementById('ebc-banner')) return;
    var b = el('div', { id: 'ebc-banner', class: 'ebc-banner', role: 'region', 'aria-label': 'Aviso de cookies' });
    b.innerHTML = '<h2>Tu privacidad importa</h2><p>Usamos cookies necesarias para que el sitio funcione y, solo con tu permiso, contenido de terceros como el video de nuestro podcast. Consulta la <a href="/cookies.html">Política de Cookies</a> y la <a href="/privacidad.html">Política de Privacidad</a>.</p>';
    var a = el('div', { class: 'ebc-actions' });
    var acc = el('button', { class: 'ebc-btn ebc-btn-primary', type: 'button' }, 'Aceptar todas');
    var rej = el('button', { class: 'ebc-btn ebc-btn-ghost', type: 'button' }, 'Rechazar opcionales');
    var cfg = el('button', { class: 'ebc-link', type: 'button' }, 'Configurar preferencias');
    acc.onclick = function () { save({ thirdparty: true, analytics: true }); };
    rej.onclick = function () { save({ thirdparty: false, analytics: false }); };
    cfg.onclick = openModal;
    a.appendChild(acc); a.appendChild(rej); b.appendChild(a); b.appendChild(cfg);
    document.body.appendChild(b);
  }

  /* Load third-party embeds (YouTube) only with consent */
  function applyEmbeds() {
    var c = read();
    document.querySelectorAll('[data-yt-embed]').forEach(function (box) {
      var ph = box.querySelector('.yt-consent'), loaded = box.querySelector('iframe');
      if (c && c.thirdparty && !loaded) {
        var f = el('iframe', {
          src: box.getAttribute('data-yt-embed'), title: box.getAttribute('data-title') || 'Video de YouTube',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          referrerpolicy: 'strict-origin-when-cross-origin', allowfullscreen: ''
        });
        box.appendChild(f); if (ph) ph.style.display = 'none';
      } else if ((!c || !c.thirdparty) && loaded) { loaded.remove(); if (ph) ph.style.display = ''; }
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-cookie-settings],[data-yt-accept]') : null;
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-yt-accept')) { var c = read() || { analytics: false }; c.thirdparty = true; save(c); }
    else openModal();
  });

  window.ebCookies = { open: openModal, get: read, allowed: function (cat) { var c = read(); return !!(c && c[cat]); } };
  function init() { applyEmbeds(); if (!read()) showBanner(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
