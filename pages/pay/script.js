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

  // Expiry = signed timestamp (first 35 bits) + the "x" field (default 1h).
  function expiresAt(invoice) {
    var CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    var data = invoice.slice(invoice.lastIndexOf("1") + 1);
    var words = [];
    for (var i = 0; i < data.length; i++) words.push(CHARSET.indexOf(data[i]));
    // Tagged fields sit between the timestamp and the signature + checksum.
    var end = words.length - 104 - 6;
    if (end < 7) return null;
    function num(from, len) {
      for (var n = 0, j = from; j < from + len; j++) n = n * 32 + words[j];
      return n;
    }
    var expiry = 3600;
    for (i = 7; i + 3 <= end; i += 3 + num(i + 1, 2)) {
      if (words[i] === 6) expiry = num(i + 3, num(i + 1, 2));
    }
    return (num(0, 7) + expiry) * 1000;
  }

  function showExpired() {
    document.getElementById("invoice-view").hidden = true;
    document.getElementById("hint").hidden = true;
    var error = document.getElementById("error");
    error.textContent = "This invoice has expired. Ask for a new one.";
    error.hidden = false;
  }

  var expires = expiresAt(invoice);
  if (expires !== null && expires <= Date.now()) {
    showExpired();
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

  // setTimeout overflows past ~24.8 days, so skip far-off expiries.
  if (expires !== null && expires - Date.now() < 2147483647) {
    setTimeout(showExpired, expires - Date.now());
  }

  if (autoOpen) location.href = link;
})();
