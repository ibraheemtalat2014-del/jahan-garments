import { Order, GmailNotificationLog } from '../types';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const DEFAULT_OWNER_EMAIL = 'ibraheemtalat2014@gmail.com';
const LOGS_STORAGE_KEY = 'jg_gmail_notifications_log';

// In-memory token cache (strictly adhering to memory cache rule)
let cachedAccessToken: string | null = null;

export class GmailService {
  /**
   * Set or clear the cached Google Workspace OAuth access token
   */
  static setAccessToken(token: string | null) {
    cachedAccessToken = token;
  }

  /**
   * Get the current cached access token
   */
  static getAccessToken(): string | null {
    return cachedAccessToken;
  }

  /**
   * Returns true if a valid access token is currently held in memory
   */
  static isConnected(): boolean {
    return Boolean(cachedAccessToken);
  }

  /**
   * Format and base64url encode an email as RFC 2822
   */
  private static encodeRFC2822(to: string, from: string, subject: string, htmlBody: string): string {
    const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const lines = [
      `From: Jahan Garments Lahore <${from}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlBody,
    ];
    const raw = lines.join('\r\n');
    return btoa(unescape(encodeURIComponent(raw)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Send an RFC 2822 formatted email via Gmail API
   */
  static async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    metadata?: {
      orderNumber?: string;
      type?: GmailNotificationLog['type'];
      recipientType?: GmailNotificationLog['recipientType'];
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = GmailService.getAccessToken();
    const logId = 'glog-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const timestamp = new Date().toISOString();

    if (!token) {
      const queuedLog: GmailNotificationLog = {
        id: logId,
        orderNumber: metadata?.orderNumber,
        recipient: to,
        recipientType: metadata?.recipientType || 'customer',
        subject,
        type: metadata?.type || 'order_placed',
        status: 'queued',
        timestamp,
        details: 'Queued: Sign in with Google as Store Owner (ibraheemtalat2014@gmail.com) in Admin Portal to authorize live Gmail delivery.',
      };
      GmailService.saveLog(queuedLog);
      return {
        success: false,
        error: 'Gmail not connected. Please connect Google Account in Admin Portal.',
      };
    }

    try {
      const senderEmail = DEFAULT_OWNER_EMAIL;
      const rawMessage = GmailService.encodeRFC2822(to, senderEmail, subject, htmlBody);

      const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawMessage }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `Gmail API error HTTP ${res.status}`;
        throw new Error(errMsg);
      }

      const result = await res.json();
      const successLog: GmailNotificationLog = {
        id: logId,
        orderNumber: metadata?.orderNumber,
        recipient: to,
        recipientType: metadata?.recipientType || 'customer',
        subject,
        type: metadata?.type || 'order_placed',
        status: 'sent',
        timestamp,
        details: `Successfully dispatched via Gmail API (Message ID: ${result.id || 'ok'})`,
      };
      GmailService.saveLog(successLog);

      return { success: true, messageId: result.id };
    } catch (err: any) {
      console.error('Gmail sending failed:', err);
      const failLog: GmailNotificationLog = {
        id: logId,
        orderNumber: metadata?.orderNumber,
        recipient: to,
        recipientType: metadata?.recipientType || 'customer',
        subject,
        type: metadata?.type || 'order_placed',
        status: 'failed',
        timestamp,
        details: err.message || 'Network or authorization error while communicating with Gmail API.',
      };
      GmailService.saveLog(failLog);
      return { success: false, error: err.message || 'Failed to send email via Gmail' };
    }
  }

  /**
   * Sends both Customer confirmation email and Store Owner alert email when an order is placed
   */
  static async sendNewOrderNotifications(
    order: Order,
    options?: { ownerEmail?: string }
  ): Promise<{ customerSent: boolean; ownerSent: boolean; errors?: string[] }> {
    const ownerEmail = options?.ownerEmail || DEFAULT_OWNER_EMAIL;
    const errors: string[] = [];

    // 1. Send customer confirmation email
    const customerHtml = GmailService.generateOrderConfirmationTemplate(order, false);
    const customerSubject = `Order Confirmed: ${order.orderNumber} - Jahan Garments Lahore`;
    const customerRes = await GmailService.sendEmail(order.customerEmail, customerSubject, customerHtml, {
      orderNumber: order.orderNumber,
      type: 'order_placed',
      recipientType: 'customer',
    });
    if (!customerRes.success && customerRes.error) {
      errors.push(`Customer email: ${customerRes.error}`);
    }

    // 2. Send owner notification email
    const ownerHtml = GmailService.generateOrderConfirmationTemplate(order, true);
    const ownerSubject = `🚨 New Order Received: ${order.orderNumber} (Rs. ${order.totalAmount.toLocaleString()}) - ${order.customerName}`;
    const ownerRes = await GmailService.sendEmail(ownerEmail, ownerSubject, ownerHtml, {
      orderNumber: order.orderNumber,
      type: 'order_placed',
      recipientType: 'owner',
    });
    if (!ownerRes.success && ownerRes.error) {
      errors.push(`Owner alert: ${ownerRes.error}`);
    }

    return {
      customerSent: customerRes.success,
      ownerSent: ownerRes.success,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Sends an order status update email to the customer (e.g. dispatched with InDrive rider)
   */
  static async sendOrderStatusUpdate(
    order: Order,
    newStatus: string,
    note?: string
  ): Promise<{ success: boolean; error?: string }> {
    const html = GmailService.generateStatusUpdateTemplate(order, newStatus, note);
    const subject = `Order Update #${order.orderNumber}: ${newStatus.toUpperCase()} - Jahan Garments Lahore`;

    return await GmailService.sendEmail(order.customerEmail, subject, html, {
      orderNumber: order.orderNumber,
      type: newStatus === 'shipped' ? 'dispatched' : 'status_update',
      recipientType: 'customer',
    });
  }

  /**
   * Send a live test email to verify Gmail API integration
   */
  static async sendTestEmail(
    toEmail: string = DEFAULT_OWNER_EMAIL
  ): Promise<{ success: boolean; error?: string }> {
    const timeStr = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 16px;">
        <div style="background: #18181b; padding: 24px; border-radius: 12px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 2px; color: #f59e0b;">JAHAN GARMENTS</h1>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase;">Lahore, Pakistan • Premium Clothing & Tailoring</p>
        </div>
        
        <div style="background: #ffffff; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #e4e4e7;">
          <div style="display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;">
            ✓ GMAIL NOTIFICATION ACTIVE
          </div>
          <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #18181b;">Gmail API Integration Test Succeeded!</h2>
          <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            This test email confirms that your Jahan Garments store is successfully integrated with the <strong>Google Workspace Gmail API</strong>.
          </p>
          <div style="background: #f4f4f5; padding: 14px; border-radius: 8px; font-size: 13px; color: #3f3f46;">
            <div><strong>Store Owner:</strong> ${DEFAULT_OWNER_EMAIL}</div>
            <div style="margin-top: 4px;"><strong>Dispatch Location:</strong> Lahore, Punjab, Pakistan</div>
            <div style="margin-top: 4px;"><strong>Timestamp:</strong> ${timeStr}</div>
          </div>
          <p style="color: #71717a; font-size: 12px; margin-top: 16px; line-height: 1.5;">
            Every customer checkout and InDrive rider dispatch will now generate and dispatch live email notifications directly to the customer and store owner.
          </p>
        </div>
      </div>
    `;

    return await GmailService.sendEmail(toEmail, `Jahan Garments - Gmail API Test Notification (${timeStr})`, html, {
      type: 'test',
      recipientType: 'owner',
    });
  }

  /**
   * Fetch current Gmail user profile using the active token
   */
  static async getGmailProfile(): Promise<{ emailAddress: string; messagesTotal?: number } | null> {
    const token = GmailService.getAccessToken();
    if (!token) return null;

    try {
      const res = await fetch(`${GMAIL_API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Local storage log persistence
   */
  static getLogs(): GmailNotificationLog[] {
    try {
      const data = localStorage.getItem(LOGS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveLog(log: GmailNotificationLog) {
    try {
      const logs = GmailService.getLogs();
      logs.unshift(log);
      // Keep up to 50 recent records
      if (logs.length > 50) logs.length = 50;
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Could not save notification log to local storage:', e);
    }
  }

  static clearLogs() {
    localStorage.removeItem(LOGS_STORAGE_KEY);
  }

  // -------------------------------------------------------------
  // HTML Template Generators
  // -------------------------------------------------------------

  private static generateOrderConfirmationTemplate(order: Order, isForOwner: boolean): string {
    const address = order.shippingAddress;
    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f4f4f5;">
          <div style="font-weight: 600; color: #18181b; font-size: 14px;">${item.productName}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 2px;">
            Size: <strong style="color: #27272a;">${item.size}</strong> • Color: <strong style="color: #27272a;">${item.color}</strong>
          </div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f4f4f5; text-align: center; color: #3f3f46; font-size: 13px;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f4f4f5; text-align: right; color: #18181b; font-weight: 600; font-size: 14px;">
          Rs. ${(item.unitPrice * item.quantity).toLocaleString()}
        </td>
      </tr>
    `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Jahan Garments Order Notification</title>
      </head>
      <body style="margin: 0; padding: 20px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #18181b; padding: 28px 24px; text-align: center;">
              <h1 style="margin: 0; color: #f59e0b; font-size: 24px; letter-spacing: 3px; font-weight: 700;">JAHAN GARMENTS</h1>
              <p style="margin: 6px 0 0 0; color: #d4d4d8; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Lahore, Pakistan • Premium Clothing & Tailoring</p>
            </td>
          </tr>

          <!-- Notification Hero -->
          <tr>
            <td style="padding: 24px 28px; border-bottom: 1px solid #f1f5f9;">
              <div style="display: inline-block; background-color: ${isForOwner ? '#fef3c7' : '#dcfce7'}; color: ${isForOwner ? '#92400e' : '#166534'}; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${isForOwner ? '🚨 Store Owner Order Alert' : '✓ Order Confirmed'}
              </div>
              <h2 style="margin: 12px 0 6px 0; font-size: 20px; color: #0f172a;">
                ${isForOwner ? `New Order #${order.orderNumber} Placed` : `Thank You for Your Order, ${order.customerName}!`}
              </h2>
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                ${
                  isForOwner
                    ? `A customer has completed checkout with Cash on Delivery (COD) for delivery in ${address.area}, Lahore.`
                    : 'We have received your order and our Lahore team is preparing your package for InDrive rider dispatch.'
                }
              </p>
            </td>
          </tr>

          <!-- Delivery & Customer Information -->
          <tr>
            <td style="padding: 20px 28px; background-color: #fafaf9; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Customer Details</div>
                    <div style="font-size: 14px; font-weight: 600; color: #1e293b;">${order.customerName}</div>
                    <div style="font-size: 13px; color: #475569; margin-top: 2px;">📞 ${order.customerPhone}</div>
                    <div style="font-size: 13px; color: #475569; margin-top: 2px;">✉️ ${order.customerEmail}</div>
                  </td>
                  <td width="50%" valign="top" style="padding-left: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Lahore Delivery Address</div>
                    <div style="font-size: 13px; font-weight: 600; color: #1e293b;">${address.area}, Lahore</div>
                    <div style="font-size: 13px; color: #475569; margin-top: 2px;">${address.streetAddress}</div>
                    ${address.landmark ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">Near: ${address.landmark}</div>` : ''}
                  </td>
                </tr>
                ${
                  address.deliveryInstructions
                    ? `
                <tr>
                  <td colspan="2" style="padding-top: 14px;">
                    <div style="background-color: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #334155;">
                      <strong>Special Rider Note:</strong> ${address.deliveryInstructions}
                    </div>
                  </td>
                </tr>
                `
                    : ''
                }
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 24px 28px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #e2e8f0;">
                    <th align="left" style="padding: 8px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Garment</th>
                    <th align="center" style="padding: 8px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding: 8px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Pricing Summary -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                <tr>
                  <td align="right" style="padding: 4px 8px; font-size: 13px; color: #64748b;">Subtotal:</td>
                  <td width="100" align="right" style="padding: 4px 8px; font-size: 13px; color: #1e293b;">Rs. ${order.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td align="right" style="padding: 4px 8px; font-size: 13px; color: #64748b;">Lahore InDrive Delivery:</td>
                  <td width="100" align="right" style="padding: 4px 8px; font-size: 13px; color: #1e293b;">
                    ${order.deliveryFee === 0 ? '<span style="color:#16a34a; font-weight:600;">FREE</span>' : `Rs. ${order.deliveryFee}`}
                  </td>
                </tr>
                ${
                  order.discount > 0
                    ? `
                <tr>
                  <td align="right" style="padding: 4px 8px; font-size: 13px; color: #16a34a;">Promo Discount:</td>
                  <td width="100" align="right" style="padding: 4px 8px; font-size: 13px; color: #16a34a;">-Rs. ${order.discount.toLocaleString()}</td>
                </tr>
                `
                    : ''
                }
                <tr style="border-top: 2px solid #e2e8f0;">
                  <td align="right" style="padding: 10px 8px; font-size: 16px; font-weight: 700; color: #0f172a;">Grand Total (Cash on Delivery):</td>
                  <td width="100" align="right" style="padding: 10px 8px; font-size: 18px; font-weight: 800; color: #b45309;">Rs. ${order.totalAmount.toLocaleString()}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #18181b; padding: 20px 24px; text-align: center; color: #a1a1aa; font-size: 12px; line-height: 1.6;">
              <div><strong>Jahan Garments Lahore</strong> • Gulberg III, Main Boulevard, Lahore, Pakistan</div>
              <div style="margin-top: 4px;">Direct Store Owner Contact: <a href="mailto:${DEFAULT_OWNER_EMAIL}" style="color: #f59e0b; text-decoration: none;">${DEFAULT_OWNER_EMAIL}</a></div>
              <div style="margin-top: 4px; font-size: 11px; color: #71717a;">This is an automated order confirmation notification sent via Gmail.</div>
            </td>
          </tr>

        </table>
      </body>
      </html>
    `;
  }

  private static generateStatusUpdateTemplate(order: Order, newStatus: string, note?: string): string {
    const statusTitles: Record<string, string> = {
      confirmed: 'Order Confirmed by Lahore Dispatch',
      processing: 'Garments Being Packaged & Inspected',
      shipped: 'Dispatched with InDrive Rider 🛵',
      delivered: 'Order Delivered Successfully 🎉',
      cancelled: 'Order Status Update',
    };

    const statusTitle = statusTitles[newStatus] || `Order Status Updated: ${newStatus}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${statusTitle}</title>
      </head>
      <body style="margin: 0; padding: 20px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #18181b; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #f59e0b; font-size: 22px; letter-spacing: 2px;">JAHAN GARMENTS</h1>
              <p style="margin: 4px 0 0 0; color: #d4d4d8; font-size: 11px; text-transform: uppercase;">Lahore, Pakistan</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px;">
              <div style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
                ${newStatus.toUpperCase()}
              </div>
              <h2 style="margin: 12px 0 8px 0; font-size: 20px; color: #0f172a;">${statusTitle}</h2>
              <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.5;">
                Dear ${order.customerName}, your order <strong>#${order.orderNumber}</strong> has an update regarding your delivery in <strong>${order.shippingAddress.area}, Lahore</strong>.
              </p>

              ${
                note
                  ? `
              <div style="background-color: #f1f5f9; padding: 14px 18px; border-radius: 10px; margin: 16px 0; border-left: 4px solid #3b82f6;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Rider / Dispatch Note</div>
                <div style="font-size: 14px; color: #1e293b; font-weight: 500;">${note}</div>
              </div>
              `
                  : ''
              }

              <div style="background-color: #fafaf9; padding: 16px; border-radius: 10px; border: 1px solid #e7e5e4; margin-top: 16px;">
                <div style="font-size: 13px; color: #44403c;"><strong>Total Payable at Doorstep:</strong> Rs. ${order.totalAmount.toLocaleString()} (COD)</div>
                <div style="font-size: 13px; color: #44403c; margin-top: 4px;"><strong>Destination:</strong> ${order.shippingAddress.streetAddress}, ${order.shippingAddress.area}, Lahore</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #18181b; padding: 16px 24px; text-align: center; color: #a1a1aa; font-size: 11px;">
              Questions? Contact Jahan Garments Lahore at <a href="mailto:${DEFAULT_OWNER_EMAIL}" style="color: #f59e0b;">${DEFAULT_OWNER_EMAIL}</a>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
