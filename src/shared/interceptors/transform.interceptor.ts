import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Response<T> {
    statusCode: number;
    message: string;
    data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any|Response<T>> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const date = Date.now();

        return next.handle().pipe(
            tap(
                () => Logger.log(
                  `${method} ${req.url} ${Date.now() - date}ms`,
                  context.getClass().name,
                ),
            ),
            map((data) => {
                if (data.message || data.result) {
                    return {
                        statusCode: context.switchToHttp().getResponse().statusCode,
                        message: data.message ? data.message : null,
                        data: data.result ? data.result : null
                    };
                }

                return data;
            })
        );
    }
}
