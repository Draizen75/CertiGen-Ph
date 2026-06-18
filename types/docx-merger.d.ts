declare module 'docx-merger' {
  export default class DocxMerger {
    constructor(options: Record<string, unknown>, files: ArrayBuffer[] | Uint8Array[]);
    save(type: 'blob' | 'arraybuffer' | 'uint8array' | 'nodebuffer', callback: (data: Blob | ArrayBuffer | Uint8Array) => void): void;
  }
}
