"use strict";
export async function handler(event, context) {
  const path = event.path; // Get the path from the URL
  const username = path.split("/").pop(); // Extract the username from the path

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Blitz Wallet | ${username}</title>
        <meta property="og:title" content="Blitz Wallet | ${username}" />
        <meta property="og:description" content="Check out the Blitz Wallet profile of ${username}." />
        <meta property="og:image" content="https://blitz-wallet.com/public/favicon.png" />
        <meta property="og:url" content="https://blitz-wallet.com${path}" />

         <script src="/u/index.js" defer></script>

         <link rel="stylesheet" href="/src/assets/styles/index.css" />
          

    <link rel="stylesheet" href="/u/index.css" />

        <link rel="icon" href="../public/favicon.png">
        
    </head>
    <body>
        <div class="wordmarkContainer">
      <a href="/">
        <img
          src="/public/wordmark.png"
          alt="blitz wallet wordmark logo to take you back to the homepage"
        />
      </a>
    </div>
    <div class="contentContainer">
      <h1 class="header">Sign in to pay ${username}</h1>
      <h3>or create a Blitz Wallet account</h3>
      

      <div class="buttonContainer">
        <a id="blitzLink" href="blitz-wallet://u/${username}" class="button">
          <span>Go to app</span>
        </a>
        <a href="/" class="button">
          <span>Download</span>
        </a>
      </div>
    </div>
       
    </body>
    
    </html>
    `;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: htmlContent,
  };
}
