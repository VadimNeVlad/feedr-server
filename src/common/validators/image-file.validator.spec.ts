import { UploadedFile } from '../interfaces/uploaded-file';
import { ImageFileValidator } from './image-file.validator';

describe('ImageFileValidator', () => {
  const validator = new ImageFileValidator({});

  function file(buffer: Buffer): UploadedFile {
    return {
      buffer,
      mimetype: 'image/png',
      size: buffer.length,
      originalname: 'image.png',
    };
  }

  it('accepts a PNG signature', () => {
    expect(
      validator.isValid(
        file(
          Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
          ]),
        ),
      ),
    ).toBe(true);
  });

  it('rejects content that only claims to be an image', () => {
    expect(validator.isValid(file(Buffer.from('not an image')))).toBe(false);
  });
});
