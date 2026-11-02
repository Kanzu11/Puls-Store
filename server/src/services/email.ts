import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  const service = process.env.EMAIL_SERVICE || 'gmail';

  return nodemailer.createTransport({
    service,
    auth: { user, pass },
  });
}

const FROM_EMAIL = `"PulseStore" <${process.env.EMAIL_USER || 'no-reply@pulsestore.local'}>`;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://puls-store.vercel.app').replace(
  /\/+$/,
  ''
);

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to PulseStore — Account Confirmed',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 16px; color: #09090b;">
          <div style="margin-bottom: 24px;">
            <span style="display: inline-block; background: #09090b; color: #ffffff; font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 6px;">PS</span>
            <span style="font-weight: 700; font-size: 16px; margin-left: 8px;">PulseStore</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 700; margin: 0 0 12px;">Welcome, ${name || 'Shopper'}.</h2>
          <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px;">
            Your PulseStore account has been created. You can now shop our curated collection of precision hardware, acoustic gear, and minimalist workspace essentials, and track all orders directly from your account.
          </p>
          <a href="${APP_URL}/products" style="display: inline-block; background: #09090b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600;">
            Explore Collection
          </a>
          <p style="font-size: 11px; color: #a1a1aa; margin-top: 32px; border-top: 1px solid #f4f4f5; padding-top: 16px;">
            © ${new Date().getFullYear()} PulseStore Inc. Precision Goods & Hardware.
          </p>
        </div>
      `,
    });
    console.log(`📧 Welcome email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

export async function sendOrderConfirmationEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: { quantity: number; price: number; product?: { name: string } }[];
}): Promise<void> {
  try {
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

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.customerEmail,
      subject: `Order Confirmed — ${order.orderNumber} | PulseStore`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 16px; color: #09090b;">
          <div style="margin-bottom: 24px;">
            <span style="display: inline-block; background: #09090b; color: #ffffff; font-weight: 700; font-size: 12px; padding: 6px 10px; border-radius: 6px;">PS</span>
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
          <a href="${APP_URL}/orders?order=${order.orderNumber}" style="display: inline-block; background: #09090b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600;">
            Track Order Status
          </a>
        </div>
      `,
    });
    console.log(`📧 Order confirmation email sent to ${order.customerEmail}`);
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
  }
}

export async function sendOrderStatusEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number;
}): Promise<void> {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: order.customerEmail,
      subject: `Order Update: ${order.orderNumber} is now ${order.status}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 16px; color: #09090b;">
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px;">Order Status Updated</h2>
          <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
            Hi ${order.customerName}, your order <strong>${order.orderNumber}</strong> status has been updated to <strong>${order.status}</strong>.
          </p>
          <a href="${APP_URL}/orders?order=${order.orderNumber}" style="display: inline-block; margin-top: 16px; background: #09090b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 600;">
            View Live Order Status
          </a>
        </div>
      `,
    });
    console.log(`📧 Order status update email sent to ${order.customerEmail}`);
  } catch (err) {
    console.error('Failed to send order status email:', err);
  }
}

export async function sendRoleUpdatedEmail(user: {
  email: string;
  name?: string | null;
  role: string;
}): Promise<void> {
  try {
    if (!user.email || user.email.endsWith('@telegram.local')) return;
    const transporter = getTransporter();
    await transporter.sendMail({
      from: FROM_EMAIL,
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
  } catch (err) {
    console.error('Failed to send role updated email:', err);
  }
}

