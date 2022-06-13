import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { NotificationsEntity } from '../notifications/notifications.entity';

@Entity('user')
export class UserEntity {
    @PrimaryColumn({ name: 'uuid', type: 'char', length: 32 })
    uuid: string;

    @Column({ name: 'email', type: 'varchar', length: 30 })
    email: string;

    @Column({ name: 'password', type: 'varchar', length: 45 })
    password: string;

    @Column({ name: 'refresh_token', type: 'varchar', length: 255 })
    refreshToken: string;

    @Column({ name: 'role', type: 'tinyint', width: 1 })
    role: number;

    @Column({ name: 'verify_status', type: 'tinyint', width: 1 })
    verifyStatus: number;

    @Column({ name: 'image', type: 'varchar', length: 255 })
    image: string;

    @Column({ name: 'first_name', type: 'varchar', length: 45 })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 45 })
    lastName: string;

    @Column({ name: 'birthday', type: 'varchar', length: 30 })
    birthday: string;

    @Column({ name: 'address', type: 'varchar', length: 255 })
    address: string;

    @Column({ name: 'push_token', type: 'varchar', length: 255 })
    pushToken: string;

    @Column({ name: 'insert_date', type: 'varchar', length: 30 })
    insertDate: string;

    @OneToMany(() => NotificationsEntity, notifications => notifications.user)
    notifications: NotificationsEntity[];
}
