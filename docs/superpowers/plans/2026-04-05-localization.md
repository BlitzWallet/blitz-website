# Localization (i18next) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add i18next-based localization to the Blitz Wallet marketing website, supporting English (default), Spanish, Portuguese, French, and German via URL prefix routing (`/es/`, `/pt/`, `/fr/`, `/de/`).

**Architecture:** i18next loads locale JSON files from `/src/i18n/{lang}.json` on demand. A custom language detector reads the first URL path segment. A language switcher dropdown is injected into every navbar by `i18n.js`. Netlify rewrites route `/es/*`, `/pt/*`, `/fr/*`, `/de/*` to the same underlying HTML files; Netlify functions receive `?lang=XX` for localized dynamic pages.

**Tech Stack:** i18next 23.x (CDN), i18next-http-backend 2.x (CDN), Vanilla JS, Netlify rewrites

---

## Chunk 1: i18n Infrastructure

### Task 1: Create locale JSON files

**Files:**
- Create: `src/i18n/en.json`
- Create: `src/i18n/es.json`
- Create: `src/i18n/pt.json`
- Create: `src/i18n/fr.json`
- Create: `src/i18n/de.json`

- [ ] **Step 1: Create en.json — the English master**

Create `src/i18n/en.json` with this exact content:

```json
{
  "nav": {
    "products": "Products",
    "features": "Features",
    "about": "About",
    "contact": "Contact",
    "download": "Download"
  },
  "footer": {
    "tagline": "Your Global Payments App",
    "products": {
      "heading": "Products",
      "mobileApp": "Mobile App",
      "webWallet": "Web Wallet",
      "pos": "Point of Sale",
      "recovery": "Recovery Platform"
    },
    "company": {
      "heading": "Company",
      "about": "About",
      "contact": "Contact",
      "brand": "Brand",
      "blog": "Blog"
    },
    "legal": {
      "heading": "Legal",
      "privacy": "Privacy Policy",
      "terms": "Terms of Use",
      "license": "License"
    },
    "copyright": "© 2026 Blitz Wallet LLC. All rights reserved."
  },
  "modal": {
    "title": "Download Blitz Wallet",
    "subtitle": "Choose your platform to get started",
    "scanInstructions": "Scan with your mobile device"
  },
  "home": {
    "hero": {
      "title": "Bitcoin Payments Made Simple",
      "description": "Send money to anyone in the world — instantly, for free. Contacts-based payments, payment pools, stablecoin support, and more.",
      "downloadBtn": "Download Now →",
      "exploreBtn": "Explore Products"
    },
    "products": {
      "label": "Our Products",
      "heading": "A Complete Global Payments Suite",
      "subheading": "Four powerful products designed to cover every payments need",
      "mobileApp": {
        "title": "Mobile App",
        "desc": "Our flagship self-custodial payments app for iOS and Android. Pay contacts for free, gift Bitcoin or stablecoins, pool payments with groups, and manage your money with complete control.",
        "feature1": "Zero-fee contact payments",
        "feature2": "Bitcoin & stablecoin support",
        "feature3": "Blitz Gifts & Payment Pools",
        "feature4": "Self-custodial security",
        "link": "Download App →"
      },
      "webWallet": {
        "title": "Web Wallet",
        "desc": "Access your funds from any browser — no app required. The same powerful global payments experience, everywhere you are. Still in development.",
        "feature1": "No installation needed",
        "feature2": "Cross-platform access",
        "feature3": "Instant account creation",
        "feature4": "Same self-custodial security",
        "link": "Try Web Wallet →"
      },
      "pos": {
        "title": "Point of Sale",
        "desc": "Accept Bitcoin and stablecoin payments at any business. Generate payment requests, track tips, and settle instantly — no bank account required.",
        "feature1": "Easy merchant onboarding",
        "feature2": "External website",
        "feature3": "Real-time confirmations",
        "feature4": "Tips for employees",
        "link": "Get Started →"
      },
      "recovery": {
        "title": "Recovery Platform",
        "desc": "Your access to your money should never depend on us. Our open-source recovery platform ensures you can always restore your wallet — independently.",
        "feature1": "Open-source",
        "feature2": "Self-hosted",
        "feature3": "Non-Blitz dependent",
        "feature4": "Simple so anyone can use it",
        "link": "Learn More →"
      }
    },
    "features": {
      "label": "Features",
      "heading": "Everything You Need to Pay Anyone, Anywhere",
      "subheading": "Built on Bitcoin's open rails to make global payments simple, cheap, and fast",
      "contactPayments": {
        "title": "Zero-Fee Contact Payments",
        "desc": "Pay anyone in your contacts by name — no invoices, no QR codes, no fees. Sending money to a Blitz contact is as easy as a text message."
      },
      "gifts": {
        "title": "Blitz Gifts",
        "desc": "Send Bitcoin or stablecoin gifts to anyone via a shareable link — even if they don't have Blitz yet. The simplest way to onboard friends and family to global payments."
      },
      "pools": {
        "title": "Payment Pools",
        "desc": "Coordinate group payments and collections with ease. Split costs, collect contributions, and settle instantly — powered by Bitcoin."
      },
      "usdb": {
        "title": "USDB Stablecoin Savings",
        "desc": "Hold your balance in USDB, a USD-pegged stablecoin, to protect against volatility. Set savings goals, earn rewards, and stay on Bitcoin's rails — all under your control."
      },
      "stablecoin": {
        "title": "Stablecoin Integration",
        "desc": "Seamlessly swap between Bitcoin and stablecoins. Transact in the currency that works for you — without ever leaving the app or trusting a custodian."
      },
      "settlement": {
        "title": "Instant Global Settlement",
        "desc": "Payments settle in seconds, not days. Whether you're paying across the street or across the world, Bitcoin's open rails deliver your money instantly."
      },
      "selfCustodial": {
        "title": "Fully Self-Custodial",
        "desc": "Your keys, your money. No middlemen, no freeze risk, no permission required. You own your funds completely — always."
      },
      "offline": {
        "title": "Receive Anytime, Offline",
        "desc": "Receive payments even when your phone is off. No channels to manage, no node to run. Money arrives when it's sent — on your schedule."
      }
    },
    "howItWorks": {
      "label": "How It Works",
      "heading": "Start Sending Money Globally in 3 Steps",
      "subheading": "No bank account needed. No fees. No borders.",
      "step1": {
        "title": "Download & Create",
        "desc": "Download Blitz Wallet and set up your self-custodial account in under a minute. No ID required, no waiting period."
      },
      "step2": {
        "title": "Add Funds",
        "desc": "Deposit Bitcoin or swap into USDB stablecoins. Transfer from an exchange or receive directly from anyone, anywhere."
      },
      "step3": {
        "title": "Pay Anyone, Anywhere",
        "desc": "Send to contacts for free, gift money to friends, pool payments with groups, or pay merchants globally — all from one app."
      }
    },
    "cta": {
      "heading": "Ready to Send Money Without Borders?",
      "subheading": "Join thousands using Bitcoin's open rails to pay anyone, anywhere — instantly and for free",
      "btn": "Download Blitz Wallet →"
    }
  },
  "about": {
    "hero": {
      "badge": "Our Mission",
      "title": "Global Payments, Powered by Bitcoin",
      "desc": "We're building the world's most accessible payments app — using Bitcoin's open rails to make sending money anywhere as simple, fast, and cheap as it should be.",
      "stat1Value": "Zero Fees",
      "stat1Label": "Contact Payments",
      "stat2Value": "Instant",
      "stat2Label": "Anywhere in the World",
      "stat3Value": "100%",
      "stat3Label": "Self-Custodial"
    },
    "mission": {
      "label": "Why We Exist",
      "heading": "Our Mission & Vision",
      "missionCard": {
        "title": "Our Mission",
        "desc": "To build a global payments app on Bitcoin's open rails that gives everyone — regardless of where they live or who they bank with — access to instant, cheap, and self-custodial money movement."
      },
      "visionCard": {
        "title": "Our Vision",
        "desc": "A world where sending money across the street or across the globe costs nothing, takes seconds, and requires no middlemen — as familiar as Venmo, but open to everyone."
      },
      "serveCard": {
        "title": "Who We Serve",
        "desc": "Anyone who moves money — from splitting dinner with friends to paying remote contractors internationally — and wants a faster, cheaper, and more sovereign alternative to traditional finance."
      },
      "approachCard": {
        "title": "Our Approach",
        "desc": "We build on Bitcoin's open, permissionless rails and layer familiar payments UX on top — contacts, gifts, pools, stablecoins — so the power of Bitcoin is accessible without the learning curve."
      }
    },
    "challenge": {
      "label": "The Challenge",
      "heading": "Why Global Payments Are Broken"
    },
    "story": {
      "heading": "A Real-World Example"
    },
    "values": {
      "label": "Our Values",
      "heading": "What We Stand For",
      "openRails": {
        "title": "Open Rails for Everyone",
        "desc": "Bitcoin is a global, permissionless network. We believe everyone deserves access to it — regardless of where they live or who they bank with."
      },
      "simplicity": {
        "title": "Simplicity Wins",
        "desc": "The best payment experience is one you don't have to think about. We obsess over removing every unnecessary step between you and your money."
      },
      "custody": {
        "title": "Your Keys, Your Money",
        "desc": "We never hold your funds. Self-custody isn't a feature — it's the foundation. Your money is yours, full stop."
      }
    },
    "cta": {
      "heading": "Ready to Send Money Without Borders?",
      "subheading": "Join thousands using Bitcoin's open rails to pay anyone, anywhere",
      "btn": "Download Blitz Wallet →"
    }
  },
  "contact": {
    "pageTitle": "Contact Us",
    "greeting1": "Hi,",
    "greeting2": "Have a question in mind?",
    "nameLabelOptional": "Name (optional)",
    "namePlaceholder": "Enter name here",
    "emailLabelRequired": "Email (required)",
    "emailPlaceholder": "Enter email here",
    "messageLabelRequired": "Message (required)",
    "messagePlaceholder": "Add message here",
    "submitBtn": "Submit"
  },
  "blog": {
    "pageTitle": "The latest from Blitz Wallet",
    "pageSubTitle": "Making bitcoin payments simple"
  },
  "gift": {
    "loading": "Loading your gift...",
    "errorTitle": "Error Loading Gift",
    "notFoundTitle": "Gift Not Found",
    "notFoundDesc": "This gift doesn't exist or has already been claimed.",
    "receivedTitle": "You've Received a Gift!",
    "step1Title": "Download Blitz Wallet",
    "step1Desc": "Get the free app from the App Store or Google Play.",
    "step1Btn": "Download Blitz Wallet",
    "step2Title": "Claim Your Gift",
    "step2Desc": "Already installed? Tap below to open your gift in Blitz.",
    "openInAppBtn": "Open in Blitz Wallet",
    "copyLinkBtn": "Copy Gift Link",
    "copiedBtn": "Link Copied!",
    "alreadyClaimed": "Already Claimed",
    "expired": "Expired",
    "alreadyClaimedDesc": "This {{giftType}} gift has already been claimed.",
    "expiredDesc": "This {{giftType}} gift has expired.",
    "navDownload": "Download"
  },
  "pool": {
    "loading": "Loading pool...",
    "navDownload": "Download",
    "contributeBtn": "Contribute to Pool",
    "errorTitle": "Pool Not Found",
    "errorDesc": "This pool doesn't exist or is no longer active."
  },
  "paylink": {
    "loading": "Loading...",
    "navDownload": "Download",
    "payBtn": "Pay Now",
    "errorTitle": "Payment Link Not Found",
    "errorDesc": "This payment link doesn't exist or has expired."
  },
  "profile": {
    "loading": "Loading...",
    "navDownload": "Download"
  }
}
```

