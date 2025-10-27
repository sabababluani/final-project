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
    const event = this.constructWebhookEvent(rawBody, signature);

    await this.processWebhookEvent(event);
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
    await this.systemLogs.createLog({
      level: LogLevel.INFO,
      message: `Checkout session completed ${session.id}`,
    });

    const sessionWithLineItems = await this.stripe.checkout.sessions.retrieve(
      session.id,
      { expand: ['line_items', 'line_items.data.price.product'] }
    );

    const lineItems = sessionWithLineItems.line_items?.data || [];

    const items = lineItems.map((item) => {
      const product = item.price?.product as Stripe.Product;
      return {
        vinylId: Number(product.metadata?.vinylId),
        quantity: item.quantity ?? 1,
        price: (item.price?.unit_amount ?? 0) / 100,
      };
    });

    await this.ordersService.createOrder({
      email: session.customer_email!,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      totalAmount: (session.amount_total ?? 0) / 100,
      items,
    });

    if (session.customer_email) {
      await this.sendSuccessEmail(session);
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
