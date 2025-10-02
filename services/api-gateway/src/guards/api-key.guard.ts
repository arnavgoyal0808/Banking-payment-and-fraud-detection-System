import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ProxyService } from '../services/proxy.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly proxyService: ProxyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      // Validate API key with merchant service
      const merchant = await this.proxyService.forwardRequest(
        'merchant-service',
        'GET',
        '/merchants/validate',
        null,
        { apiKey }
      );

      if (!merchant || merchant.status !== 'active') {
        throw new UnauthorizedException('Invalid or inactive API key');
      }

      request.merchant = merchant;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
}
