import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService
    ) {}

    @Get('notifications')
    @HttpCode(200)
    getListOrder() {
        // return this.orderService.getAllSuccessOrder();
    }
}
