/* ============================================================================
   Shared design-system CSS for the Netlify serverless functions.

   Serverless functions render full HTML documents and can't <link> the site
   stylesheets, so the same tokens + component primitives are exported here as a
   string and injected into each function's inline <style> block.

   KEEP IN SYNC with src/assets/styles/index.css and components.css. If you
   change a token or a primitive there, mirror it here. See docs/design-system.md.

   Usage inside a function's template literal:

     <style>
       ${designCss}
       // ...page-specific styles only...
     </style>
   ========================================================================== */

export const designCss = /* css */ `
  /* --- Design tokens (mirror of index.css :root) --- */
  :root {
    --color-brand: #0375f6;
    --color-brand-strong: rgba(3, 117, 246, 0.28);
    --color-green: #44be82;
    --color-orange: #ffac30;

    --color-ink: #121111;
    --color-ink-70: rgba(18, 17, 17, 0.68);
    --color-ink-60: rgba(18, 17, 17, 0.6);
    --color-ink-45: rgba(18, 17, 17, 0.45);
    --color-hairline: rgba(18, 17, 17, 0.08);

    --color-bg: #fbfaf7;
    --color-surface: #ffffff;
    --color-surface-warm: #f6f4ef;
    --color-surface-offset: #edebe7;

    --color-error-bg: #fef2f2;
    --color-error-border: #fecaca;
    --color-error-text: #991b1b;
    --color-success: var(--color-green);

    --font-sans: "Poppins", "Noto Sans", sans-serif;
    --radius-card: 8px;
    --radius-pill: 999px;

    --shadow-card: 0 22px 52px rgba(18, 17, 17, 0.09);
    --shadow-nav: 0 12px 34px rgba(18, 17, 17, 0.08);
    --shadow-btn: 0 12px 24px rgba(0, 0, 0, 0.22);

    --ease-micro: 260ms ease;
    --ease-spring: cubic-bezier(0.22, 1.18, 0.36, 1);

    /* Back-compat aliases used throughout the function markup */
    --primary_color: var(--color-brand);
    --secondary_color: var(--color-ink);
    --tertiary_color: var(--color-green);
    --lm-background: var(--color-bg);
    --lm-backgroundOffset: var(--color-surface-offset);
    --lm-text: var(--color-ink);
    --title_font: var(--font-sans);
    --description_font: var(--font-sans);
    --other_font: var(--font-sans);
  }

  /* --- Buttons (solid, matching the home hero) --- */
  .btn-primary,
  .btn-secondary {
    min-height: 48px;
    padding: 0.9rem 1.25rem;
    border-radius: var(--radius-card);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 1px solid transparent;
    text-decoration: none;
    font-family: var(--font-sans);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      transform var(--ease-micro),
      background var(--ease-micro),
      color var(--ease-micro),
      box-shadow var(--ease-micro);
  }
  .btn-primary {
    background: var(--color-brand);
    color: #fff;
    box-shadow: var(--shadow-btn);
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px var(--color-brand-strong);
  }
  .btn-secondary {
    background: transparent;
    color: var(--color-brand);
    border-color: var(--color-surface-offset);
  }
  .btn-secondary:hover {
    transform: translateY(-2px);
    background: var(--color-surface-offset);
  }

  /* --- Spinner (single canonical) --- */
  .spinner {
    width: var(--spinner-size, 40px);
    height: var(--spinner-size, 40px);
    border-radius: 50%;
    border: 4px solid color-mix(in srgb, var(--color-brand) 16%, transparent);
    border-top-color: var(--color-brand);
    animation: spin 0.95s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* --- Full-screen branded loader --- */
  .loading-screen {
    width: 100%;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 2rem;
  }
  .loading-screen[hidden],
  .loading-screen.hidden {
    display: none;
  }
  .loading-screen-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
  }
  .loading-wordmark {
    width: 220px;
    max-width: 65vw;
  }
  .loading-copy {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .loading-copy h1 {
    margin: 0;
    color: var(--color-ink);
    font-size: clamp(2rem, 4vw, 3.5rem);
    font-weight: 400;
  }
  .loading-copy p {
    margin: 0;
    color: var(--color-ink-70);
  }

  /* --- Error box (single canonical) --- */
  .error-box {
    padding: 2rem;
    border-radius: 12px;
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    text-align: center;
  }
  .error-box h2 {
    color: var(--color-error-text);
    margin-bottom: 1rem;
  }
  .error-box p {
    color: var(--color-error-text);
    margin-top: 0.5rem;
  }

  /* --- Toast / overlay (single notification pattern) --- */
  .overlay-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9990;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .overlay-backdrop.active {
    display: flex;
  }
  .overlay-card {
    background: var(--color-surface);
    border-radius: 16px;
    padding: 2rem;
    max-width: 420px;
    width: 100%;
    position: relative;
    box-shadow: var(--shadow-card);
  }
  .overlay-title {
    font-size: 1.1rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
    color: var(--color-ink);
  }
  .overlay-body {
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--color-ink-70);
    margin-bottom: 1rem;
  }
`;
