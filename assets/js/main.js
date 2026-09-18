/* =====================================================================
   Walton Orthodontics — $1,000 Off Clear Aligners (Invisalign®) PPC LP
   Minimal vanilla JS: attribution capture, lead form, FAQ accordion,
   reveal-on-scroll, CTA event tracking hooks.
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     CONNECT EXISTING WALTON ORTHODONTICS LEAD FORM ENDPOINT HERE
     Set this to the practice's real lead endpoint (CRM webhook / form
     provider URL). The page POSTs the form fields (including UTM/gclid
     hidden fields) as application/x-www-form-urlencoded and treats any
     2xx response as success. Leave empty and the page will NOT fake a
     successful submission; it will ask the visitor to call instead.
     ------------------------------------------------------------------ */
  var LEAD_FORM_ENDPOINT = '';

  var PHONE_DISPLAY = '470-665-3141';
  var PHONE_HREF = 'tel:+14706653141';

  document.documentElement.classList.add('js');

  window.dataLayer = window.dataLayer || [];
  function track(event, data) {
    var payload = { event: event };
    if (data) { for (var k in data) { if (Object.prototype.hasOwnProperty.call(data, k)) payload[k] = data[k]; } }
    window.dataLayer.push(payload);
  }

  /* ---------- Google Ads attribution → hidden fields ---------- */
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'];
  function captureAttribution() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem('wo_attr') || '{}'); } catch (e) { stored = {}; }
    ATTR_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) { stored[key] = value; }
      var field = document.getElementById(key);
      if (field && stored[key]) { field.value = stored[key]; }
    });
    try { sessionStorage.setItem('wo_attr', JSON.stringify(stored)); } catch (e) { /* storage unavailable */ }
    var lp = document.getElementById('landing_page');
    if (lp) { lp.value = 'clear-aligner-650-off'; }
  }
  captureAttribution();

  /* ---------- CTA tracking hooks (phone + schedule) ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-conversion-type]');
    if (!el) return;
    var type = el.getAttribute('data-conversion-type');
    var payload = { cta_id: el.id || '', offer: el.getAttribute('data-offer') || '' };
    if (type === 'phone') {
      track('phone_click', payload);
    } else if (type === 'lead' && el.tagName === 'A') {
      track('cta_click', payload);
    }
  });

  /* ---------- Smooth-scroll CTAs to the form and focus first field ---------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href="#lead-form"]');
    if (!link) return;
    var section = document.getElementById('lead-form');
    if (!section) return;
    e.preventDefault();
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    var first = document.getElementById('first_name');
    if (first && !first.disabled) {
      window.setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 450);
    }
    if (history.replaceState) { history.replaceState(null, '', '#lead-form'); }
  });

  /* ---------- Lead form ---------- */
  var form = document.getElementById('lead-capture-form');
  if (form) {
    var submitBtn = document.getElementById('form-submit');
    var status = document.getElementById('form-status');
    var success = document.getElementById('form-success');

    var validators = {
      first_name: function (v) { return v.trim().length >= 1 ? '' : 'Please enter your first name.'; },
      last_name: function (v) { return v.trim().length >= 1 ? '' : 'Please enter your last name.'; },
      phone: function (v) { return v.replace(/\D/g, '').length >= 10 ? '' : 'Please enter a valid 10-digit phone number.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'; },
      consent: function (v, field) { return field.checked ? '' : 'Please agree to the terms to continue.'; }
    };

    function setError(field, message) {
      var errorEl = document.getElementById(field.id + '-error');
      if (errorEl) errorEl.textContent = message;
      if (message) { field.setAttribute('aria-invalid', 'true'); } else { field.removeAttribute('aria-invalid'); }
    }

    function validateField(field) {
      var fn = validators[field.name];
      if (!fn) return true;
      var message = fn(field.value, field);
      setError(field, message);
      return !message;
    }

    Object.keys(validators).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () { if (field.getAttribute('aria-invalid')) validateField(field); });
      field.addEventListener('change', function () { if (field.getAttribute('aria-invalid')) validateField(field); });
    });

    function showStatus(message, isInfo) {
      status.textContent = '';
      status.classList.toggle('is-info', !!isInfo);
      if (typeof message === 'string') { status.textContent = message; return; }
      message.forEach(function (node) { status.appendChild(node); });
    }

    function callFallbackNodes(prefix) {
      var a = document.createElement('a');
      a.href = PHONE_HREF; a.textContent = PHONE_DISPLAY;
      a.setAttribute('data-conversion-type', 'phone'); a.setAttribute('data-offer', 'clear-aligner-650');
      return [document.createTextNode(prefix + ' '), a, document.createTextNode('.')];
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showStatus('');

      // Honeypot: silently ignore bots.
      if (form.elements.company && form.elements.company.value) { return; }

      var firstInvalid = null;
      Object.keys(validators).forEach(function (name) {
        var field = form.elements[name];
        if (field && !validateField(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      if (!LEAD_FORM_ENDPOINT) {
        // No endpoint configured: never fake a success.
        showStatus(callFallbackNodes('Online requests are not available right now. Please call us to book your free consultation:'), true);
        return;
      }

      submitBtn.setAttribute('aria-busy', 'true');
      var body = new URLSearchParams(new FormData(form)).toString();

      fetch(LEAD_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json, text/plain, */*' },
        body: body
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        // Verified successful submission → fire lead conversion.
        // Map dataLayer event "lead_form_submit" to the Google Ads conversion action in GTM.
        track('lead_form_submit', { offer: 'clear-aligner-650', landing_page: 'clear-aligner-650-off', form_id: 'lead-capture-form' });
        form.hidden = true;
        success.hidden = false;
        success.focus();
      }).catch(function () {
        showStatus(callFallbackNodes('Sorry, something went wrong sending your request. Please try again or call'), false);
      }).finally(function () {
        submitBtn.removeAttribute('aria-busy');
      });
    });
  }

  /* ---------- FAQ accordion (accessible, keyboard-friendly) ---------- */
  var accordion = document.getElementById('faq-accordion');
  if (accordion) {
    var triggers = Array.prototype.slice.call(accordion.querySelectorAll('.acc-trigger'));
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function setOpen(trigger, open) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        panel.hidden = false;
      } else if (reduceMotion.matches) {
        panel.hidden = true;
      } else {
        // Animate closed via grid-template-rows, then hide for assistive tech.
        panel.style.gridTemplateRows = '0fr';
        panel.querySelector('.acc-content').style.paddingBottom = '0';
        var done = function () {
          panel.hidden = true;
          panel.style.gridTemplateRows = '';
          panel.querySelector('.acc-content').style.paddingBottom = '';
          panel.removeEventListener('transitionend', done);
        };
        panel.addEventListener('transitionend', done);
        window.setTimeout(done, 350);
      }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';
        setOpen(trigger, !isOpen);
      });
      trigger.addEventListener('keydown', function (e) {
        var i = triggers.indexOf(trigger);
        var next = null;
        if (e.key === 'ArrowDown') next = triggers[(i + 1) % triggers.length];
        else if (e.key === 'ArrowUp') next = triggers[(i - 1 + triggers.length) % triggers.length];
        else if (e.key === 'Home') next = triggers[0];
        else if (e.key === 'End') next = triggers[triggers.length - 1];
        if (next) { e.preventDefault(); next.focus(); }
      });
    });
  }

  /* ---------- Gentle reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }
})();
