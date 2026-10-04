import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UploadApiErrorResponse, UploadStream, v2 } from 'cloudinary';
import { PassThrough } from 'stream';
import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage errors', () => {
    const file = {
      buffer: Buffer.from('image'),
      mimetype: 'image/png',
      size: 5,
      originalname: 'a.png',
    };
    const owner = { kind: 'avatars' as const, id: 'user-1' };

    function failUploadWith(error: object) {
      jest
        .spyOn(v2.uploader, 'upload_stream')
        // upload_stream is overloaded and jest types the mock after the
        // callback-only overload, so both parameters must be optional.
        .mockImplementation(
          (
            _options?: unknown,
            callback?: (error?: UploadApiErrorResponse) => void,
          ) => {
            callback?.(error as UploadApiErrorResponse);
            return new PassThrough() as unknown as UploadStream;
          },
        );
    }

    afterEach(() => jest.restoreAllMocks());

    it('answers 502 when Cloudinary itself fails', async () => {
      failUploadWith({ message: 'Server error', http_code: 500 });
      await expect(service.uploadImage(file, owner)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('answers 400 when Cloudinary rejects the image', async () => {
      failUploadWith({ message: 'Invalid image file', http_code: 400 });
      await expect(service.uploadImage(file, owner)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