- [ ] **Step 2: Create placeholder locale files (copy of en.json)**

Create `src/i18n/es.json`, `src/i18n/pt.json`, `src/i18n/fr.json`, `src/i18n/de.json` — each as an exact copy of `en.json`. These are placeholders for the team to fill in real translations later.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/
git commit -m "feat(i18n): add locale JSON files with English placeholder content"
```

---

### Task 2: Create i18n.js

**Files:**
- Create: `src/js/i18n.js`

- [ ] **Step 1: Create src/js/i18n.js**

```javascript
// src/js/i18n.js
// Initializes i18next, applies DOM translations, injects language switcher.

const VALID_LANGS = ['en', 'es', 'pt', 'fr', 'de'];
const LANG_NAMES = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
};

function detectLanguage() {
  const firstSegment = window.location.pathname.split('/')[1];
  return VALID_LANGS.includes(firstSegment) ? firstSegment : 'en';
}

function switchLanguage(newLang) {
  const path = window.location.pathname;
  const firstSegment = path.split('/')[1];
  const currentLang = VALID_LANGS.includes(firstSegment) ? firstSegment : 'en';

  let newPath;
  if (newLang === 'en') {
    newPath = currentLang !== 'en' ? path.replace('/' + currentLang, '') || '/' : path;
  } else if (currentLang !== 'en') {
    newPath = path.replace('/' + currentLang, '/' + newLang);
  } else {
    newPath = '/' + newLang + path;
  }

  window.location.href = newPath + window.location.search + window.location.hash;
}

