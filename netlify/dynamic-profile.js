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
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="favicon-48x48.png">
<link rel="icon" type="image/png" sizes="64x64" href="favicon-64x64.png">
<link rel="icon" type="image/png" sizes="96x96" href="favicon-96x96.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
    <title>Blitz Wallet | ${username}</title>
    <meta
      name="description"
      content="Blitz Wallet is a digital wallet that lets you make payments with friends. Download the IOS or Android app today."
    />
    
    <!-- Twitter Meta Tags -->
    <meta property="twitter:title" content="Blitz Wallet | ${username}" />
    <meta property="twitter:description" content="Check out the Blitz Wallet profile of ${username}." />
   

    <!-- Open Graph Meta for Apple -->
    <meta property="og:title" content="${username}" />
    <meta property="og:site_name" content="Blitz Wallet" />
    <meta property="og:description" content="Check out ${username} on Blitz Wallet." />
    <meta property="og:url" content="https://blitz-wallet.com/u/${username}" />


    <!-- Apple Icon -->
    <link rel="apple-touch-icon" href="/favicon.png" />

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
