import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

interface PaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: {
    type: string;
    token: string;
  };
  customer?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface GatewayResponse {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  processingFee?: number;
  gatewayFee?: number;
}

@Injectable()
export class PaymentGatewayService {
  private readonly mockFailureRate = 0.05; // 5% failure rate for testing

  async authorizePayment(request: PaymentRequest): Promise<GatewayResponse> {
    // Simulate processing delay
    await this.delay(100 + Math.random() * 500);

    // Simulate random failures
    if (Math.random() < this.mockFailureRate) {
      throw new Error('Payment gateway error: Insufficient funds');
    }

    // Mock different payment methods
    const processingFee = this.calculateProcessingFee(request.amount, request.paymentMethod.type);

    return {
      transactionId: `txn_${uuidv4()}`,
      status: 'authorized',
      amount: request.amount,
      currency: request.currency,
      processingFee,
      gatewayFee: processingFee * 0.1,
    };
  }

  async capturePayment(transactionId: string, amount: number): Promise<GatewayResponse> {
    await this.delay(50 + Math.random() * 200);

    if (Math.random() < this.mockFailureRate) {
      throw new Error('Payment gateway error: Capture failed');
    }

    return {
      transactionId,
      status: 'captured',
      amount,
      currency: 'USD', // In real implementation, this would come from the original transaction
    };
  }

  async refundPayment(transactionId: string, amount: number): Promise<GatewayResponse & { refundId: string }> {
    await this.delay(100 + Math.random() * 300);

    if (Math.random() < this.mockFailureRate) {
      throw new Error('Payment gateway error: Refund failed');
    }

    return {
      transactionId,
      refundId: `rfnd_${uuidv4()}`,
      status: 'refunded',
      amount,
      currency: 'USD',
    };
  }

  async voidPayment(transactionId: string): Promise<GatewayResponse> {
    await this.delay(50 + Math.random() * 150);

    return {
      transactionId,
      status: 'voided',
      amount: 0,
      currency: 'USD',
    };
  }

  private calculateProcessingFee(amount: number, paymentType: string): number {
    // Mock fee calculation based on payment type
    const feeRates = {
      card: 0.029, // 2.9%
      bank_account: 0.008, // 0.8%
      wallet: 0.025, // 2.5%
    };

    const rate = feeRates[paymentType] || feeRates.card;
    return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Multi-currency support
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Mock exchange rates - in production, integrate with real forex API
    const mockRates = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'USD-JPY': 110.0,
      'EUR-USD': 1.18,
      'GBP-USD': 1.37,
      'JPY-USD': 0.009,
    };

    const key = `${fromCurrency}-${toCurrency}`;
    return mockRates[key] || 1.0;
  }

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return Math.round(amount * rate * 100) / 100;
  }
}
