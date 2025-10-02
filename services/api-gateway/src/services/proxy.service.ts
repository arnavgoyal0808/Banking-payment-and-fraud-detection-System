import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  private readonly serviceUrls = {
    'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3000',
    'merchant-service': process.env.MERCHANT_SERVICE_URL || 'http://merchant-service:3000',
    'fraud-service': process.env.FRAUD_SERVICE_URL || 'http://fraud-service:3000',
    'settlement-service': process.env.SETTLEMENT_SERVICE_URL || 'http://settlement-service:3000',
  };

  async forwardRequest(
    serviceName: string,
    method: string,
    path: string,
    body?: any,
    headers?: Record<string, any>
  ): Promise<any> {
    const serviceUrl = this.serviceUrls[serviceName];
    if (!serviceUrl) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    try {
      const url = `${serviceUrl}${path}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new HttpException(
          errorData.message || 'Service request failed',
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
