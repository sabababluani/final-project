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
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Debug logging for production
    console.log('Webhook received:');
    console.log('  - URL:', req.originalUrl);
    console.log('  - Path:', req.path);
    console.log('  - Body type:', typeof req.body);
    console.log('  - Is Buffer:', Buffer.isBuffer(req.body));
    console.log('  - Content-Type:', req.headers['content-type']);
    
    // Body must be a Buffer for signature verification
    if (!Buffer.isBuffer(req.body)) {
      console.error('Body is not a Buffer! Body parser not configured correctly.');
      throw new BadRequestException(
        'Webhook body must be raw. Body parser misconfigured.'
      );
    }
    
    await this.stripeService.handleWebhookEvent(req.body, signature);
    return { received: true };
  }
}
