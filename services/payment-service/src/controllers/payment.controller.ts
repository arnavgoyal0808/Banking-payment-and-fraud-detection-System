import { Controller, Post, Get, Body, Param, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, CapturePaymentDto, RefundPaymentDto } from '../dto/payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Headers('merchantId') merchantId: string
  ) {
    if (!merchantId) {
      throw new HttpException('Merchant ID is required', HttpStatus.BAD_REQUEST);
    }

    return this.paymentService.createPayment({
      ...createPaymentDto,
      merchantId,
    });
  }

  @Post(':id/capture')
  async capturePayment(
    @Param('id') id: string,
    @Body() capturePaymentDto: CapturePaymentDto,
    @Headers('merchantId') merchantId: string
  ) {
    return this.paymentService.capturePayment(id, capturePaymentDto, merchantId);
  }

  @Post(':id/refund')
  async refundPayment(
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
    @Headers('merchantId') merchantId: string
  ) {
    return this.paymentService.refundPayment(id, refundPaymentDto, merchantId);
  }

  @Get(':id')
  async getPayment(
    @Param('id') id: string,
    @Headers('merchantId') merchantId: string
  ) {
    return this.paymentService.getPayment(id, merchantId);
  }

  @Get()
  async listPayments(@Headers('merchantId') merchantId: string) {
    return this.paymentService.listPayments(merchantId);
  }
}
