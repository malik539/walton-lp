# Walton Orthodontics — $1,000 Off Clear Aligners (Invisalign®) PPC Landing Page

Static, dependency-free Google Ads landing page for Walton Orthodontics (Suwanee, GA).
Works from any static web server. No build step, no npm.

```
index.html
assets/css/styles.css
assets/js/main.js
assets/images/   (optimized WebP/AVIF assets, logo, favicons)
```

## Before go-live (developer checklist)

1. **Lead form endpoint** — `assets/js/main.js`, set `LEAD_FORM_ENDPOINT` to the practice's real
   CRM / form-provider URL. The form POSTs `application/x-www-form-urlencoded` with:
   `first_name, last_name, phone, email, message, consent, utm_source, utm_medium, utm_campaign,
   utm_term, utm_content, gclid, gbraid, wbraid, landing_page, offer`.
   Until an endpoint is set the page never fakes a success; it asks the visitor to call.
2. **Tracking** — paste the GTM head/body snippets (or gtag.js) into the marked comments in
   `index.html`. `main.js` pushes to `window.dataLayer`:
   - `lead_form_submit` — only after a 2xx response from the endpoint (true lead conversion)
   - `phone_click` — any click-to-call tap
   - `cta_click` — any schedule / claim-offer button click
   Every CTA has a unique `id` plus `data-conversion-type` and `data-offer` attributes.
3. **Canonical / OG URL** — update `<link rel="canonical">` and `og:url` to the final published URL.
4. **Map** — the Google Maps iframe is the exact supplied embed, wrapped responsively.

## Content sources

All offer wording, phone number, doctor bio, reviews, FAQ answers, and hours come from the
approved campaign Markdown. Address and map embed were supplied directly. No facts were added.
