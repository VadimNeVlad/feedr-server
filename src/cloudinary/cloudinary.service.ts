import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import * as streamifier from 'streamifier';
import { UploadedFile } from '../common/interfaces/uploaded-file';
export interface ImageOwner {
  kind: 'articles' | 'avatars';
  id: string;
}
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  async uploadImage(
    file: UploadedFile,
    owner: ImageOwner,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `feeds/${owner.kind}/${owner.id}`,
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        },
        (error, result) => {
          if (error) return reject(this.toHttpError(error));
          if (!result)
            return reject(this.toHttpError({ message: 'No upload result' }));
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }
  // The SDK rejects with a plain object instead of an Error, which Nest would
  // turn into an opaque 500. Cloudinary's 400 means it could not process the
  // image itself; anything else is an upstream failure, so answer 502.
  private toHttpError(
    error: Partial<UploadApiErrorResponse>,
  ): BadRequestException | BadGatewayException {
    this.logger.error(
      `Image upload failed (${error.http_code ?? 'no status'}): ${error.message ?? 'unknown error'}`,
    );
    return error.http_code === 400
      ? new BadRequestException('The image could not be processed')
      : new BadGatewayException(
          'Image storage is unavailable, please try again later',
        );
  }
  async deleteImageByUrl(
    url: string | undefined,
    owner: ImageOwner,
  ): Promise<void> {
    const publicId = this.getPublicId(url, owner);
    if (!publicId) return; // Legacy assets without ownership information are deliberately retained.
    try {
      await v2.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      this.logger.warn(
        `Image cleanup failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
  private getPublicId(
    url: string | undefined,
    owner: ImageOwner,
  ): string | undefined {
    if (!url || !owner.id) return;
    try {
      const parsed = new URL(url);
      if (
        parsed.protocol !== 'https:' ||
        parsed.hostname !== 'res.cloudinary.com'
      )
        return;
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (
        segments[0] !== v2.config().cloud_name ||
        segments[1] !== 'image' ||
        segments[2] !== 'upload'
      )
        return;
      const version = segments.findIndex(
        (part, i) => i > 2 && /^v\d+$/.test(part),
      );
      if (version < 0) return;
      const publicId = decodeURIComponent(
        segments.slice(version + 1).join('/'),
      ).replace(/\.[^.]+$/, '');
      const prefix = `feeds/${owner.kind}/${owner.id}/`;
      if (
        !publicId.startsWith(prefix) ||
        !/^[\w-]+$/.test(publicId.slice(prefix.length))
      )
        return;
      return publicId;
    } catch {
      return;
    }
  }
}
