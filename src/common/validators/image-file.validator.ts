import { FileValidator } from '@nestjs/common';
import { UploadedFile } from '../interfaces/uploaded-file';

// Vercel rejects request bodies over 4.5 MB before they reach the app, so stay
// below that to return a proper validation error instead of an opaque 413.
export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export class ImageFileValidator extends FileValidator<Record<string, never>> {
  buildErrorMessage(): string {
    return 'Only JPEG, PNG, GIF, and WebP images are allowed';
  }

  isValid(file?: UploadedFile): boolean {
    if (!file?.buffer || file.buffer.length < 12) return false;

    const header = file.buffer.subarray(0, 12);
    const isJpeg =
      header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isPng = header
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isGif = header.subarray(0, 6).toString('ascii').startsWith('GIF8');
    const isWebp =
      header.subarray(0, 4).toString('ascii') === 'RIFF' &&
      header.subarray(8, 12).toString('ascii') === 'WEBP';

    return isJpeg || isPng || isGif || isWebp;
  }
}
