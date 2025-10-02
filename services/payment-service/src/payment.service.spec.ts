import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentService } from './services/payment.service';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { FraudService } from './services/fraud.service';
import { EventService } from './services/event.service';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { TransactionEvent } from './entities/transaction-event.entity';
import { Customer } from './entities/customer.entity';
import { PaymentMethod } from './entities/payment-method.entity';

describe('PaymentService', () => {
  let service: PaymentService;
  let transactionRepository: Repository<Transaction>;
  let paymentGatewayService: PaymentGatewayService;
  let fraudService: FraudService;

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockPaymentGatewayService = {
    authorizePayment: jest.fn(),
    capturePayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const mockFraudService = {
    checkTransaction: jest.fn(),
  };

  const mockEventService = {
    publishEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(TransactionEvent),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: {},
        },
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: {},
        },
        {
          provide: PaymentGatewayService,
          useValue: mockPaymentGatewayService,
        },
        {
          provide: FraudService,
          useValue: mockFraudService,
        },
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    paymentGatewayService = module.get<PaymentGatewayService>(PaymentGatewayService);
    fraudService = module.get<FraudService>(FraudService);
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const createPaymentDto = {
        merchantId: 'merchant-123',
        amount: 1000,
        currency: 'USD',
        paymentMethod: {
          type: 'card',
          token: 'tok_visa_4242',
        },
        customer: {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const mockTransaction = {
        id: 'txn-123',
        ...createPaymentDto,
        status: TransactionStatus.PENDING,
      };

      const mockGatewayResponse = {
        transactionId: 'gw_txn_123',
        status: 'authorized',
        amount: 1000,
        currency: 'USD',
      };

      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);
      mockFraudService.checkTransaction.mockResolvedValue({
        action: 'allow',
        score: 10,
      });
      mockPaymentGatewayService.authorizePayment.mockResolvedValue(mockGatewayResponse);

      const result = await service.createPayment(createPaymentDto);

      expect(mockTransactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId: createPaymentDto.merchantId,
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency,
          status: TransactionStatus.PENDING,
        })
      );
      expect(mockFraudService.checkTransaction).toHaveBeenCalledWith(mockTransaction);
      expect(mockPaymentGatewayService.authorizePayment).toHaveBeenCalled();
    });

    it('should block payment if fraud detected', async () => {
      const createPaymentDto = {
        merchantId: 'merchant-123',
        amount: 10000,
        currency: 'USD',
        paymentMethod: {
          type: 'card',
          token: 'tok_visa_4242',
        },
      };

      const mockTransaction = {
        id: 'txn-123',
        ...createPaymentDto,
        status: TransactionStatus.PENDING,
      };

      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);
      mockFraudService.checkTransaction.mockResolvedValue({
        action: 'block',
        score: 95,
        reason: 'High risk transaction',
      });

      await expect(service.createPayment(createPaymentDto)).rejects.toThrow(
        'Transaction blocked by fraud detection'
      );
    });

    it('should handle payment gateway failures', async () => {
      const createPaymentDto = {
        merchantId: 'merchant-123',
        amount: 1000,
        currency: 'USD',
        paymentMethod: {
          type: 'card',
          token: 'tok_declined',
        },
      };

      const mockTransaction = {
        id: 'txn-123',
        ...createPaymentDto,
        status: TransactionStatus.PENDING,
      };

      mockTransactionRepository.create.mockReturnValue(mockTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockTransaction);
      mockFraudService.checkTransaction.mockResolvedValue({
        action: 'allow',
        score: 10,
      });
      mockPaymentGatewayService.authorizePayment.mockRejectedValue(
        new Error('Insufficient funds')
      );

      await expect(service.createPayment(createPaymentDto)).rejects.toThrow(
        'Payment authorization failed'
      );
    });
  });

  describe('capturePayment', () => {
    it('should capture an authorized payment', async () => {
      const transactionId = 'txn-123';
      const merchantId = 'merchant-123';
      const captureDto = { amount: 1000 };

      const mockTransaction = {
        id: transactionId,
        merchantId,
        amount: 1000,
        status: TransactionStatus.AUTHORIZED,
        gatewayTransactionId: 'gw_txn_123',
      };

      const mockGatewayResponse = {
        transactionId: 'gw_txn_123',
        status: 'captured',
        amount: 1000,
        currency: 'USD',
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockPaymentGatewayService.capturePayment.mockResolvedValue(mockGatewayResponse);

      await service.capturePayment(transactionId, captureDto, merchantId);

      expect(mockPaymentGatewayService.capturePayment).toHaveBeenCalledWith(
        'gw_txn_123',
        1000
      );
    });

    it('should reject capture for non-authorized transactions', async () => {
      const transactionId = 'txn-123';
      const merchantId = 'merchant-123';
      const captureDto = { amount: 1000 };

      const mockTransaction = {
        id: transactionId,
        merchantId,
        status: TransactionStatus.FAILED,
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      await expect(
        service.capturePayment(transactionId, captureDto, merchantId)
      ).rejects.toThrow('Transaction must be authorized to capture');
    });
  });

  describe('refundPayment', () => {
    it('should refund a captured payment', async () => {
      const transactionId = 'txn-123';
      const merchantId = 'merchant-123';
      const refundDto = { amount: 500, reason: 'Customer request' };

      const mockTransaction = {
        id: transactionId,
        merchantId,
        amount: 1000,
        status: TransactionStatus.CAPTURED,
        gatewayTransactionId: 'gw_txn_123',
        currency: 'USD',
      };

      const mockGatewayResponse = {
        transactionId: 'gw_txn_123',
        refundId: 'rfnd_123',
        status: 'refunded',
        amount: 500,
        currency: 'USD',
      };

      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
      mockPaymentGatewayService.refundPayment.mockResolvedValue(mockGatewayResponse);
      mockTransactionRepository.create.mockReturnValue({});
      mockTransactionRepository.save.mockResolvedValue({});

      await service.refundPayment(transactionId, refundDto, merchantId);

      expect(mockPaymentGatewayService.refundPayment).toHaveBeenCalledWith(
        'gw_txn_123',
        500
      );
    });
  });
});
