export async function handler(event, context) {
  const path = event.path;
  const username = path.split("/").pop(); // Get username from URL

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="shortcut icon" href="/favicon.png"/>
    <title>Blitz Wallet | ${username}</title>
    <meta property="og:title" content="Blitz Wallet | ${username}" />
    <meta property="og:description" content="Blitz Wallet is a digital wallet that lets you make payments with friends. Download the IOS or Android app today." />
    <meta
      name="description"
      content="Blitz Wallet is a digital wallet that lets you make payments with friends. Download the IOS or Android app today."
    />
    <meta property="og:image" content="https://blitz-wallet.com/public/favicon.png" />
    <meta property="og:url" content="https://blitz-wallet.com/${username}" />
    
    <!-- Twitter Meta Tags -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="Blitz Wallet | ${username}" />
    <meta property="twitter:description" content="Check out the Blitz Wallet profile of ${username}." />
    <meta property="twitter:image" content="https://blitz-wallet.com/public/favicon.png" />

    <script src="/u/index.js" defer></script>

    <link rel="stylesheet" href="../src/assets/styles/index.css" />
    <link rel="stylesheet" href="./index.css" />

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-WNRJ7Y4RVE"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag("js", new Date());
      gtag("config", "G-WNRJ7Y4RVE");
    </script>
  </head>
  <body>
    <section class="container">
      <div class="wordmarkContainer">
        <a href="/">
          <img src="/public/wordmark.png" alt="blitz wallet wordmark logo to take you back to the homepage" />
        </a>
      </div>
      <div class="contentContainer">
        <h1 class="header">Sign in to pay ${username}</h1>
        <p class="subHeader">or create a Blitz Wallet account</p>

        <div class="buttonContainer">
          <a id="blitzLink" href="blitz-wallet://u/${username}" class="button">
            <p>Go to app</p>
          </a>
          <a href="/" class="button">
            <p>Download</p>
          </a>
        </div>
      </div>
    </section>
  </body>
</html>`,
  };
}
