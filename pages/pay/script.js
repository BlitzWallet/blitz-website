(function () {
  var hash = decodeURIComponent(location.hash.slice(1));
  var autoOpen = hash.indexOf("open:") === 0;
  var invoice = (autoOpen ? hash.slice(5) : hash).trim().toLowerCase();

  // Only a bech32 BOLT11 invoice is ever put into the page or a link.
  if (!/^ln(bc|tb|bcrt|tbs)[0-9a-z]{20,4000}$/.test(invoice)) {
    document.getElementById("error").hidden = false;
    document.getElementById("hint").hidden = true;
    return;
  }

  // Amount from the human-readable part, e.g. lnbc21u -> 2,100 sats.
  var m = /^ln(?:bc|tb|bcrt|tbs)(\d+)([munp]?)1/.exec(invoice);
  if (m) {
    var msat =
      Number(m[1]) * { m: 1e8, u: 1e5, n: 100, p: 0.1, "": 1e11 }[m[2]];
    if (msat >= 1000) {
      var amount = document.getElementById("amount");
      amount.textContent =
        Math.floor(msat / 1000).toLocaleString("en-US") + " sats";
      amount.hidden = false;
    }
  }

  var link = "lightning:" + invoice;
  if (window.QRCode) {
    // Uppercase is the compact QR form for BOLT11 (alphanumeric mode).
    new QRCode(document.getElementById("qr"), {
      text: "LIGHTNING:" + invoice.toUpperCase(),
      width: 220,
      height: 220,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  } else {
    document.getElementById("qr-wrapper").hidden = true;
  }

  document.getElementById("open").href = link;
  document.getElementById("invoice-view").hidden = false;

  var copy = document.getElementById("copy");
  function copyInvoice() {
    function done() {
      copy.textContent = "Copied";
    }
    function fallback() {
      var area = document.createElement("textarea");
      area.value = invoice;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      done();
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(invoice).then(done, fallback);
    } else {
      fallback();
    }
  }
  copy.addEventListener("click", copyInvoice);
  document.getElementById("copy-icon").addEventListener("click", copyInvoice);
  document.getElementById("qr-wrapper").addEventListener("click", copyInvoice);

  if (autoOpen) location.href = link;
})();
