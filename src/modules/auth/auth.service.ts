import { Injectable } from '@nestjs/common';

import { DotenvService } from 'src/modules/dotenv/dotenv.service';
import { ResponseRO } from 'src/shared/ro/response.ro';
import { CreateUserDTO } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { UserEntity } from './../users/users.entity';
import { LoginRO } from './ro/login.ro';
import { TokenService } from './token/token.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly tokenService: TokenService,
        private readonly dotenvService: DotenvService
    ) {}

    async validateUser(payload): Promise<any> {
        return await this.usersService.findById(payload.uuid);
    }

    async validateUserLocal(email: string, password: string): Promise<any> {
        return await this.tokenService.validUserPassword(email, password);
    }

    async login(user: UserEntity): Promise<LoginRO> {
        const accessToken = this.tokenService.createAccessToken(user);
        const refreshToken = await this.tokenService.createRefreshToken(user);

        return {
            accessToken,
            refreshToken,
            expiresIn: Number(this.dotenvService.get('ACCESS_TOKEN_TTL'))
        }
    }

    async accessToken(oldAccessToken: string, refreshToken: string) {
        return await this.tokenService.getAccessTokenFromRefreshToken(oldAccessToken, refreshToken);
    }

    async logout(userId: string): Promise<ResponseRO<any>> {
        await this.tokenService.deleteRefreshToken(userId);
        return { message: 'LOGOUT_SUCCESS' };
    }

    async createUserAccount(data: CreateUserDTO): Promise<ResponseRO<any>> {
        await this.usersService.createUser(data);
        return { message: 'CREATE_USER_SUCCESS' };
    }
}
