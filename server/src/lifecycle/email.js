/**
 * Email delivery via SMTP (nodemailer). Credentials come exclusively from
 * environment variables — nothing is hard-coded. If SMTP is not configured,
 * the send is recorded in the email log and reported as "simulated" so the
 * lifecycle still works in development without real credentials.
 *
 * Required env vars for real delivery:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * Optional:
 *   SMTP_SECURE ("true"/"false"), SMTP_FROM (defaults to SMTP_USER)
 */
import nodemailer from 'nodemailer';
import { db, nextId } from '../store.js';

let transporter = null;
let configured = false;

function getTransporter() {
  if (transporter || configured) return transporter;
  configured = true;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE) === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export function isEmailConfigured() {
  return !!getTransporter();
}

/**
 * Send an email, optionally with PDF attachments. Always writes an emailLog row.
 * @returns {Promise<{ ok: boolean, simulated: boolean, messageId?: string, logId: string }>}
 */
export async function sendEmail({ orgId, to, subject, html, text, attachments = [] }) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@equiptrack.local';
  const tx = getTransporter();
  const base = {
    id: nextId('email'),
    orgId: orgId || null,
    to,
    from,
    subject,
    attachmentNames: attachments.map((a) => a.filename),
    createdAt: new Date().toISOString(),
  };

  if (!tx) {
    const row = { ...base, status: 'simulated', note: 'SMTP not configured; logged only.' };
    db.emailLog.push(row);
    return { ok: true, simulated: true, logId: row.id };
  }

  try {
    const info = await tx.sendMail({ from, to, subject, html, text, attachments });
    const row = { ...base, status: 'sent', messageId: info.messageId };
    db.emailLog.push(row);
    return { ok: true, simulated: false, messageId: info.messageId, logId: row.id };
  } catch (err) {
    const row = { ...base, status: 'failed', error: err.message };
    db.emailLog.push(row);
    throw err;
  }
}
