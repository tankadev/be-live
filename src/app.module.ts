import { NotificationsModule } from './modules/notifications/notifications.module';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

import { DotenvModule } from './modules/dotenv/dotenv.module';
import { DotenvService } from './modules/dotenv/dotenv.service';

import { SessionMiddleware } from './middleware/session.middleware';
import { HttpFilterError } from './shared/filters/http-error.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
// import { AuthMiddleware } from './middleware/auth.middleware';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [DotenvModule],
      useFactory: async (dotenvService: DotenvService) =>
        ({
          type: 'mysql',
          host: dotenvService.get('DB_HOST'),
          port: parseInt(dotenvService.get('DB_PORT'), 10),
          username: dotenvService.get('DB_USER'),
          password: dotenvService.get('DB_PASSWORD'),
          database: dotenvService.get('DB_NAME'),
          entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
          synchronize: false,
          logging: dotenvService.get('NODE_ENV') === 'development',
          logger: 'file',
        } as any),
      inject: [DotenvService],
    }),
    DotenvModule,
    AuthModule,
    UsersModule,
    NotificationsModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpFilterError
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor
    }
  ],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*');
    // consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
