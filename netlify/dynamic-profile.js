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

    <!-- Favicon -->
    <link
      rel="icon"
      type="image/png"
      href="/public/favicon/favicon-96x96.png"
      sizes="96x96"
    />
    <link rel="icon" type="image/svg+xml" href="/public/favicon/favicon.svg" />
    <link rel="shortcut icon" href="/public/favicon/favicon.ico" />
    <link rel="apple-touch-icon" href="/public/favicon/favicon.ico" />
    <meta name="apple-mobile-web-app-title" content="Blitz Wallet" />
    <link rel="manifest" href="/public/favicon/site.webmanifest" />
    
   
    <title>Blitz Wallet | ${username}</title>
    <meta
      name="description"
      content="Blitz Wallet is a self-custodial Bitcoin wallet that lets you make payments with friends, spend Bitcoin at stores, and simplifies Bitcoin payments. Download the IOS or Android app today."
    />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://blitz-wallet.com/u/${username}" />
    <meta property="og:title" content="Blitz Wallet | ${username}" />
    <meta property="og:description" content="Blitz Wallet is a self-custodial Bitcoin wallet that lets you make payments with friends, spend Bitcoin at stores, and simplifies Bitcoin payments. Download the IOS or Android app today." />

    <!-- Twitter -->
    <meta property="twitter:url" content="https://blitz-wallet.com/u/${username}" />
    <meta property="twitter:title" content="Blitz Wallet | ${username}" />
    <meta property="twitter:description" content="Blitz Wallet is a self-custodial Bitcoin wallet that lets you make payments with friends, spend Bitcoin at stores, and simplifies Bitcoin payments. Check out ${username} on Blitz Wallet." />
    

    <!-- Open Graph Meta for Apple -->
    <meta property="og:title" content="${username}" />
    <meta property="og:site_name" content="Blitz Wallet" />
    <meta property="og:description" content="Check out ${username} on Blitz Wallet." />
    <meta property="og:url" content="https://blitz-wallet.com/u/${username}" />

    <meta name="robots" content="index,nofollow"> 
    <meta name="googlebot" content="noindex,nofollow">
    <script src="/src/js/font-loader.js" defer></script>

    <link rel="stylesheet" href="../src/assets/styles/index.css" />
    <link rel="stylesheet" href="./index.css" />
    <script>
      document.addEventListener("DOMContentLoaded", async function () {
        document.body.innerHTML = '<div id="app">Loading...</div>';
        const script = document.createElement('script');
        script.src = "/src/js/profile.js";
        document.body.appendChild(script);
        
        let didClick = false;
        let runCount = 0;
        
        const tryClickButton = async () => {
          do {
            console.log('running', didClick, runCount);
            const blitzLinkButton = document.querySelector("#blitzLink");
            try {
              if (blitzLinkButton) {
                blitzLinkButton.click();
                didClick = true;
              }
            } catch (err) {
              console.log(err);
            } finally {
              runCount += 1;
              await new Promise(resolve => setTimeout(resolve, 250));
            }
          } while (!didClick && runCount < 20);
        };
        
        // Try initial click
        await tryClickButton();
        
      });
    </script>
  </head>
  <body>
  <h1>Redirecting...</h1>
   <!-- Google tag (gtag.js) -->
    <script
      async
      src="https://www.googletagmanager.com/gtag/js?id=G-WNRJ7Y4RVE"
    ></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());

      gtag("config", "G-WNRJ7Y4RVE");
    </script>
  </body>
</html>`,
  };
}
