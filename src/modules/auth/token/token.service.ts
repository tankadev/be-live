import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { DotenvService } from 'src/modules/dotenv/dotenv.service';
import { BackendLogger } from 'src/modules/logger/BackendLogger';
import { UserEntity } from 'src/modules/users/users.entity';
import { UsersService } from 'src/modules/users/users.service';
import { PayloadTokenModel } from '../models/payload-token.model';
import { LoginRO } from '../ro/login.ro';

@Injectable()
export class TokenService {
    private readonly logger = new BackendLogger(TokenService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
        private readonly dotenvService: DotenvService
    ) { }

    /**
     * Xử lý yêu cầu xin cấp mới accessToken
     * @param oldAccessToken access token cũ
     * @param refreshToken refresh token
     */
    async getAccessTokenFromRefreshToken(
        oldAccessToken: string,
        refreshToken: string,
        // clientId: string,
        // ipAddress: string,
    ): Promise<LoginRO> {
        try {
            // Kiểm tra token cũ có hợp lệ hay không
            const payLoadOldAccessToken = this.validateToken(
                oldAccessToken,
                this.dotenvService.get('ACCESS_TOKEN_SECRET'),
                true
            );

            // Lấy thông tin user từ DB
            const user = await this.usersService.findById(payLoadOldAccessToken.uuid);
            if (!user) {
                this.logger.debug(`getAccessTokenFromRefreshToken: The user cannot be found when issuing the new access token`);
                throw 'Unauthorized';
            }

            // Kiểm tra thông tin refresh token có hợp lệ không
            const currentTime = new Date().getTime() / 1000;
            const oldRefreshToken = this.validateToken(refreshToken, this.dotenvService.get('REFRESH_TOKEN_SECRET'));

            const isValidHash = await bcrypt.compare(refreshToken, user.refreshToken ?? '');
            if (!isValidHash || currentTime > oldRefreshToken.exp) {
                this.logger.debug(`getAccessTokenFromRefreshToken: Invalid token refresh encryption`);
                throw 'Unauthorized';
            }

            // Cấp access token và refresh token mới
            const newAccessToken = this.createAccessToken(user);
            const newRefreshToken = await this.createRefreshToken(user);
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: Number(this.dotenvService.get('ACCESS_TOKEN_TTL'))
            };
        } catch (error) {
            if (error === 'Unauthorized') {
                throw new UnauthorizedException();
            }
            this.logger.debug(`getAccessTokenFromRefreshToken: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Tạo JWT Access Token mới
     * @param user Thông tin user
     */
    createAccessToken(user: UserEntity): string {
        return this.jwtService.sign(this.createPayloadForToken(user), {
            secret: this.dotenvService.get('ACCESS_TOKEN_SECRET'),
            expiresIn: Number(this.dotenvService.get('ACCESS_TOKEN_TTL'))
        });
    }

    /**
     * Tạo JWT Refresh Token mới và lưu vào DB
     * @param user Thông tin user
     */
    async createRefreshToken(user: UserEntity): Promise<string> {
        // Tạo một mã token khác - refresh token để lấy lại access token mới
        const refreshToken = this.jwtService.sign(this.createPayloadForToken(user), {
            secret: this.dotenvService.get('REFRESH_TOKEN_SECRET'),
            expiresIn: Number(this.dotenvService.get('REFRESH_TOKEN_TTL'))
        });

        // Mã hoá thông tin refresh token và lưu refresh token vào DB
        const hashedToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateRefreshToken(user.uuid, hashedToken);

        return refreshToken;
    }

    /**
     * Tạo payload cho token từ thông tin user
     * @param user Thông tin user
     */
    private createPayloadForToken(user: UserEntity): PayloadTokenModel {
        return {
            email: user.email,
            uuid: user.uuid,
            verifyStatus: user.verifyStatus
        };
    }

    /**
     * Xoá bỏ refresh token
     * @param userId uuid của user
     * @param value giá trị của token cần xoá
     */
    async deleteRefreshToken(userId: string) {
        await this.usersService.updateRefreshToken(userId, null);
    }

    async validUserPassword(email: string, password: string) {
        try {
            const user = await this.usersService.findByEmail(email);
            if (!user) {
                throw 'AUTH.USER_DOES_NOT_EXIST';
            }

            const isValidPassword = await bcrypt.compare(password, user.password ?? '');

            if (isValidPassword) {
                return user;
            }
            throw 'AUTH.INVALID_USERNAME_OR_PASSWORD'
        } catch (error) {
            if (
                error === 'AUTH.USER_DOES_NOT_EXIST' ||
                error === 'AUTH.YOU_DO_NOT_HAVE_PERMISSION_TO_LOGIN' ||
                error === 'AUTH.YOUR_ACCOUNT_HAS_BEEN_BLOCKED' ||
                error === 'AUTH.INVALID_USERNAME_OR_PASSWORD'
            ) {
                throw new HttpException(error, HttpStatus.BAD_REQUEST);
            }
            this.logger.debug(`validUserPassword: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Kiểm tra xem JWT token có hợp lệ hay không
     * @param token Token cần kiểm tra
     * @param secretKey mã bí mật của token
     * @param ignoreExpiration loại trừ kiểm tra hết hạn
     */
    private validateToken(
        token: string,
        secretKey: string,
        ignoreExpiration = false,
    ): PayloadTokenModel {
        try {
            return this.jwtService.verify(token, {
                secret: secretKey,
                ignoreExpiration
            }) as PayloadTokenModel;
        } catch (error) {
            this.logger.debug('validateToken.JsonWebTokenError: Invalid signature-TOKEN_NOT_MATCH');
            throw new UnauthorizedException();
        }
    }
}
