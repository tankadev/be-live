
import { Catch, ExceptionFilter, HttpException, ArgumentsHost, Logger, HttpStatus } from '@nestjs/common';
import { HttpErrorRO } from '../ro/http-error.ro';

@Catch()
export class HttpFilterError implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errResponse = new HttpErrorRO();
    errResponse.status = status;
    errResponse.timestamp = new Date().toLocaleString();
    errResponse.path = request.url;
    errResponse.method = request.method;
    errResponse.message = exception.message || null;

    Logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errResponse),
      HttpFilterError.name
    );

    response.status(status).json(errResponse);
  }
}