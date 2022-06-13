import { Injectable } from '@nestjs/common';

import * as AWS from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';

import { DotenvService } from 'src/modules/dotenv/dotenv.service';

@Injectable()
export class AWSService {

    s3 = new AWS.S3();

    constructor(
        private readonly dotenvService: DotenvService
    ) {
        this.s3 = new AWS.S3({
            accessKeyId: this.dotenvService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.dotenvService.get('AWS_SECRET_ACCESS_KEY'),
        });
    }

    /**
     * AWS service upload file to S3 Bucket
     * @param file file upload
     * @param folder ex: folder_name/sub_name/
     */
    async uploadFile(buffer: Buffer, fileName: string, folder?: string): Promise<string> {
        const urlKey = `${folder ? `${folder}/` : ''}${fileName}`;
        const params: PutObjectRequest = {
            Body: buffer,
            Bucket: this.dotenvService.get('AWS_S3_BUCKET_NAME'),
            Key: urlKey
        }
        const data = await this.s3.upload(params).promise();
        return data.Key;
    }

    async deleteFile(fileKey: string) {
        return await this.s3.deleteObject({
            Bucket: this.dotenvService.get('AWS_S3_BUCKET_NAME'),
            Key: fileKey,
        }).promise();
    }
}