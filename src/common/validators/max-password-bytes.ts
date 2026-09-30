import { registerDecorator, ValidationOptions } from 'class-validator';
export function MaxPasswordBytes(
  options?: ValidationOptions,
): PropertyDecorator {
  return (target, property) =>
    registerDecorator({
      name: 'maxPasswordBytes',
      target: target.constructor,
      propertyName: String(property),
      options,
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72,
        defaultMessage: () => 'Password must not exceed 72 UTF-8 bytes',
      },
    });
}
