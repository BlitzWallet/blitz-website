// Connection requests (NWC-08). The app sends people to
// blitzwallet.app/nwc/auth?pubkey=...; on a phone with Blitz that opens
// the app directly. Everywhere else it lands here, so offer the same
// request as a nostr+walletauth:// link and a QR code for the Blitz
// camera. Only public keys and a one-time code are in the link.
(function () {
  var params = new URLSearchParams(location.search);
  if (!params.has('pubkey') && !params.has('state')) return;

  var pubkey = (params.get('pubkey') || '').toLowerCase();
  var state = (params.get('state') || '').toLowerCase();
  var relays = params.getAll('relay');
  var valid =
    /^[0-9a-f]{64}$/.test(pubkey) &&
    /^[0-9a-f]{32,128}$/.test(state) &&
    relays.length > 0 &&
    relays.every(function (r) {
      return /^wss:\/\/\S+$/i.test(r);
    });
  if (!valid) {
    document.getElementById('pair-invalid').hidden = false;
    return;
  }

  params.delete('pubkey');
  var uri =
    'nostr+walletauth://' +
    pubkey +
    '?' +
    params.toString().replace(/\+/g, '%20');

  var name = (params.get('name') || '').replace(/[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '').slice(0, 40);
  if (name) document.getElementById('pair-app').textContent = name;

  var wants = [];
  var methods = (params.get('request_methods') || '') + ' ' + (params.get('optional_request_methods') || '');
  if (/\bmake_invoice\b/.test(methods)) wants.push('receive payments');
  if (/\bpay_invoice\b/.test(methods)) wants.push('send payments (you decide)');
  if (/\bget_balance\b/.test(methods)) wants.push('see your balance');
  if (/\blist_transactions\b/.test(methods)) wants.push('see your transactions');
  var summary = wants.length ? 'It asks to ' + wants.join(', ') + '.' : '';
  var max = Number(params.get('max_amount'));
  var period = params.get('renewal_period');
  if (max >= 1000 && period) {
    summary +=
      ' Spending limit: ' +
      Math.floor(max / 1000).toLocaleString('en-US') +
      ' sats per ' +
      ({ daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[period] || period) +
      '.';
  }
  document.getElementById('pair-summary').textContent = summary;

  document.getElementById('pair-open').href = uri;
  var copy = document.getElementById('pair-copy');
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(uri).then(function () {
      copy.textContent = 'Copied ✓';
    });
  });
  document.getElementById('pair').hidden = false;

  function drawQr() {
    if (!window.QRCode) return setTimeout(drawQr, 100);
    new QRCode(document.getElementById('pair-qr'), {
      text: uri,
      width: 180,
      height: 180,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }
  window.addEventListener('DOMContentLoaded', drawQr);
})();
