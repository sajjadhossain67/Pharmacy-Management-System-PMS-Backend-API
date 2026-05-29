import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const appCfg = config.get('app');
  const logger = new Logger('Bootstrap');

  // ─── Security ─────────────────────────────────────────────────
  app.use(helmet());
  app.use((compression as any)());

  // ─── CORS ─────────────────────────────────────────────────────
  app.enableCors({
    origin: appCfg.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Api-Key',
    ],
    credentials: true,
  });

  // ─── Global Prefix & Versioning ───────────────────────────────
  app.setGlobalPrefix(`${appCfg.apiPrefix}/${appCfg.apiVersion}`);

  // ─── Global Pipes ─────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties
      forbidNonWhitelisted: true, // throw on unknown properties
      transform: true,           // auto-transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,  // collect all errors
    }),
  );

  // ─── Global Filters & Interceptors ────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  // ─── Swagger / OpenAPI ────────────────────────────────────────
  if (appCfg.env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Pharmacy Management System API')
      .setDescription(
        'Enterprise-grade REST API for the Pharmacy Management System. ' +
        'Supports inventory management, sales, prescriptions, purchase orders, ' +
        'reporting, and more.',
      )
      .setVersion('1.0.0')
      .setContact('Pharma Dev Team', '', 'dev@pharma.local')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer(`http://localhost:${appCfg.port}`, 'Local Development')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
          description: 'Enter JWT access token',
        },
        'JWT',
      )
      .addTag('Auth', 'Authentication & token management')
      .addTag('Users', 'User management & profiles')
      .addTag('Inventory', 'Medicine inventory management')
      .addTag('Suppliers', 'Supplier management')
      .addTag('Purchase Orders', 'Purchase order lifecycle')
      .addTag('Customers', 'Customer management')
      .addTag('Prescriptions', 'Prescription management')
      .addTag('Sales', 'Sales & POS operations')
      .addTag('Reports', 'Business intelligence & reporting')
      .addTag('Notifications', 'System notifications')
      .addTag('Audit', 'Audit trail & activity logs')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(
      `${appCfg.apiPrefix}/${appCfg.apiVersion}/docs`,
      app,
      document,
      {
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
        },
      },
    );
    logger.log(
      `Swagger docs: http://localhost:${appCfg.port}/${appCfg.apiPrefix}/${appCfg.apiVersion}/docs`,
    );
  }

  // ─── Start ────────────────────────────────────────────────────
  await app.listen(appCfg.port);
  logger.log(`🚀 Application running on http://localhost:${appCfg.port}`);
  logger.log(`📦 Environment: ${appCfg.env}`);
}

bootstrap();
