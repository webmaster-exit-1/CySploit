declare module 'msgpack-lite' {
  export function encode(data: any): Buffer;
  export function decode(data: Buffer): any;
}