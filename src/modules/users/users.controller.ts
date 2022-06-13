import { Body, Controller, Get, HttpCode, Param, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { User } from 'src/shared/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddVerifyDTO } from './dto/add-verify-info.dto';
import { UsersService } from './users.service';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(
        private readonly userService: UsersService
    ) {}

    @Put('add-verify-info')
    @HttpCode(200)
    @UseInterceptors(FileInterceptor('imageFile'))
    addVerifyInfo(
        @User('uuid') userUUID: string,
        @Body() info: AddVerifyDTO,
        @UploadedFile() imageFile: Express.Multer.File
    ) {
        return this.userService.addVerifyInfo(userUUID, info, imageFile);
    }

    @Get('user-info')
    getUserDetail(
        @User('uuid') userUUID: string,
    ) {
        return this.userService.findById(userUUID);
    }

    @Get('pending-verify')
    pendingUser() {
        return this.userService.pendingUser();
    }

    @Put('rejected/:uuid')
    @HttpCode(200)
    rejected(
        @Param('uuid') uuid: string,
    ) {
        return this.userService.rejected(uuid);
    }

    @Put('approved/:uuid')
    @HttpCode(200)
    approved(
        @Param('uuid') uuid: string
    ) {
        return this.userService.approved(uuid);
    }

    @Put('update-push-token')
    @HttpCode(200)
    updatePushToken(
        @User('uuid') userUUID: string,
        @Body() body: { token: string },
    ) {
        return this.userService.updatePushToken(userUUID, body.token);
    }
}