// Expose for inline onclick handlers
window.__blitzSwitchLang = switchLanguage;

function applyTranslations() {
  // Text content: <h1 data-i18n="home.hero.title">fallback</h1>
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.dataset.i18n;
    var translation = i18next.t(key);
    if (translation && translation !== key) {
      el.textContent = translation;
    }
  });

  // Placeholder attributes: <input data-i18n-placeholder="contact.namePlaceholder">
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    var key = el.dataset.i18nPlaceholder;
    var translation = i18next.t(key);
    if (translation && translation !== key) {
      el.placeholder = translation;
    }
  });

  document.documentElement.lang = i18next.language;
}

function injectLanguageSwitcher() {
  var navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  var currentLang = detectLanguage();

  var li = document.createElement('li');
  li.className = 'lang-switcher';
  li.setAttribute('role', 'none');

  var optionsHTML = VALID_LANGS.map(function (lang) {
    var selected = lang === currentLang ? ' class="lang-option-active"' : '';
    return (
      '<li role="none">' +
      '<button role="option"' + selected + ' onclick="window.__blitzSwitchLang(\'' + lang + '\')">' +
      LANG_NAMES[lang] +
      '</button></li>'
    );
  }).join('');

  li.innerHTML =
    '<button class="lang-trigger" aria-haspopup="listbox" aria-expanded="false">' +
    '&#127760; ' + currentLang.toUpperCase() + ' <span aria-hidden="true">&#9660;</span>' +
    '</button>' +
    '<ul class="lang-dropdown" role="listbox" aria-label="Select language">' +
    optionsHTML +
    '</ul>';

  navLinks.appendChild(li);

  var trigger = li.querySelector('.lang-trigger');
  var dropdown = li.querySelector('.lang-dropdown');

  trigger.addEventListener('click', function () {
    var expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!expanded));
    dropdown.classList.toggle('open', !expanded);
  });

  document.addEventListener('click', function (e) {
    if (!li.contains(e.target)) {
      trigger.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('open');
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var lang = detectLanguage();

  i18next
    .use(i18nextHttpBackend)
    .init({
      lng: lang,
      fallbackLng: 'en',
      backend: {
        loadPath: '/src/i18n/{{lng}}.json',
      },
    }, function (err) {
      if (err) console.warn('[i18n] init error:', err);
      applyTranslations();
      injectLanguageSwitcher();
    });
});
```

- [ ] **Step 2: Commit**

```bash
git add src/js/i18n.js
git commit -m "feat(i18n): add i18n.js with language detection, DOM translation, and language switcher"
```

---

### Task 3: Create language switcher CSS

**Files:**
- Create: `src/assets/styles/lang-switcher.css`

- [ ] **Step 1: Create lang-switcher.css**

```css
/* src/assets/styles/lang-switcher.css */
.lang-switcher {
  position: relative;
  list-style: none;
}

.lang-trigger {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.4rem 0.9rem;
  white-space: nowrap;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.lang-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.6);
}

nav.scrolled .lang-trigger {
  border-color: rgba(0, 0, 0, 0.2);
  color: #333;
}

nav.scrolled .lang-trigger:hover {
  background: rgba(0, 0, 0, 0.05);
}

.lang-dropdown {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: none;
  list-style: none;
  margin: 0;
  min-width: 130px;
  padding: 0.4rem 0;
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  z-index: 2000;
}

.lang-dropdown.open {
  display: block;
}

.lang-dropdown li button {
  background: transparent;
  border: none;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  padding: 0.55rem 1rem;
  text-align: left;
  transition: background 0.15s ease;
  width: 100%;
}

.lang-dropdown li button:hover {
  background: #f3f4f6;
}

.lang-dropdown li button.lang-option-active {
  color: #0375f6;
  font-weight: 600;
}

