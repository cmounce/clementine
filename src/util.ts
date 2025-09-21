const BASE62_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function generateId(): string {
  const input = new Uint32Array(20);
  crypto.getRandomValues(input);
  return Array.from(
    input,
    (int32) => BASE62_ALPHABET[int32 % BASE62_ALPHABET.length]
  ).join('');
}

export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? `Assertion failed`);
  }
}
