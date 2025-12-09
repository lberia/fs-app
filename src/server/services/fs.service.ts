export class FSService {
  private static service: "s3" | "local" = process.env.FS_SERVICE || "local";
  private static localDir: string = process.env.NODE_ENV === "test" ? "./test-files" : process.env.FS_LOCAL_DIR || "/data/files";
  public static async write(
    name: string,
    file: Blob | NodeJS.TypedArray | ArrayBufferLike | string
  ): Promise<number> {
    if (this.service === "local")
      return Bun.write(`${this.localDir}/${name}`, file);
    else return Bun.s3.write(name, file);
  }
  private static getFile(name: string): Bun.BunFile | Bun.S3File {
    if (this.service === "local") return Bun.file(`${this.localDir}/${name}`);
    else return Bun.s3.file(name);
  }
  public static async file(name: string): Promise<ArrayBuffer> {
    return this.getFile(name).arrayBuffer();
  }
  public static delete(name: string): Promise<void> {
    return this.getFile(name).delete();
  }
  public static getStream(
    name: string
  ): ReadableStream<Uint8Array<ArrayBuffer>> {
    const file = this.getFile(name);
    return file.stream();
  }
}
