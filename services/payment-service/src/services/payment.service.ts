import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from '../entities/transaction.entity';
import { TransactionEvent } from '../entities/transaction-event.entity';
import { Customer } from '../entities/customer.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { PaymentGatewayService } from './payment-gateway.service';
import { FraudService } from './fraud.service';
import { EventService } from './event.service';
import { CreatePaymentDto, CapturePaymentDto, RefundPaymentDto } from '../dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionEvent)
    private transactionEventRepository: Repository<TransactionEvent>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    private paymentGatewayService: PaymentGatewayService,
    private fraudService: FraudService,
    private eventService: EventService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto & { merchantId: string }) {
    // Create or get customer
    let customer: Customer;
    if (createPaymentDto.customer) {
      customer = await this.customerRepository.findOne({
        where: { email: createPaymentDto.customer.email }
      });

      if (!customer) {
        customer = this.customerRepository.create(createPaymentDto.customer);
        customer = await this.customerRepository.save(customer);
      }
    }

    // Create or get payment method
    let paymentMethod: PaymentMethod;
    if (createPaymentDto.paymentMethod) {
      paymentMethod = this.paymentMethodRepository.create({
        ...createPaymentDto.paymentMethod,
        customerId: customer?.id,
      });
      paymentMethod = await this.paymentMethodRepository.save(paymentMethod);
    }

    // Create transaction
    const transaction = this.transactionRepository.create({
      merchantId: createPaymentDto.merchantId,
      customerId: customer?.id,
      paymentMethodId: paymentMethod?.id,
      amount: createPaymentDto.amount,
      currency: createPaymentDto.currency,
      description: createPaymentDto.description,
      metadata: createPaymentDto.metadata,
      referenceId: createPaymentDto.referenceId,
      status: TransactionStatus.PENDING,
      type: TransactionType.PAYMENT,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Fraud check
    const fraudResult = await this.fraudService.checkTransaction(savedTransaction);
    if (fraudResult.action === 'block') {
      await this.updateTransactionStatus(savedTransaction.id, TransactionStatus.FAILED, {
        reason: 'Blocked by fraud detection',
        fraudScore: fraudResult.score,
      });
      throw new HttpException('Transaction blocked by fraud detection', HttpStatus.FORBIDDEN);
    }

    // Process payment through gateway
    try {
      const gatewayResult = await this.paymentGatewayService.authorizePayment({
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        paymentMethod: createPaymentDto.paymentMethod,
        customer: createPaymentDto.customer,
      });

      await this.updateTransactionStatus(
        savedTransaction.id,
        TransactionStatus.AUTHORIZED,
        gatewayResult
      );

      // Publish event
      await this.eventService.publishEvent('payment.authorized', {
        transactionId: savedTransaction.id,
        merchantId: createPaymentDto.merchantId,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
      });

      return this.getTransactionWithDetails(savedTransaction.id);
    } catch (error) {
      await this.updateTransactionStatus(savedTransaction.id, TransactionStatus.FAILED, {
        error: error.message,
      });
      throw new HttpException('Payment authorization failed', HttpStatus.BAD_REQUEST);
    }
  }

  async capturePayment(id: string, captureDto: CapturePaymentDto, merchantId: string) {
    const transaction = await this.getTransaction(id, merchantId);

    if (transaction.status !== TransactionStatus.AUTHORIZED) {
      throw new HttpException('Transaction must be authorized to capture', HttpStatus.BAD_REQUEST);
    }

    const captureAmount = captureDto.amount || transaction.amount;

    try {
      const gatewayResult = await this.paymentGatewayService.capturePayment(
        transaction.gatewayTransactionId,
        captureAmount
      );

      await this.updateTransactionStatus(id, TransactionStatus.CAPTURED, gatewayResult);

      await this.eventService.publishEvent('payment.captured', {
        transactionId: id,
        merchantId,
        amount: captureAmount,
        currency: transaction.currency,
      });

      return this.getTransactionWithDetails(id);
    } catch (error) {
      throw new HttpException('Payment capture failed', HttpStatus.BAD_REQUEST);
    }
  }

  async refundPayment(id: string, refundDto: RefundPaymentDto, merchantId: string) {
    const transaction = await this.getTransaction(id, merchantId);

    if (transaction.status !== TransactionStatus.CAPTURED) {
      throw new HttpException('Transaction must be captured to refund', HttpStatus.BAD_REQUEST);
    }

    const refundAmount = refundDto.amount || transaction.amount;

    try {
      const gatewayResult = await this.paymentGatewayService.refundPayment(
        transaction.gatewayTransactionId,
        refundAmount
      );

      // Create refund transaction
      const refundTransaction = this.transactionRepository.create({
        merchantId,
        customerId: transaction.customerId,
        paymentMethodId: transaction.paymentMethodId,
        amount: -refundAmount,
        currency: transaction.currency,
        status: TransactionStatus.CAPTURED,
        type: TransactionType.REFUND,
        gatewayTransactionId: gatewayResult.refundId,
        referenceId: transaction.id,
        description: refundDto.reason || 'Refund',
      });

      await this.transactionRepository.save(refundTransaction);

      await this.eventService.publishEvent('payment.refunded', {
        transactionId: id,
        refundTransactionId: refundTransaction.id,
        merchantId,
        amount: refundAmount,
        currency: transaction.currency,
      });

      return refundTransaction;
    } catch (error) {
      throw new HttpException('Payment refund failed', HttpStatus.BAD_REQUEST);
    }
  }

  async getPayment(id: string, merchantId: string) {
    return this.getTransactionWithDetails(id, merchantId);
  }

  async listPayments(merchantId: string) {
    return this.transactionRepository.find({
      where: { merchantId },
      relations: ['events', 'customer', 'paymentMethod'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  private async getTransaction(id: string, merchantId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, merchantId },
    });

    if (!transaction) {
      throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
    }

    return transaction;
  }

  private async getTransactionWithDetails(id: string, merchantId?: string) {
    const where = merchantId ? { id, merchantId } : { id };
    return this.transactionRepository.findOne({
      where,
      relations: ['events', 'customer', 'paymentMethod'],
    });
  }

  private async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    gatewayResponse?: any
  ) {
    await this.transactionRepository.update(id, {
      status,
      gatewayTransactionId: gatewayResponse?.transactionId,
    });

    const event = this.transactionEventRepository.create({
      transactionId: id,
      eventType: `transaction.${status}`,
      status,
      gatewayResponse,
    });

    await this.transactionEventRepository.save(event);
  }
}
