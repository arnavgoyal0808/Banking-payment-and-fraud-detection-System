import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PaymentController } from './controllers/payment.controller';
import { MerchantController } from './controllers/merchant.controller';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { ProxyService } from './services/proxy.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    PaymentController,
    MerchantController,
    AuthController,
  ],
  providers: [
    AuthService,
    ProxyService,
    JwtStrategy,
    ApiKeyStrategy,
  ],
})
export class AppModule {}
