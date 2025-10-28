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

    await this.stripeService.handleWebhookEvent(req.body, signature);

    return { received: true };
  }
}
