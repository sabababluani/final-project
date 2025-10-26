import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import {
  ApiUnauthorized,
  ApiBadRequest,
  ApiInternalError,
} from '../../common/swagger';

export function ApiCreateCheckoutSession() {
  return applyDecorators(
    ApiTags('Stripe'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Create Stripe checkout session',
      description:
        'Creates a Stripe checkout session for purchasing vinyl records. Returns a checkout URL that can be used to redirect the customer to the Stripe payment page.',
    }),
    ApiResponse({
      status: 201,
      description: 'Checkout session created successfully',
      schema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            example: 'https://checkout.stripe.com/pay/cs_test_...',
            description: 'Stripe checkout page URL',
          },
          sessionId: {
            type: 'string',
            example: 'cs_test_a1b2c3d4e5f6...',
            description: 'Stripe session ID',
          },
        },
      },
    }),
    ApiBadRequest(),
    ApiUnauthorized(),
    ApiInternalError()
  );
}

export function ApiStripeWebhook() {
  return applyDecorators(
    ApiTags('Stripe'),
    ApiOperation({
      summary: 'Stripe webhook handler',
      description:
        'Receives and processes webhook events from Stripe. This endpoint is called by Stripe to notify about payment events like successful payments, failed payments, etc.',
    }),
    ApiHeader({
      name: 'stripe-signature',
      description: 'Stripe webhook signature for verification',
      required: true,
    }),
    ApiResponse({
      status: 200,
      description: 'Webhook processed successfully',
      schema: {
        type: 'object',
        properties: {
          received: { type: 'boolean', example: true },
        },
      },
    }),
    ApiBadRequest(),
    ApiInternalError()
  );
}
