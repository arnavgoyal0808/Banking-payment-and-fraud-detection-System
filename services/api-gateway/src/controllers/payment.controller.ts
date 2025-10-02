import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ProxyService } from '../services/proxy.service';
import { CreatePaymentDto, CapturePaymentDto, RefundPaymentDto } from '../dto/payment.dto';

@ApiTags('payments')
@Controller('api/payments')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Req() req: any) {
    return this.proxyService.forwardRequest(
      'payment-service',
      'POST',
      '/payments',
      createPaymentDto,
      { merchantId: req.merchant.id }
    );
  }

  @Post(':id/capture')
  @ApiOperation({ summary: 'Capture a payment' })
  async capturePayment(
    @Param('id') id: string,
    @Body() capturePaymentDto: CapturePaymentDto,
    @Req() req: any
  ) {
    return this.proxyService.forwardRequest(
      'payment-service',
      'POST',
      `/payments/${id}/capture`,
      capturePaymentDto,
      { merchantId: req.merchant.id }
    );
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  async refundPayment(
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
    @Req() req: any
  ) {
    return this.proxyService.forwardRequest(
      'payment-service',
      'POST',
      `/payments/${id}/refund`,
      refundPaymentDto,
      { merchantId: req.merchant.id }
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  async getPayment(@Param('id') id: string, @Req() req: any) {
    return this.proxyService.forwardRequest(
      'payment-service',
      'GET',
      `/payments/${id}`,
      null,
      { merchantId: req.merchant.id }
    );
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  async listPayments(@Req() req: any) {
    return this.proxyService.forwardRequest(
      'payment-service',
      'GET',
      '/payments',
      null,
      { merchantId: req.merchant.id }
    );
  }
}
