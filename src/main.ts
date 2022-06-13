import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as bodyParser from 'body-parser';
import * as admin from 'firebase-admin';
import { AppModule } from './app.module';
import { BackendLogger } from './modules/logger/BackendLogger';
import { DotenvService } from './modules/dotenv/dotenv.service';

const logger = new BackendLogger('Main');

function initSwagger(app) {
  const options = new DocumentBuilder()
    .setTitle('Nest Node Starter API')
    .setDescription('API description')
    .setVersion('1.0')
    // .addBearerAuth('Authorization', 'header')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
}

async function bootstrap() {
  const options = {
    origin: '*',
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: [
      'Authorization',
      'Module',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'objectcd',
      'Content-Type',
      'UserId',
      'CompanyId',
      'OrganizationId',
      '*'
    ]
  };
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Set the config options
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require("../hita-live-serviceKey.json");
  // Initialize the firebase admin app
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  app.enableCors(options);
  await app.listen(process.env.PORT || 3300);
}
bootstrap();
