import { Column } from "typeorm";

export class BaseEntity {
    @Column({ name: 'insert_date', type: 'varchar', length: 30 })
    insertDate: string;

    @Column({ name: 'update_date', type: 'varchar', length: 30 })
    updateDate: string;

    @Column({ name: 'delete_date', type: 'varchar', length: 30})
    deleteDate: string;

    @Column({ name: 'insert_staff', type: 'char', length: 32 })
    insertStaff: string;

    @Column({ name: 'update_staff', type: 'char', length: 32 })
    updateStaff: string;

    @Column({ name: 'delete_staff', type: 'char', length: 32 })
    deleteStaff: string;
}
