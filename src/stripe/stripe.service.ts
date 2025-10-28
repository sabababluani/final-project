import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { VinylsService } from '../vinyls/vinyls.service';
import { MailService } from '../mail/mail.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { CheckoutSessionInterface } from './interfaces/stripe.interface';
import { OrdersService } from '../orders/orders.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { LogLevel } from '../system-logs/dto/create-system-log.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private endpointSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly vinylsService: VinylsService,
    private readonly mailService: MailService,
    private readonly ordersService: OrdersService,
    private readonly systemLogs: SystemLogsService
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });

    this.endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET'
    )!;
  }

  async createCheckoutSessionForVinyls(dto: CreateOrderDto, user: User) {
    const { items, currency } = dto;

    if (!items?.length) {
      throw new BadRequestException('No items provided');
    }

    const currencyCode = currency.toLowerCase() || 'usd';

    const vinyls = await this.loadVinylsWithQuantities(items);

    const lineItems = vinyls.map(({ vinyl, quantity }) => ({
      name: `${vinyl.name} — ${vinyl.authorName}`,
      amount: Math.round(Number(vinyl.price) * 100),
      currency: currencyCode,
      image: vinyl.image,
      quantity,
      vinylId: vinyl.id,
    }));

    const session = await this.createCheckoutSession({
      items: lineItems,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      customerEmail: user.email,
    });

    return { sessionId: session.url };
  }

  async handleWebhookEvent(rawBody: Buffer, signature: string) {
    console.log(`[Webhook] Constructing webhook event from signature...`);
    try {
      const event = this.constructWebhookEvent(rawBody, signature);
      console.log(
        `[Webhook] Event constructed successfully. Type: ${event.type}`
      );

      await this.processWebhookEvent(event);
      console.log(`[Webhook] Event processed successfully`);
    } catch (error) {
      console.error(`[Webhook] Fatal error processing webhook:`, error);
      await this.systemLogs.createLog({
        level: LogLevel.ERROR,
        message: `Webhook processing error: ${error.message} - Stack: ${error.stack}`,
      });
      throw error;
    }
  }

  private async loadVinylsWithQuantities(items: CreateOrderItemDto[]) {
    return Promise.all(
      items.map(async (item) => {
        const vinyl = await this.vinylsService.findOne(item.vinylId);
        return { vinyl, quantity: item.quantity };
      })
    );
  }

  private constructWebhookEvent(rawBody: Buffer, signature: string) {
    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.endpointSecret
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  private async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;

      default:
        await this.systemLogs.createLog({
          level: LogLevel.INFO,
          message: `Unhandled Stripe event type: ${event.type}`,
        });
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ) {
    try {
      console.log(
        `[Webhook] Starting checkout session handling: ${session.id}`
      );

      await this.systemLogs.createLog({
        level: LogLevel.INFO,
        message: `Checkout session completed ${session.id}`,
      });

      console.log(`[Webhook] Retrieving session with line items...`);
      const sessionWithLineItems = await this.stripe.checkout.sessions.retrieve(
        session.id,
        { expand: ['line_items', 'line_items.data.price.product'] }
      );
      console.log(
        `[Webhook] Session retrieved, line items count: ${sessionWithLineItems.line_items?.data?.length || 0}`
      );

      const lineItems = sessionWithLineItems.line_items?.data || [];

      console.log(`[Webhook] Mapping line items to order items...`);
      const items = lineItems.map((item) => {
        const product = item.price?.product as Stripe.Product;
        console.log(`[Webhook] Item: ${JSON.stringify(product?.metadata)}`);
        return {
          vinylId: Number(product.metadata?.vinylId),
          quantity: item.quantity ?? 1,
          price: (item.price?.unit_amount ?? 0) / 100,
        };
      });

      console.log(
        `[Webhook] Creating order with items:`,
        JSON.stringify(items, null, 2)
      );
      await this.ordersService.createOrder({
        email: session.customer_email!,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        totalAmount: (session.amount_total ?? 0) / 100,
        items,
      });
      console.log(`[Webhook] Order created successfully`);

      // Send email asynchronously without blocking the webhook response
      if (session.customer_email) {
        console.log(
          `[Webhook] Queueing success email to ${session.customer_email}...`
        );
        // Fire and forget - don't await this to prevent webhook timeout
        this.sendSuccessEmail(session)
          .then(() => {
            console.log(
              `[Webhook] Email sent successfully to ${session.customer_email}`
            );
          })
          .catch((error) => {
            console.error(`[Webhook] Error sending email:`, error);
            // Log but don't fail the webhook
            this.systemLogs.createLog({
              level: LogLevel.ERROR,
              message: `Failed to send success email for session ${session.id}: ${error.message}`,
            });
          });
      }

      await this.systemLogs.createLog({
        level: LogLevel.INFO,
        message: `Order created successfully for session ${session.id}`,
      });

      console.log(`[Webhook] Checkout session handling completed successfully`);
    } catch (error) {
      console.error(`[Webhook] Error in checkout session handler:`, error);
      console.error(`[Webhook] Error stack:`, error.stack);

      await this.systemLogs.createLog({
        level: LogLevel.ERROR,
        message: `Error handling checkout session ${session.id}: ${error.message} - Stack: ${error.stack}`,
      });
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ) {
    await this.systemLogs.createLog({
      level: LogLevel.INFO,
      message: `PaymentIntent succeeded ${paymentIntent.id}`,
    });
  }

  private async createCheckoutSession(
    params: CheckoutSessionInterface
  ): Promise<Stripe.Checkout.Session> {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      params.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: item.currency,
          unit_amount: item.amount,
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : undefined,
            metadata: {
              vinylId: item.vinylId.toString(),
            },
          },
        },
      }));

    try {
      return await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.customerEmail,
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to create checkout session'
      );
    }
  }

  async retrieveSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  async createCustomer(email: string) {
    return this.stripe.customers.create({ email });
  }

  private async sendSuccessEmail(session: Stripe.Checkout.Session) {
    const sessionWithLineItems = await this.stripe.checkout.sessions.retrieve(
      session.id,
      { expand: ['line_items'] }
    );

    const lineItems = sessionWithLineItems.line_items?.data || [];

    await this.mailService.sendOrderSuccessEmail(session, lineItems);
  }
}
