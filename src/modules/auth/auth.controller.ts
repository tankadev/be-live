import { Controller, UseGuards, Req, Post, Query, HttpCode, Body } from '@nestjs/common';

import { ExtractJwt } from 'passport-jwt';

import { User } from 'src/shared/decorators/user.decorator';
import { CreateUserDTO } from '../users/dto/create-user.dto';
import { UserEntity } from '../users/users.entity';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) { }

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  loginLocal(
    @User() user: UserEntity
  ) {
    return this.authService.login(user);
  }

  @Post('refresh-token')
  @HttpCode(200)
  requestAccessToken(
    @Req() req,
    @Query('refreshToken') refreshToken?: string
  ) {
    const oldAccessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    return this.authService.accessToken(oldAccessToken, refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  logout(
    @User('uuid') userUUID: string
  ) {
    return this.authService.logout(userUUID);
  }

  @Post('register')
  createUserAccount(
    @Body() data: CreateUserDTO
  ) {
    return this.authService.createUserAccount(data);
  }
}
