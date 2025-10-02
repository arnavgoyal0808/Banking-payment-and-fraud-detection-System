import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { FraudService } from './services/fraud.service';
import { EventService } from './services/event.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionEvent } from './entities/transaction-event.entity';
import { Customer } from './entities/customer.entity';
import { PaymentMethod } from './entities/payment-method.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Transaction, TransactionEvent, Customer, PaymentMethod],
      synchronize: false, // Use migrations in production
    }),
    TypeOrmModule.forFeature([Transaction, TransactionEvent, Customer, PaymentMethod]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentGatewayService,
    FraudService,
    EventService,
  ],
})
export class AppModule {}
