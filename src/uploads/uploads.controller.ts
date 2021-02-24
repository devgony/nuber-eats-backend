import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';

const BUCKET_NAME = 'henrynubereats';

@Controller('uploads')
export class UploadsController {
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file) {
    AWS.config.update({
      credentials: {
        accessKeyId: 'AKIAZ7QCH3ILBO2M3GFS',
        secretAccessKey: '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',
      },
      // region:'ap-northeast-2' // seoul
    });
    try {
      const objectName = `${Date.now() + file.originalname}`;
      await new AWS.S3()
        // .createBucket({ Bucket: BUCKET_NAME })
        .putObject({
          Body: file.buffer,
          Bucket: BUCKET_NAME,
          Key: objectName,
          ACL: 'public-read',
        })
        .promise();
      const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectName}`;
      return { url: fileUrl };
    } catch (e) {
      return null;
    }
  }
}
