import {
  MiddlewareConsumer,
  Module,
  NestMiddleware,
  NestModule,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { UserResolver } from './user/user.resolver';
import { ConfigModule } from '@nestjs/config';
import configuration from './configs/configuration';
import { UserModule } from './domains/user/user.module';
import { AuthMiddleware } from './middleware/auth/auth.middleware';
import { AirlineModule } from './domains/airline/airline.module';
import { AuthModule } from './domains/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { FlightsModule } from './domains/flights/flights.module';
import { FaresModule } from './domains/fares/fares.module';
import { BookingSegmentsModule } from './domains/booking-segments/booking-segments.module';
import { PaymentsModule } from './domains/payments/payments.module';
import { TaxesFeesModule } from './domains/taxes_fees/taxes_fees.module';
import { TicketsModule } from './domains/tickets/tickets.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forRoot({isGlobal: true,})],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT') || '6543', 10),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false, // Tắt auto-sync để tránh lỗi migration
        }
      },
      inject: [ConfigService],
    }),

    UserModule,
    AirlineModule, 
    AuthModule, 
    FlightsModule,
    FaresModule,
     BookingSegmentsModule,
    PaymentsModule,
    TaxesFeesModule,
    TicketsModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{
  configure(consumer:MiddlewareConsumer) {
    // consumer.apply(AuthMiddleware).forRoutes("*")
  }

}
