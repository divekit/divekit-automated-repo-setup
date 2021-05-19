import { RepositoryFile } from "./RepositoryFile";

export class EncodingRetriever {

    private static readonly standardTextEncoding = "utf8";
    private static readonly standardBlobEncoding = "base64";
    
    private static readonly blobFileEndings = [ "jpg", "jpeg", "png" ];
    

    public static determineFileEncoding(filePath: string, textEncoding?: string, blobEncoding?: string): string {
        textEncoding = textEncoding ? textEncoding : this.standardTextEncoding;
        blobEncoding = blobEncoding ? blobEncoding : this.standardBlobEncoding;

        return this.isBlob(filePath) ? blobEncoding : textEncoding;
    }

    public static replaceFileEncoding(repositoryFiles: RepositoryFile[], textEncoding?: string, blobEncoding?: string): RepositoryFile[] {
        for (let repositoryFile of repositoryFiles) {
            if (repositoryFile.encoding) {
                repositoryFile.encoding = this.determineFileEncoding(repositoryFile.path, textEncoding, blobEncoding);
            }
        }
        return repositoryFiles;
    }

    public static isBlob(filePath: string): boolean {
        for (let blobFileEnding of this.blobFileEndings) {
            if (filePath.endsWith("." + blobFileEnding)) {
                return true; 
            }
        }

        return false;
    }
}