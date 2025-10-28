import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiCreateCheckoutSession,
  ApiStripeWebhook,
} from './swagger/stripe.swagger';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @ApiCreateCheckoutSession()
  @UseGuards(AuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() dto: CreateOrderDto,
    @Req() req: AuthenticatedRequest
  ) {
    const user = req.user;
    return await this.stripeService.createCheckoutSessionForVinyls(dto, user);
  }

  @ApiStripeWebhook()
  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string
  ) {
    console.log('[Controller] Webhook endpoint hit');

    if (!signature) {
      console.error('[Controller] Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Body must be a Buffer for signature verification
    if (!Buffer.isBuffer(req.body)) {
      console.error('[Controller] Body is not a Buffer!', {
        type: typeof req.body,
        url: req.originalUrl,
        contentType: req.headers['content-type'],
      });
      throw new BadRequestException(
        'Webhook body must be raw. Body parser misconfigured.'
      );
    }

    console.log('[Controller] Body is valid Buffer, passing to service...');
    await this.stripeService.handleWebhookEvent(req.body, signature);
    console.log(
      '[Controller] Webhook processed successfully, returning response'
    );
    return { received: true };
  }
}
