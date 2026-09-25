import { Injectable, Logger } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import * as streamifier from 'streamifier';
import { UploadedFile } from '../common/interfaces/uploaded-file';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadImage(
    file: UploadedFile,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'feeds',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error('Cloudinary returned no result'));
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }

  async deleteImageByUrl(url?: string): Promise<void> {
    const publicId = this.getPublicId(url);
    if (!publicId) return;

    try {
      await v2.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      this.logger.warn(
        `Could not remove obsolete Cloudinary image ${publicId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private getPublicId(url?: string): string | undefined {
    if (!url) return undefined;

    try {
      const segments = new URL(url).pathname.split('/').filter(Boolean);
      const uploadIndex = segments.indexOf('upload');
      if (uploadIndex < 0) return undefined;

      const versionIndex = segments.findIndex(
        (segment, index) => index > uploadIndex && /^v\d+$/.test(segment),
      );
      const firstPublicIdSegment =
        versionIndex >= 0 ? versionIndex + 1 : uploadIndex + 1;
      const publicId = segments.slice(firstPublicIdSegment).join('/');
      return decodeURIComponent(publicId).replace(/\.[^.]+$/, '');
    } catch {
      return undefined;
    }
  }
}
