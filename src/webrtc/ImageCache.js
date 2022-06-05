class ImageCache {
  /**
   * 合并ArrayBuffer
   * @param { Array<ArrayBuffer> } arrayBuffer
   */
  static arrayBufferConcat(arrayBuffer = []) {
    let size = 0;

    arrayBuffer.forEach((o) => size += o.byteLength);

    const tmp = new Uint8Array(size);

    for (let i = 0, end = 0; i < arrayBuffer.length; i++) {
      tmp.set(new Uint8Array(arrayBuffer[i]), end);
      end += arrayBuffer[i]?.byteLength;
    }

    return tmp.buffer;
  }

  constructor(info) {
    this.id = info.id;
    this.name = info.name;
    this.size = info.size;
    this.type = info.type;
    this.date = info.date;
    this.arrayBuffer = [];
  }

  get arrayBufferSize() {
    let size = 0;

    this.arrayBuffer.forEach((o) => size += o.byteLength);

    return size;
  }
}

export default ImageCache;