/* Mobile: show switcher inline in menu */
@media (max-width: 768px) {
  .lang-dropdown {
    position: static;
    border: none;
    box-shadow: none;
    padding: 0;
  }

  .lang-trigger {
    width: 100%;
    text-align: left;
    border-radius: 0;
    border: none;
    padding: 0.75rem 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/assets/styles/lang-switcher.css
git commit -m "feat(i18n): add language switcher CSS"
```

---

### Task 4: Update netlify.toml with language prefix routes

**Files:**
- Modify: `netlify.toml`

Rules must be inserted **before** the existing `/:username` catch-all at line 231. Place the block immediately before that rule.

- [ ] **Step 1: Insert language-prefixed function routes and generic page rewrites**

Insert the following block in `netlify.toml` immediately before the `[[redirects]]` block whose `from` is `"/:username"`:

```toml
# ── i18n: language-prefixed function routes ─────────────────────────────────
# These must precede the generic language rewrites and the /:username catch-all.

# Spanish
[[redirects]]
  from = "/es/u/:username/"
  to = "/.netlify/functions/dynamic-profile?lang=es"
  status = 200

[[redirects]]
  from = "/es/u/:username"
  to = "/.netlify/functions/dynamic-profile?lang=es"
  status = 200

[[redirects]]
  from = "/es/gift/:giftInfo/"
  to = "/.netlify/functions/handle-gift?lang=es"
  status = 200

[[redirects]]
  from = "/es/gift/:giftInfo"
  to = "/.netlify/functions/handle-gift?lang=es"
  status = 200

[[redirects]]
  from = "/es/pools/:poolId/"
  to = "/.netlify/functions/handle-pool?lang=es"
  status = 200

[[redirects]]
  from = "/es/pools/:poolId"
  to = "/.netlify/functions/handle-pool?lang=es"
  status = 200

[[redirects]]
  from = "/es/paylink/:paylinkId/"
  to = "/.netlify/functions/handle-paylink?lang=es"
  status = 200

[[redirects]]
  from = "/es/paylink/:paylinkId"
  to = "/.netlify/functions/handle-paylink?lang=es"
  status = 200

# Portuguese
[[redirects]]
  from = "/pt/u/:username/"
  to = "/.netlify/functions/dynamic-profile?lang=pt"
  status = 200

[[redirects]]
  from = "/pt/u/:username"
  to = "/.netlify/functions/dynamic-profile?lang=pt"
  status = 200

[[redirects]]
  from = "/pt/gift/:giftInfo/"
  to = "/.netlify/functions/handle-gift?lang=pt"
  status = 200

[[redirects]]
  from = "/pt/gift/:giftInfo"
  to = "/.netlify/functions/handle-gift?lang=pt"
  status = 200

[[redirects]]
  from = "/pt/pools/:poolId/"
  to = "/.netlify/functions/handle-pool?lang=pt"
  status = 200

[[redirects]]
  from = "/pt/pools/:poolId"
  to = "/.netlify/functions/handle-pool?lang=pt"
  status = 200

[[redirects]]
  from = "/pt/paylink/:paylinkId/"
  to = "/.netlify/functions/handle-paylink?lang=pt"
  status = 200

[[redirects]]
  from = "/pt/paylink/:paylinkId"
  to = "/.netlify/functions/handle-paylink?lang=pt"
  status = 200

# French
[[redirects]]
  from = "/fr/u/:username/"
  to = "/.netlify/functions/dynamic-profile?lang=fr"
  status = 200

[[redirects]]
  from = "/fr/u/:username"
  to = "/.netlify/functions/dynamic-profile?lang=fr"
  status = 200

[[redirects]]
  from = "/fr/gift/:giftInfo/"
  to = "/.netlify/functions/handle-gift?lang=fr"
  status = 200

[[redirects]]
  from = "/fr/gift/:giftInfo"
  to = "/.netlify/functions/handle-gift?lang=fr"
  status = 200

[[redirects]]
  from = "/fr/pools/:poolId/"
  to = "/.netlify/functions/handle-pool?lang=fr"
  status = 200

[[redirects]]
  from = "/fr/pools/:poolId"
  to = "/.netlify/functions/handle-pool?lang=fr"
  status = 200

[[redirects]]
  from = "/fr/paylink/:paylinkId/"
  to = "/.netlify/functions/handle-paylink?lang=fr"
  status = 200

[[redirects]]
  from = "/fr/paylink/:paylinkId"
  to = "/.netlify/functions/handle-paylink?lang=fr"
  status = 200

# German
[[redirects]]
  from = "/de/u/:username/"
  to = "/.netlify/functions/dynamic-profile?lang=de"
  status = 200

[[redirects]]
  from = "/de/u/:username"
  to = "/.netlify/functions/dynamic-profile?lang=de"
  status = 200

[[redirects]]
  from = "/de/gift/:giftInfo/"
  to = "/.netlify/functions/handle-gift?lang=de"
  status = 200

[[redirects]]
  from = "/de/gift/:giftInfo"
  to = "/.netlify/functions/handle-gift?lang=de"
  status = 200

[[redirects]]
  from = "/de/pools/:poolId/"
  to = "/.netlify/functions/handle-pool?lang=de"
  status = 200

[[redirects]]
  from = "/de/pools/:poolId"
  to = "/.netlify/functions/handle-pool?lang=de"
  status = 200

[[redirects]]
  from = "/de/paylink/:paylinkId/"
  to = "/.netlify/functions/handle-paylink?lang=de"
  status = 200

[[redirects]]
  from = "/de/paylink/:paylinkId"
  to = "/.netlify/functions/handle-paylink?lang=de"
  status = 200

# ── i18n: generic static-page rewrites ──────────────────────────────────────
# Serve the same HTML files for language-prefixed URLs.
[[redirects]]
  from = "/es/*"
  to = "/:splat"
  status = 200

[[redirects]]
  from = "/pt/*"
  to = "/:splat"
  status = 200

[[redirects]]
  from = "/fr/*"
  to = "/:splat"
  status = 200

[[redirects]]
  from = "/de/*"
  to = "/:splat"
  status = 200
```

- [ ] **Step 2: Verify the catch-all `/:username` rule remains AFTER these new rules**

Check that `from = "/:username"` still appears after the inserted block. The ordering must be:
1. Specific function routes (e.g. `/es/u/:username`)
2. Generic language rewrites (`/es/*`)
3. Catch-all `/:username`

- [ ] **Step 3: Commit**

```bash
git add netlify.toml
git commit -m "feat(i18n): add language prefix routes to netlify.toml"
```

---

## Chunk 2: Static Pages — data-i18n Attributes + Script Tags

### Task 5: Update index.html (homepage)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add i18next CDN scripts and i18n.js to `<head>`**

Add the following three `<script>` tags and the lang-switcher CSS link immediately before the closing `</head>` tag in `index.html`:

```html
<link rel="stylesheet" href="/src/assets/styles/lang-switcher.css" />
<script src="https://unpkg.com/i18next@23.7.6/i18next.min.js"></script>
<script src="https://unpkg.com/i18next-http-backend@2.4.2/i18nextHttpBackend.min.js"></script>
<script src="/src/js/i18n.js" defer></script>
```

- [ ] **Step 2: Add data-i18n to nav links**

In the `<nav>` section, add `data-i18n` attributes to each link text. Keep the English text as fallback content:

```html
<ul class="nav-links">
  <li><a href="#products" data-i18n="nav.products">Products</a></li>
  <li><a href="#features" data-i18n="nav.features">Features</a></li>
  <li><a href="/pages/about" data-i18n="nav.about">About</a></li>
  <li><a href="/pages/contact/" data-i18n="nav.contact">Contact</a></li>
  <li>
    <a href="#" class="nav-download-btn download-btn" data-i18n="nav.download">Download</a>
  </li>
</ul>
```

- [ ] **Step 3: Add data-i18n to hero section**

```html
<h1 data-i18n="home.hero.title">Bitcoin Payments Made Simple</h1>
<p data-i18n="home.hero.description">Send money to anyone in the world — instantly, for free. ...</p>
<a href="#" class="btn-primary download-btn" data-i18n="home.hero.downloadBtn">Download Now →</a>
<a href="#products" class="btn-secondary" data-i18n="home.hero.exploreBtn">Explore Products</a>
```

- [ ] **Step 4: Add data-i18n to products section**

Tag the section label, heading, subheading, and all four product cards (titles, descriptions, feature list items, and links) with their corresponding `data-i18n` keys from `en.json` under `home.products.*`.

Product card structure example (Mobile App):
```html
<span class="section-label" data-i18n="home.products.label">Our Products</span>
<h2 data-i18n="home.products.heading">A Complete Global Payments Suite</h2>
<p data-i18n="home.products.subheading">Four powerful products...</p>

<h3 data-i18n="home.products.mobileApp.title">Mobile App</h3>
<p data-i18n="home.products.mobileApp.desc">Our flagship...</p>
<li data-i18n="home.products.mobileApp.feature1">Zero-fee contact payments</li>
<li data-i18n="home.products.mobileApp.feature2">Bitcoin &amp; stablecoin support</li>
<li data-i18n="home.products.mobileApp.feature3">Blitz Gifts &amp; Payment Pools</li>
<li data-i18n="home.products.mobileApp.feature4">Self-custodial security</li>
<a ... data-i18n="home.products.mobileApp.link">Download App →</a>
```

Repeat for webWallet, pos, and recovery cards.

- [ ] **Step 5: Add data-i18n to features section**

Tag section label, heading, subheading, and all 8 feature cards (title + desc) with keys from `home.features.*`.

- [ ] **Step 6: Add data-i18n to "How It Works" section**

```html
<span class="section-label" data-i18n="home.howItWorks.label">How It Works</span>
<h2 data-i18n="home.howItWorks.heading">Start Sending Money Globally in 3 Steps</h2>
<p data-i18n="home.howItWorks.subheading">No bank account needed. No fees. No borders.</p>
```

Tag each step's `<h3>` and `<p>` with `home.howItWorks.step1.*`, `step2.*`, `step3.*`.

- [ ] **Step 7: Add data-i18n to CTA section**

```html
<h2 data-i18n="home.cta.heading">Ready to Send Money Without Borders?</h2>
<p data-i18n="home.cta.subheading">Join thousands using...</p>
<a ... data-i18n="home.cta.btn">Download Blitz Wallet →</a>
```

- [ ] **Step 8: Add data-i18n to footer**

```html
<p data-i18n="footer.tagline">Your Global Payments App</p>
<h4 data-i18n="footer.products.heading">Products</h4>
<li><a href="#products" data-i18n="footer.products.mobileApp">Mobile App</a></li>
<li><a ... data-i18n="footer.products.webWallet">Web Wallet</a></li>
<li><a ... data-i18n="footer.products.pos">Point of Sale</a></li>
<li><a ... data-i18n="footer.products.recovery">Recovery Platform</a></li>
<h4 data-i18n="footer.company.heading">Company</h4>
<li><a ... data-i18n="footer.company.about">About</a></li>
<li><a ... data-i18n="footer.company.contact">Contact</a></li>
<li><a ... data-i18n="footer.company.brand">Brand</a></li>
<li><a ... data-i18n="footer.company.blog">Blog</a></li>
<h4 data-i18n="footer.legal.heading">Legal</h4>
<li><a ... data-i18n="footer.legal.privacy">Privacy Policy</a></li>
<li><a ... data-i18n="footer.legal.terms">Terms of Use</a></li>
<li><a ... data-i18n="footer.legal.license">License</a></li>
<p data-i18n="footer.copyright">© 2026 Blitz Wallet LLC. All rights reserved.</p>
```

- [ ] **Step 9: Add data-i18n to download modal**

```html
<h2 data-i18n="modal.title">Download Blitz Wallet</h2>
<p data-i18n="modal.subtitle">Choose your platform to get started</p>
<p class="modal-instructions" data-i18n="modal.scanInstructions">Scan with your mobile device</p>
```

- [ ] **Step 10: Verify page renders correctly**

Open `http://localhost:3000` — English text should appear unchanged. Open browser console: no i18n errors. Language switcher globe button should appear in the navbar.

- [ ] **Step 11: Commit**

```bash
git add index.html
git commit -m "feat(i18n): add data-i18n attributes and i18next scripts to homepage"
```

---

### Task 6: Update pages/about/index.html

**Files:**
- Modify: `pages/about/index.html`

- [ ] **Step 1: Add i18next scripts and lang-switcher CSS to `<head>`** (same as Task 5 Step 1)

- [ ] **Step 2: Add data-i18n to nav** (same keys as homepage nav)

- [ ] **Step 3: Add data-i18n to hero section**

```html
<span class="hero-badge" data-i18n="about.hero.badge">Our Mission</span>
<h1 data-i18n="about.hero.title">Global Payments, Powered by Bitcoin</h1>
<p data-i18n="about.hero.desc">We're building...</p>
<span class="stat-number" data-i18n="about.hero.stat1Value">Zero Fees</span>
<span class="stat-label" data-i18n="about.hero.stat1Label">Contact Payments</span>
<span class="stat-number" data-i18n="about.hero.stat2Value">Instant</span>
<span class="stat-label" data-i18n="about.hero.stat2Label">Anywhere in the World</span>
<span class="stat-number" data-i18n="about.hero.stat3Value">100%</span>
<span class="stat-label" data-i18n="about.hero.stat3Label">Self-Custodial</span>
```

- [ ] **Step 4: Add data-i18n to mission section**

Tag the section label, heading, and all 4 mission card titles and descriptions with keys from `about.mission.*`.

- [ ] **Step 5: Add data-i18n to challenge section heading**

```html
<span class="section-label" data-i18n="about.challenge.label">The Challenge</span>
<h2 data-i18n="about.challenge.heading">Why Global Payments Are Broken</h2>
```

Note: The detailed problem/solution paragraphs and the story quote contain complex markup (inline `<strong>`, `<ol>`, `<a>` tags). Tag only the headings; leave body paragraphs as-is for now to avoid breaking markup.

- [ ] **Step 6: Add data-i18n to values section**

Tag section label, heading, and all 3 value card titles and descriptions with keys from `about.values.*`.

- [ ] **Step 7: Add data-i18n to CTA, footer, and modal** (same keys as homepage)

- [ ] **Step 8: Commit**

```bash
git add pages/about/index.html
git commit -m "feat(i18n): add data-i18n attributes to About page"
```

---

### Task 7: Update pages/contact/index.html

**Files:**
- Modify: `pages/contact/index.html`

- [ ] **Step 1: Add i18next scripts and lang-switcher CSS to `<head>`**

- [ ] **Step 2: Add data-i18n to nav, footer, and modal** (same keys as before)

- [ ] **Step 3: Add data-i18n to contact form**

```html
<h2 id="pageDescription" data-i18n="contact.pageTitle">Contact Us</h2>
<h2 data-i18n="contact.greeting1">Hi,</h2>
<h2 data-i18n="contact.greeting2">Have a question in mind?</h2>

<label>
  <span data-i18n="contact.nameLabelOptional">Name (optional)</span>
  <input type="text" name="sendersName"
    placeholder="Enter name here"
    data-i18n-placeholder="contact.namePlaceholder" />
</label>

<label>
  <span data-i18n="contact.emailLabelRequired">Email (required)</span>
  <input required type="email" name="email"
    placeholder="Enter email here"
    data-i18n-placeholder="contact.emailPlaceholder" />
</label>

<label>
  <span data-i18n="contact.messageLabelRequired">Message (required)</span>
  <textarea required name="message"
    placeholder="Add message here"
    data-i18n-placeholder="contact.messagePlaceholder"></textarea>
</label>

<button data-i18n="contact.submitBtn">Submit</button>
```

Note: The `<label>` tags in the original HTML have text directly as child text nodes mixed with inputs. Wrap the label text in a `<span>` to attach `data-i18n` without breaking the label-input association.

- [ ] **Step 4: Commit**

```bash
git add pages/contact/index.html
git commit -m "feat(i18n): add data-i18n attributes to Contact page"
```

---

### Task 8: Update pages/blog/index.html

**Files:**
- Modify: `pages/blog/index.html`

- [ ] **Step 1: Add i18next scripts and lang-switcher CSS to `<head>`**

- [ ] **Step 2: Add data-i18n to nav, footer, and modal**

- [ ] **Step 3: Add data-i18n to blog page headings**

```html
<h2 class="pageTitle" data-i18n="blog.pageTitle">The latest from Blitz Wallet</h2>
<h4 class="pageSubTitle" data-i18n="blog.pageSubTitle">Making bitcoin payments simple</h4>
```

- [ ] **Step 4: Commit**

```bash
git add pages/blog/index.html
git commit -m "feat(i18n): add data-i18n attributes to Blog index page"
```

---

## Chunk 3: Netlify Functions — Translation Infrastructure

### Task 9: Update netlify/handle-gift.js

**Files:**
- Modify: `netlify/handle-gift.js`

- [ ] **Step 1: Add `getGiftTranslations` helper at top of file**

Insert this function before `fetchGiftData`:

```javascript
function getGiftTranslations(lang) {
  const VALID = ['en', 'es', 'pt', 'fr', 'de'];
  const l = VALID.includes(lang) ? lang : 'en';
  const strings = {
    en: {
      loading: 'Loading your gift...',
      errorTitle: 'Error Loading Gift',
      notFoundTitle: 'Gift Not Found',
      notFoundDesc: "This gift doesn't exist or has already been claimed.",
      receivedTitle: "You've Received a Gift!",
      step1Title: 'Download Blitz Wallet',
      step1Desc: 'Get the free app from the App Store or Google Play.',
      step1Btn: 'Download Blitz Wallet',
      step2Title: 'Claim Your Gift',
      step2Desc: 'Already installed? Tap below to open your gift in Blitz.',
      openInAppBtn: 'Open in Blitz Wallet',
      copyLinkBtn: 'Copy Gift Link',
      copiedBtn: 'Link Copied!',
      alreadyClaimed: 'Already Claimed',
      expired: 'Expired',
      alreadyClaimedDesc: (giftType) => `This ${giftType} gift has already been claimed.`,
      expiredDesc: (giftType) => `This ${giftType} gift has expired.`,
      navDownload: 'Download',
      modalTitle: 'Download Blitz Wallet',
      modalSubtitle: 'Choose your platform to get started',
      modalScan: 'Scan with your mobile device',
      ogClaimTitle: (amount, type) => `Claim your ${amount} ${type} Gift!`,
      ogClaimDesc: (amount) => `You've received a ${amount} Bitcoin gift. Claim it instantly on Blitz Wallet.`,
      ogFallbackTitle: "You've received a Bitcoin Gift!",
      ogFallbackDesc: 'Claim your Bitcoin gift on Blitz Wallet.',
    },
    es: null, // placeholder — copy of en
    pt: null,
    fr: null,
    de: null,
  };
  return strings[l] || strings.en;
}
```

For the placeholder languages (`es`, `pt`, `fr`, `de`), set each to `null` so the function falls back to `en`. Then at the end of `getGiftTranslations`, use:

```javascript
  return strings[l] ?? strings.en;
```

- [ ] **Step 2: Update the `handler` function to read `lang` and pass `t` to `generateHTML`**

Replace the existing `handler` export:

```javascript
export async function handler(event, context) {
  const lang = event.queryStringParameters?.lang || 'en';
  const t = getGiftTranslations(lang);

  const path = (event.path || "").replace(/\/+$/, "");
  // Strip language prefix if present (e.g. /es/gift/abc → /gift/abc)
  const VALID_LANGS = ['en', 'es', 'pt', 'fr', 'de'];
  const segments = path.split('/').filter(Boolean);
  const pathSegments = VALID_LANGS.includes(segments[0]) ? segments.slice(1) : segments;
  let giftId = pathSegments[pathSegments.length - 1] || '';
  try { giftId = decodeURIComponent(giftId); } catch (e) {}

  const baseUrl = process.env.URL || "https://blitzwalletapp.com";
  const giftData = await fetchGiftData(giftId, baseUrl);

  let ogTitle, ogDescription, ogImage;

  if (giftData) {
    const denomination = giftData.denomination ?? "BTC";
    const amountLabel = formatGiftAmountLabel(giftData);
    ogTitle = t.ogClaimTitle(amountLabel, denomination === "BTC" ? "Bitcoin" : "Dollar");
    ogDescription = t.ogClaimDesc(amountLabel);
    ogImage = buildGiftOgImageUrl(baseUrl, giftId, giftData);
  } else {
    ogTitle = t.ogFallbackTitle;
    ogDescription = t.ogFallbackDesc;
    ogImage = `https://blitzwalletapp.com/public/twitterCardPresent.png`;
  }

  const html = generateHTML({ ogTitle, ogDescription, ogImage, giftId, giftData, t });

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html,
  };
}
```

- [ ] **Step 3: Update `generateHTML` to accept and use `t`**

Change the function signature to `function generateHTML({ ogTitle, ogDescription, ogImage, giftId, giftData, t })`.

Replace all hardcoded UI strings in the returned HTML template with `${t.keyName}`. Key replacements:

| Hardcoded string | Replace with |
|---|---|
| `"Loading your gift..."` | `${t.loading}` |
| `"Error Loading Gift"` | `${t.errorTitle}` |
| `"Gift Not Found"` | `${t.notFoundTitle}` |
| `"This gift doesn't exist or has already been claimed."` | `${t.notFoundDesc}` |
| `"You've Received a Gift!"` | `${t.receivedTitle}` |
| `"Download Blitz Wallet"` (step 1 title) | `${t.step1Title}` |
| `"Get the free app from the App Store or Google Play."` | `${t.step1Desc}` |
| `"Download Blitz Wallet"` (step 1 button) | `${t.step1Btn}` |
| `"Claim Your Gift"` | `${t.step2Title}` |
| `"Already installed? Tap below to open your gift in Blitz."` | `${t.step2Desc}` |
| `"Open in Blitz Wallet"` | `${t.openInAppBtn}` |
| `"Copy Gift Link"` | `${t.copyLinkBtn}` |
| `'Already Claimed'` | `${t.alreadyClaimed}` |
| `'Expired'` | `${t.expired}` |
| `"Download"` (nav button) | `${t.navDownload}` |
| `"Download Blitz Wallet"` (modal h2) | `${t.modalTitle}` |
| `"Choose your platform to get started"` | `${t.modalSubtitle}` |
| `"Scan with your mobile device"` | `${t.modalScan}` |

For the JS inside the `<script>` block within the HTML template, the `copyGift` function sets `button.textContent = 'Link Copied!'`. Since this is inside a template literal, replace with `${t.copiedBtn}`.

The `isClaimed` / `isExpired` desc strings use `giftType` — these are generated in client-side JS. Embed `t.alreadyClaimedDesc` and `t.expiredDesc` as string templates using `JSON.stringify`:

```javascript
// In the server-side template, provide translations as a JS object for client-side use:
const T_JSON = JSON.stringify({
  errorTitle: t.errorTitle,
  notFoundTitle: t.notFoundTitle,
  notFoundDesc: t.notFoundDesc,
  receivedTitle: t.receivedTitle,
  step1Title: t.step1Title,
  step1Desc: t.step1Desc,
  step1Btn: t.step1Btn,
  step2Title: t.step2Title,
  step2Desc: t.step2Desc,
  openInAppBtn: t.openInAppBtn,
  copyLinkBtn: t.copyLinkBtn,
  copiedBtn: t.copiedBtn,
  alreadyClaimed: t.alreadyClaimed,
  expired: t.expired,
  alreadyClaimedDesc: t.alreadyClaimedDesc('{{giftType}}'),
  expiredDesc: t.expiredDesc('{{giftType}}'),
});
```

In the HTML template, before the client-side `<script>`, embed:

```html
<script>const T = ${T_JSON};</script>
```

Then in the client-side `renderGiftCard` function, replace hardcoded strings with `T.keyName`:
- `'Error Loading Gift'` → `T.errorTitle`
- `'Gift Not Found'` → `T.notFoundTitle`
- etc.

For `alreadyClaimedDesc` / `expiredDesc`, the template string uses `giftType` variable:
```javascript
T.alreadyClaimedDesc.replace('{{giftType}}', giftType)
T.expiredDesc.replace('{{giftType}}', giftType)
```

- [ ] **Step 4: Commit**

```bash
git add netlify/handle-gift.js
git commit -m "feat(i18n): add translation infrastructure to handle-gift.js"
```

---

### Task 10: Update netlify/handle-pool.js

**Files:**
- Modify: `netlify/handle-pool.js`

- [ ] **Step 1: Add `getPoolTranslations` helper** (same pattern as `getGiftTranslations`)

Translatable strings to extract from the function's HTML output:
- Loading text
- "Download" nav button
- Contribute button label
- Error/not-found title and description
- Modal title, subtitle, scan instructions

- [ ] **Step 2: Update `handler` to read `lang`, build `t`, strip lang prefix from path, pass `t` to HTML generator**

Same pattern as handle-gift.js: read `event.queryStringParameters?.lang`, call `getPoolTranslations(lang)`, strip lang prefix from event.path, pass `t` to the HTML generation function.

- [ ] **Step 3: Replace hardcoded UI strings in generated HTML with `${t.keyName}`**

- [ ] **Step 4: Commit**

```bash
git add netlify/handle-pool.js
git commit -m "feat(i18n): add translation infrastructure to handle-pool.js"
```

---

### Task 11: Update netlify/handle-paylink.js

**Files:**
- Modify: `netlify/handle-paylink.js`

- [ ] **Step 1: Add `getPaylinkTranslations` helper**

- [ ] **Step 2: Update `handler` to read `lang`, strip lang prefix, pass `t` to HTML generator**

- [ ] **Step 3: Replace hardcoded UI strings with `${t.keyName}`**

- [ ] **Step 4: Commit**

```bash
git add netlify/handle-paylink.js
git commit -m "feat(i18n): add translation infrastructure to handle-paylink.js"
```

---

### Task 12: Update netlify/dynamic-profile.js

**Files:**
- Modify: `netlify/dynamic-profile.js`

- [ ] **Step 1: Add `getProfileTranslations` helper**

The profile page generates minimal static HTML — it loads `/src/js/profile.js` dynamically which renders the actual UI. Only translate the static strings visible before profile.js loads:

```javascript
function getProfileTranslations(lang) {
  const VALID = ['en', 'es', 'pt', 'fr', 'de'];
  const l = VALID.includes(lang) ? lang : 'en';
  const strings = {
    en: {
      loading: 'Loading...',
      navDownload: 'Download',
    },
    es: null, pt: null, fr: null, de: null,
  };
  return strings[l] ?? strings.en;
}
```

- [ ] **Step 2: Update `handler` to read `lang`, strip lang prefix from path, use `t` in HTML template**

Read `event.queryStringParameters?.lang`, strip the language prefix, replace `'Loading...'` and `'Download'` in the generated HTML with `${t.loading}` and `${t.navDownload}`.

- [ ] **Step 3: Commit**

```bash
git add netlify/dynamic-profile.js
git commit -m "feat(i18n): add translation infrastructure to dynamic-profile.js"
```

---

## Verification

After completing all tasks:

1. **Start dev server:** `npm run dev` — server at `http://localhost:3000`

2. **Homepage English:** Visit `http://localhost:3000/`
   - English text renders correctly
   - Globe language switcher appears in navbar
   - No console errors

3. **URL prefix routing:** Visit `http://localhost:3000/es/`
   - Page loads (same content — placeholders are English)
   - `<html lang="es">` in DOM inspector
   - Language switcher shows "ES" and highlights Español

4. **Language switcher:** Click globe → select Español → URL changes to `/es/` → click Français → URL changes to `/fr/`

5. **About page:** Visit `http://localhost:3000/es/pages/about/` — page loads, switcher shows ES

6. **Contact page:** `http://localhost:3000/es/pages/contact/` — form renders correctly

7. **Blog page:** `http://localhost:3000/es/pages/blog/` — headings render

8. **Function routes (requires `netlify dev`):**
   - `http://localhost:8888/es/gift/test-id` — gift page renders
   - `http://localhost:8888/es/u/alice` — profile page renders
   - Check browser network tab: functions receive `?lang=es`

9. **English return:** From `/es/`, click English in switcher → URL becomes `/`
