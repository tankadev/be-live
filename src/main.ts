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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
      'Content-Type',
      'UserId',
      '*'
    ]
  };

  // Set global prefix
  app.setGlobalPrefix('hita-live');

  const dotenvService = app.get<DotenvService>(DotenvService);

  // Setup security middleware
  app.use(helmet());

  // Setup bodyparser here to set configuration on it
  app.use(bodyParser.json({ limit: '10mb' }));

  // Use a global validation pipe. This will ensure that whenever we specify
  // a type for the input of a network request it will get validated before processing.
  // See: https://docs.nestjs.com/techniques/validation
  app.useGlobalPipes(new ValidationPipe());

  logger.debug(`Listening on port: ${dotenvService.get('PORT')}`);

  process.on('uncaughtException', err => {
    console.log('Uncaught Exception:');
    console.log(err);
    console.log(err.stack);
  });

  process.on('unhandledRejection', err => {
    console.log('Unhandled Rejection:');
    console.log(err);
  });
// eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require("../hita-live-serviceKey.json");
  // Initialize the firebase admin app
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  app.enableCors(options);
  if (dotenvService.get('USE_SWAGGER') === 'true') {
    initSwagger(app);
  }

  await app.listen(dotenvService.get('PORT'));
}
bootstrap();
