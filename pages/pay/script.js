(function () {
  var hash = decodeURIComponent(location.hash.slice(1));
  var autoOpen = hash.indexOf('open:') === 0;
  var invoice = (autoOpen ? hash.slice(5) : hash).trim().toLowerCase();

  // Only a bech32 BOLT11 invoice is ever put into the page or a link.
  if (!/^ln(bc|tb|bcrt|tbs)[0-9a-z]{20,4000}$/.test(invoice)) {
    document.getElementById('error').hidden = false;
    document.getElementById('hint').hidden = true;
    return;
  }

  // Amount from the human-readable part, e.g. lnbc21u -> 2,100 sats.
  var m = /^ln(?:bc|tb|bcrt|tbs)(\d+)([munp]?)1/.exec(invoice);
  if (m) {
    var msat =
      Number(m[1]) * { m: 1e8, u: 1e5, n: 100, p: 0.1, '': 1e11 }[m[2]];
    if (msat >= 1000) {
      document.getElementById('amount').textContent =
        Math.floor(msat / 1000).toLocaleString('en-US') + ' sats';
    }
  }

  var link = 'lightning:' + invoice;
  if (window.QRCode) {
    // Uppercase is the compact QR form for BOLT11 (alphanumeric mode).
    new QRCode(document.getElementById('qr'), {
      text: 'LIGHTNING:' + invoice.toUpperCase(),
      width: 200,
      height: 200,
      correctLevel: QRCode.CorrectLevel.M,
    });
  } else {
    document.getElementById('qr').hidden = true;
  }
  document.getElementById('invoice').textContent = invoice;
  document.getElementById('open').href = link;
  document.getElementById('invoice-view').hidden = false;

  var copy = document.getElementById('copy');
  copy.addEventListener('click', function () {
    function done() {
      copy.textContent = 'Copied ✓';
    }
    function fallback() {
      var area = document.createElement('textarea');
      area.value = invoice;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      done();
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(invoice).then(done, fallback);
    } else {
      fallback();
    }
  });

  if (autoOpen) location.href = link;
})();
