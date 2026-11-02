import nodemailer from 'nodemailer';

function cleanEnv(val?: string): string {
  return (val || '').trim().replace(/^['"]|['"]$/g, '');
}

function getTransporter() {
  const user = cleanEnv(process.env.EMAIL_USER);
  const pass = cleanEnv(process.env.EMAIL_PASS);
  const service = cleanEnv(process.env.EMAIL_SERVICE) || 'gmail';

  return nodemailer.createTransport({
    service,
    auth: { user, pass },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function getFromEmail(): string {
  const user = cleanEnv(process.env.EMAIL_USER) || 'no-reply@pulsestore.local';
  return `"PulseStore" <${user}>`;
}

const APP_URL = (
  cleanEnv(process.env.NEXT_PUBLIC_APP_URL) || 'https://puls-store.vercel.app'
).replace(/\/+$/, '');

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  try {
    const user = cleanEnv(process.env.EMAIL_USER);
    const pass = cleanEnv(process.env.EMAIL_PASS);
    if (!user || !pass) return false;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to,
      subject: 'Welcome to PulseStore — Account Confirmed',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 16px; color: #09090b;">
          <div style="margin-bottom: 24px;">
            <span style="display: inline-block; background: #ea580c; color: #ffffff; font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 6px;">PS</span>
            <span style="font-weight: 700; font-size: 16px; margin-left: 8px;">PulseStore</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 12px;">Welcome, ${name || 'Shopper'}.</h2>
          <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px;">
            Your PulseStore account has been created. You can now shop our curated collection of precision hardware, acoustic gear, and minimalist workspace essentials, and track all orders directly from your account.
          </p>
          <a href="${APP_URL}/products" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600;">
            Explore Collection
          </a>
          <p style="font-size: 11px; color: #a1a1aa; margin-top: 32px; border-top: 1px solid #f4f4f5; padding-top: 16px;">
            © ${new Date().getFullYear()} PulseStore Inc. Precision Goods & Hardware.
          </p>
        </div>
      `,
    });
    console.log(`📧 Welcome email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    return false;
  }
}

export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: { quantity: number; price: number; product?: { name: string } }[];
}): Promise<boolean> {
  try {
    const user = cleanEnv(process.env.EMAIL_USER);
    const pass = cleanEnv(process.env.EMAIL_PASS);
    if (!user || !pass) return false;

    const transporter = getTransporter();
    const itemsHtml = order.items
      .map(
        i => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5; font-size: 13px; color: #18181b;">
            ${i.product?.name || 'Item'} × ${i.quantity}
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5; font-size: 13px; font-family: monospace; text-align: right; color: #09090b; font-weight: 600;">
            $${(Number(i.price) * i.quantity).toFixed(2)}
          </td>
        </tr>`
      )
      .join('');

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 16px; color: #09090b;">
        <div style="margin-bottom: 24px;">
          <span style="display: inline-block; background: #ea580c; color: #ffffff; font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 6px;">PS</span>
          <span style="font-weight: 700; font-size: 16px; margin-left: 8px;">PulseStore</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">Thank you for your order, ${order.customerName}!</h2>
        <p style="font-size: 13px; color: #52525b; margin: 0 0 20px;">
          We have received your order and our fulfillment team is preparing your items.
        </p>
        <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; font-weight: 600;">Order Reference</div>
          <div style="font-size: 18px; font-family: monospace; font-weight: 700; margin-top: 4px;">${order.orderNumber}</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${itemsHtml}
          <tr>
            <td style="padding-top: 12px; font-size: 14px; font-weight: 700;">Total Paid</td>
            <td style="padding-top: 12px; font-size: 16px; font-family: monospace; font-weight: 700; text-align: right;">$${Number(order.total).toFixed(2)}</td>
          </tr>
        </table>
        <a href="${APP_URL}/orders?order=${order.orderNumber}" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600;">
          Track Order Status
        </a>
      </div>
    `;

    // Send receipt to customer (and Bcc store admin email so admin also receives email copy)
    const recipients = new Set<string>([order.customerEmail.toLowerCase()]);
    if (user) recipients.add(user.toLowerCase());

    await transporter.sendMail({
      from: getFromEmail(),
      to: [...recipients].join(', '),
      subject: `Order Confirmed — ${order.orderNumber} ($${Number(order.total).toFixed(2)}) | PulseStore`,
      html: htmlBody,
    });
    console.log(`📧 Order confirmation email sent to ${[...recipients].join(', ')}`);
    return true;
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
    return false;
  }
}

export async function sendOrderStatusEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
}): Promise<boolean> {
  try {
    const user = cleanEnv(process.env.EMAIL_USER);
    const pass = cleanEnv(process.env.EMAIL_PASS);
    if (!user || !pass) return false;

    const transporter = getTransporter();
    const recipients = new Set<string>([order.customerEmail.toLowerCase()]);
    if (user) recipients.add(user.toLowerCase());

    await transporter.sendMail({
      from: getFromEmail(),
      to: [...recipients].join(', '),
      subject: `Order Update: ${order.orderNumber} is now ${order.status} | PulseStore`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 16px; color: #09090b;">
          <div style="margin-bottom: 24px;">
            <span style="display: inline-block; background: #ea580c; color: #ffffff; font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 6px;">PS</span>
            <span style="font-weight: 700; font-size: 16px; margin-left: 8px;">PulseStore</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px;">Order Status Updated: ${order.status}</h2>
          <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
            Hi ${order.customerName}, your order <strong>${order.orderNumber}</strong> ($${Number(order.total).toFixed(2)}) status has been updated to <strong>${order.status}</strong>.
          </p>
          <a href="${APP_URL}/orders?order=${order.orderNumber}" style="display: inline-block; margin-top: 16px; background: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600;">
            View Live Order Status
          </a>
        </div>
      `,
    });
    console.log(`📧 Order status update email sent to ${[...recipients].join(', ')}`);
    return true;
  } catch (err) {
    console.error('Failed to send order status email:', err);
    return false;
  }
}

export async function sendRoleUpdatedEmail(user: {
  email: string;
  name?: string | null;
  role: string;
}): Promise<boolean> {
  try {
    if (!user.email || user.email.endsWith('@telegram.local')) return false;
    const smtpUser = cleanEnv(process.env.EMAIL_USER);
    const smtpPass = cleanEnv(process.env.EMAIL_PASS);
    if (!smtpUser || !smtpPass) return false;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromEmail(),
      to: user.email,
      subject: `PulseStore — Your Account Role is now ${user.role}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 16px; color: #09090b;">
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px;">Account Permissions Updated</h2>
          <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
            Hello ${user.name || user.email}, your PulseStore account role has been updated to <strong>${user.role}</strong>.
            ${
              user.role === 'ADMIN'
                ? 'You now have full access to the PulseStore Operations Bot and Admin Mini App inside Telegram.'
                : ''
            }
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Failed to send role updated email:', err);
    return false;
  }
}
