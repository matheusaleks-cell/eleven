import "server-only";
import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      })
    : null;

const FROM_EMAIL = GMAIL_USER ? `Eleven Firearms <${GMAIL_USER}>` : "";

function baseEmailHtml(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string) {
  return `
  <div style="background:#080808;padding:40px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#121212;border-radius:12px;overflow:hidden;border:1px solid #1f1f1f;">
      <tr>
        <td style="background:linear-gradient(90deg,#F5C400,#D4A900);height:3px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding:32px 32px 8px;text-align:center;">
          <p style="margin:0;color:#F5C400;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Eleven Firearms</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 8px;text-align:center;">
          <h1 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${title}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 24px;color:#AAAAAA;font-size:14px;line-height:1.6;text-align:center;">
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;text-align:center;">
          <a href="${ctaUrl}" style="display:inline-block;background:#F5C400;color:#000000;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 32px;border-radius:8px;">${ctaLabel}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;text-align:center;">
          <p style="margin:0;color:#555;font-size:11px;word-break:break-all;">Ou copie e cole este link no navegador:<br />${ctaUrl}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #1f1f1f;text-align:center;">
          <p style="margin:0;color:#444;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Eleven Firearms Group · Sistema de Investimentos</p>
        </td>
      </tr>
    </table>
  </div>`;
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  if (!transporter) {
    console.error("[email] GMAIL_USER/GMAIL_APP_PASSWORD não configurados — e-mail de redefinição não enviado.");
    return { success: false, error: "Serviço de e-mail não configurado." };
  }

  try {
    const html = baseEmailHtml(
      "Redefinição de senha",
      `Olá, ${name}.<br /><br />Recebemos uma solicitação para redefinir a senha da sua conta. Se foi você, clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.<br /><br />Se você não pediu isso, pode ignorar este e-mail com segurança — sua senha atual continua válida.`,
      "Redefinir minha senha",
      resetUrl
    );

    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: "Redefinição de senha — Eleven Firearms",
      html,
    });

    return { success: true };
  } catch (err) {
    console.error("[email] Erro ao enviar e-mail de redefinição:", err);
    return { success: false, error: "Falha ao enviar e-mail." };
  }
}
