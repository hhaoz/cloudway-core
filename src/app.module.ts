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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    UserModule,AirlineModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{
  configure(consumer:MiddlewareConsumer) {
    // consumer.apply(AuthMiddleware).forRoutes("*")
  }

}
