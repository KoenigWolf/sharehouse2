import exifr from "exifr";

/**
 * EXIF DateTimeOriginal を ISO 文字列として抽出する
 *
 * Canvas 圧縮で EXIF が消えるため、圧縮前に呼び出す必要がある。
 * DateTimeOriginal のみ選択パースするため高速。
 *
 * @param input - File（ブラウザ）または ArrayBuffer / Uint8Array（サーバー）
 * @returns ISO 8601 文字列、取得できない場合は null
 */
export async function extractTakenAt(
  input: File | ArrayBuffer | Uint8Array
): Promise<string | null> {
  try {
    const exif = await exifr.parse(input, ["DateTimeOriginal"]);
    if (exif?.DateTimeOriginal instanceof Date) {
      return exif.DateTimeOriginal.toISOString();
    }
    return null;
  } catch {
    return null;
  }
}
