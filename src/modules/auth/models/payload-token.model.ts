export class PayloadTokenModel {
    uuid: string;
    email: string;
    verifyStatus: number;
    iat?: number;
    exp?: number;
}
