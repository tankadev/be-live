import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../users/users.entity';

@Entity('notifications')
export class NotificationsEntity {
    @PrimaryColumn({ name: 'uuid', type: 'char', length: 32 })
    uuid: string;

    @Column({ name: 'title', type: 'varchar', length: 255 })
    title: string;

    @Column({ name: 'content', type: 'varchar', length: 255 })
    content: string;

    @Column({ name: 'user_uuid', type: 'char', length: 32 })
    userUuid: string;

    // Foreign keys
    @ManyToOne(() => UserEntity, user => user.notifications)
    @JoinColumn({ name: 'user_uuid' })
    user: UserEntity;
}
