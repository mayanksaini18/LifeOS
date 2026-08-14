const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.RESEND_FROM || 'LifeOS <reminders@smarthabittracker.online>';
const APP_URL = process.env.APP_URL || 'https://www.smarthabittracker.online';

function isEnabled() {
  return !!resend;
}

function wrap({ preheader, title, body, ctaLabel, ctaUrl, footer }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0b0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e8e8ea;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader || ''}</span>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0c;padding:40px 16px;">
      <tr><td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#131316;border:1px solid #24242a;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:32px 32px 8px 32px;">
            <p style="margin:0;font-size:13px;letter-spacing:.04em;color:#8a8a92;text-transform:uppercase;font-weight:600;">LifeOS</p>
          </td></tr>
          <tr><td style="padding:16px 32px 8px 32px;">
            <h1 style="margin:0;font-size:22px;line-height:1.3;color:#fafafa;font-weight:600;letter-spacing:-0.01em;">${title}</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 24px 32px;">
            <p style="margin:0;font-size:15px;line-height:1.55;color:#b0b0b8;">${body}</p>
          </td></tr>
          ${ctaLabel && ctaUrl ? `
          <tr><td style="padding:0 32px 32px 32px;">
            <a href="${ctaUrl}" style="display:inline-block;background:#fafafa;color:#0b0b0c;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">${ctaLabel}</a>
          </td></tr>` : ''}
          <tr><td style="padding:24px 32px;border-top:1px solid #24242a;">
            <p style="margin:0;font-size:11px;line-height:1.5;color:#6a6a72;">
              ${footer || `You're receiving this because email reminders are enabled. <a href="${APP_URL}/settings" style="color:#8a8a92;">Manage preferences</a>.`}
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function sendReminder({ to, module }) {
  if (!resend) return { skipped: 'no-api-key' };

  const templates = {
    mood:     { subject: "How are you feeling today?",   title: "How are you feeling today?",   body: "Take a few seconds to log your mood. Small check-ins build into big self-awareness.",  cta: "Log mood",     url: `${APP_URL}/mood` },
    sleep:    { subject: "How did you sleep?",            title: "How did you sleep?",            body: "Track last night's rest while it's fresh. Sleep data is the foundation for everything else.", cta: "Log sleep",    url: `${APP_URL}/sleep` },
    water:    { subject: "Stay hydrated",                 title: "Time to hydrate",               body: "A quick reminder to log your water. Staying on top of hydration is one of the fastest wins.", cta: "Log water",    url: `${APP_URL}/water` },
    exercise: { subject: "Time to move",                  title: "Time to move",                  body: "Even 15 minutes counts. Log your workout and keep the streak going.",                         cta: "Log workout",  url: `${APP_URL}/fitness` },
  };
  const t = templates[module];
  if (!t) return { skipped: 'unknown-module' };

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: t.subject,
      html: wrap({ preheader: t.body, title: t.title, body: t.body, ctaLabel: t.cta, ctaUrl: t.url }),
    });
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error(`[email] reminder failed for ${to}:`, err.message);
    return { error: err.message };
  }
}

async function sendVerificationEmail({ to, url, name }) {
  if (!resend) return { skipped: 'no-api-key' };

  const firstName = (name || '').trim().split(' ')[0] || 'there';
  const title = `Verify your email`;
  const body = `Hey ${firstName}, welcome to LifeOS! Tap the button below to confirm your email address. This link expires in 24 hours.`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Verify your email for LifeOS',
      html: wrap({
        preheader: 'Confirm your email to finish creating your LifeOS account.',
        title,
        body,
        ctaLabel: 'Verify email',
        ctaUrl: url,
        footer: `If you didn't sign up for LifeOS, you can ignore this message.`,
      }),
    });
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error(`[email] verification failed for ${to}:`, err.message);
    return { error: err.message };
  }
}

async function sendPasswordResetEmail({ to, url, name }) {
  if (!resend) return { skipped: 'no-api-key' };

  const firstName = (name || '').trim().split(' ')[0] || 'there';

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Reset your LifeOS password',
      html: wrap({
        preheader: 'Use this link to choose a new LifeOS password.',
        title: 'Reset your password',
        body: `Hey ${firstName}, tap the button below to choose a new password. This link expires in 1 hour and can only be used once.`,
        ctaLabel: 'Reset password',
        ctaUrl: url,
        // The default footer points at reminder preferences, which is both
        // wrong and alarming here — this is a security email, not a reminder.
        footer: `If you didn't request a password reset, you can ignore this message and your password will stay as it is.`,
      }),
    });
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error(`[email] password reset failed for ${to}:`, err.message);
    return { error: err.message };
  }
}

module.exports = { sendReminder, sendVerificationEmail, sendPasswordResetEmail, isEnabled };
