declare module 'msgpack-lite' {
  export function encode(data: unknown): Buffer;
  export function decode(data: Buffer): unknown;
}