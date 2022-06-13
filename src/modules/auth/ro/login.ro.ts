import { ApiProperty } from "@nestjs/swagger";

export class LoginRO {
    @ApiProperty()
    expiresIn: number;

    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;
}
