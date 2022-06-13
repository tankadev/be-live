import { NotificationsService } from './../notifications/notifications.service';
import { DotenvService } from 'src/modules/dotenv/dotenv.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { getConnection, Repository } from 'typeorm';

import * as uuid from 'uuid';
import * as bcrypt from 'bcrypt';
import * as sharp from 'sharp';

import { UserEntity } from './users.entity';
import { BackendLogger } from '../logger/BackendLogger';
import { CreateUserDTO } from './dto/create-user.dto';
import { AddVerifyDTO } from './dto/add-verify-info.dto';
import { AWSService } from './../../shared/services/aws.service';
import { UserRO } from './ro/user.ro';

@Injectable()
export class UsersService {
    private readonly logger = new BackendLogger(UsersService.name);

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly awsService: AWSService,
        private readonly dotenvService: DotenvService,
        private readonly notificationsService: NotificationsService
    ) { }

    async updateRefreshToken(uuid: string, refreshToken: string) {
        return await this.userRepo.update(uuid, { refreshToken });
    }

    async findById(uuid: string) {
        try {
            const user = await this.userRepo.findOne({ uuid });

            return user;
        } catch (error) {
            this.logger.error(`findById: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async findByEmail(email: string): Promise<UserEntity> {
        try {
            const user = await this.userRepo.findOne({ where: { email: email } });

            return user;
        } catch (error) {
            this.logger.error(`findByEmail: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createUser(data: CreateUserDTO) {
        try {
            const user = await this.userRepo.findOne({ where: { email: data.email } })
            if (user) {
                throw 'AUTH.EMAIL_ALREADY_EXIST';
            }

            const newUser = this.userRepo.create(
                {
                    email: data.email,
                    insertDate: (new Date()).toISOString(),
                    role: 0,
                }
            );
            newUser.uuid = uuid.v4().replace(/-/g, '');
            newUser.password = await bcrypt.hash(data.password, 10);

            return await this.userRepo.save(newUser);
        } catch (error) {
            if (error === 'AUTH.EMAIL_ALREADY_EXIST') {
                throw new HttpException(error, HttpStatus.BAD_REQUEST);
            }
            this.logger.error(`createUser: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async pendingUser(): Promise<any> {
        try {
            const data = await this.userRepo.find({ where: { verifyStatus: 1 } });
            return this.formatToUserRO(data);
        } catch (error) {
            this.logger.error(`pendingUser: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async addVerifyInfo(userUUID: string, verifyInfo: AddVerifyDTO, imageFile: Express.Multer.File): Promise<any> {
        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {

            const userDetail = await this.userRepo.findOne({ uuid: userUUID });
            if (userDetail) {
                let url: string = null;
                if (imageFile) {
                    const compressImgBuffer = await sharp(imageFile.buffer)
                        .toFormat('jpeg')
                        .jpeg({ mozjpeg: true })
                        .toBuffer();
                    url = await this.awsService.uploadFile(
                        compressImgBuffer, `${Date.now().toString()}-${imageFile.originalname}`, 'user-verify'
                    );
                } else {
                    throw 'PLEASE_UPLOAD_IMAGE_VERIFY';
                }
                await queryRunner.manager.update(UserEntity, { uuid: userUUID }, {
                    firstName: verifyInfo.firstName,
                    lastName: verifyInfo.lastName,
                    address: verifyInfo.address,
                    birthday: verifyInfo.birthday,
                    image: url,
                    verifyStatus: 1
                });
                const adminUser = await this.userRepo.findOne({ where: { role: 1 } });
                if (adminUser) {
                    await this.notificationsService.pushToAdmin(adminUser.uuid, adminUser.pushToken);
                }
                await queryRunner.commitTransaction();
                return { message: 'UPDATE_SUCCESS' };
            }

            throw 'USER_DOES_NOT_EXIST';
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error === 'USER_DOES_NOT_EXIST' || error === 'PLEASE_UPLOAD_IMAGE_VERIFY') {
                throw new HttpException(error, HttpStatus.NOT_FOUND);
            }
            this.logger.error(`addVerifyInfo: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        } finally {
            await queryRunner.release();
        }
    }

    async rejected(uuid: string): Promise<any> {
        try {
            const user = await this.userRepo.findOne({ uuid });
            if (user) {
                await this.userRepo.update(uuid, {
                    verifyStatus: 3
                });
                await this.notificationsService.createNotification(
                    uuid, user.pushToken, "Yêu cầu bị từ chối", "Xin vui lòng cập nhật lại thông tin"
                );
                return { message: 'COMPLETED' };
            }
        } catch (error) {
            this.logger.error(`rejected: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async approved(uuid: string): Promise<any> {
        try {
            const user = await this.userRepo.findOne({ uuid });
            if (user) {
                await this.userRepo.update(uuid, {
                    verifyStatus: 2
                });
                await this.notificationsService.createNotification(
                    uuid, user.pushToken, "Xác thực thành công", "Từ bây giờ bạn đã có thể livestream"
                );
                return { message: 'COMPLETED' };
            }
        } catch (error) {
            this.logger.error(`approved: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updatePushToken(uuid: string, token: string): Promise<any> {
        try {
            await this.userRepo.update(uuid, {
                pushToken: token
            });
            return { message: 'COMPLETED' };
        } catch (error) {
            this.logger.error(`updatePushToken: ${error}`);
            throw new HttpException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private formatToUserRO(users: UserEntity[]): UserRO[] {
        return users.map(item => {
            item.image = item.image ? `${this.dotenvService.get('S3_URL')}/${item.image}` : null;
            return item;
        });
    }
}
