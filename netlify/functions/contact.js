const fetch = global.fetch || require('node-fetch');

exports.handler = async (event) => {
  // Allow only POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const MAIL_TO = process.env.MAIL_TO;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@yourdomain.com';

  if (!SENDGRID_API_KEY || !MAIL_TO) {
    return {
      statusCode: 500,
      body: 'Server misconfigured: missing SENDGRID_API_KEY or MAIL_TO environment variable'
    };
  }

  const emailPayload = {
    personalizations: [
      {
        to: [{ email: MAIL_TO }],
        subject: `New message from ${body.fullname || 'Website Visitor'}`
      }
    ],
    from: { email: FROM_EMAIL },
    content: [
      {
        type: 'text/plain',
        value: `${body.fullname || '—'} (${body.email || '—'}, ${body.contact || '—'})\n\n${body.message || ''}`
      }
    ]
  };

  try {
    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('SendGrid error', resp.status, text);
      return { statusCode: 502, body: `SendGrid error: ${text}` };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'OK'
    };
  } catch (err) {
    console.error('Failed to send email', err);
    return { statusCode: 500, body: 'Failed to send email' };
  }
};
