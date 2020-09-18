import { FileType } from "@xpcoffee/bank-schema-parser";

export function getFileKey(file: File) {
  return file.lastModified + " " + file.name;
}

export type KeyedFile = { key: string; file: File; fileType: FileType };
export interface KeyedFileUpdate extends Partial<KeyedFile> {
  key: string;
}

export function toKeyedFile(
  file: File,
  fileType: FileType = "FNB-Default"
): KeyedFile {
  return { key: getFileKey(file), file, fileType };
}
