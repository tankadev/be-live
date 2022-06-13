import { ApiProperty } from '@nestjs/swagger'
export class UserRO {
    @ApiProperty()
    uuid: string;

    @ApiProperty()
    firstName: string;

    @ApiProperty()
    lastName: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    role: number;

    @ApiProperty()
    address: string;

    @ApiProperty()
    verifyStatus: number;
}