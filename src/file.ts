import { FileType } from "@xpcoffee/bank-schema-parser";
import { KeyedFile } from "./types";

export function getFileKey(file: File) {
  return file.lastModified + " " + file.name;
}

export function toKeyedFile(
  file: File,
  fileType: FileType = "FNB-Default"
): KeyedFile {
  return { key: getFileKey(file), file, fileType };
}
