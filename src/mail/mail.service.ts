import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { LogLevel } from '../system-logs/dto/create-system-log.dto';
import { SystemLogsService } from '../system-logs/system-logs.service';
import Stripe from 'stripe';

@Injectable()
export class MailService {
  private mailTransporter: Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly systemLogs: SystemLogsService
  ) {
    this.mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendOrderSuccessEmail(
    session: Stripe.Checkout.Session,
    lineItems: Stripe.LineItem[]
  ) {
    try {
      const itemsHtml = lineItems
        .map(
          (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${((item.amount_total || 0) / 100).toFixed(2)}</td>
        </tr>
      `
        )
        .join('');

      const totalAmount = ((session.amount_total || 0) / 100).toFixed(2);

      const mailOptions = {
        from: this.configService.get<string>('EMAIL_USER'),
        to: session.customer_email!,
        subject: '🎉 Payment Successful - Order Confirmation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4CAF50; text-align: center;">✅ Payment Successful!</h1>
            <p style="font-size: 16px; color: #333;">
              Thank you for your purchase! Your order has been confirmed.
            </p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">Order Details</h2>
              <p><strong>Order ID:</strong> ${session.id}</p>
              <p><strong>Payment Status:</strong> <span style="color: #4CAF50;">Paid</span></p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; font-weight: bold; color: #4CAF50;">${totalAmount}</td>
                </tr>
              </tfoot>
            </table>

            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
              If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
        `,
      };

      console.log(
        `[Mail] Attempting to send email to ${session.customer_email}...`
      );
      const result = await this.mailTransporter.sendMail(mailOptions);
      console.log(`[Mail] Email sent successfully:`, result.messageId);

      await this.systemLogs.createLog({
        level: LogLevel.INFO,
        message: `Success email sent to: ${session.customer_email}`,
      });
    } catch (error) {
      console.error(`[Mail] Failed to send email:`, error);
      console.error(`[Mail] Error details:`, error.message, error.stack);

      await this.systemLogs.createLog({
        level: LogLevel.ERROR,
        message: `Error sending success email to ${session.customer_email}: ${error.message}`,
      });

      // Re-throw the error so it can be handled by the caller
      throw error;
    }
  }
}
