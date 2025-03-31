const username = window.location.pathname.split("/").pop();

document.body.innerHTML = `<section class="container">
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
    </section>`;
