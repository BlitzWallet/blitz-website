const UPSTREAM = 'createlnurlinvoice-6krimtymjq-uc.a.run.app';

exports.handler = async (event) => {
  const host = event.headers.host || '';
  const username = event.path.replace(/^\/(\.well-known\/lnurlp|p)\//, '');
  const qs = event.rawQuery ? `?${event.rawQuery}` : '';
  const url = `https://${UPSTREAM}/${username}${qs}`;

  const upstreamHeaders = {
    'x-forwarded-host': host,
    'x-forwarded-proto': 'https',
    'user-agent': event.headers['user-agent'] || '',
    'accept': event.headers['accept'] || '*/*',
  };

  const response = await fetch(url, {
    method: event.httpMethod,
    headers: upstreamHeaders,
    body: event.body || undefined,
  });

  const body = await response.text();
  const contentType = response.headers.get('content-type') || 'application/json';

  return {
    statusCode: response.status,
    headers: { 'content-type': contentType },
    body,
  };
};
