export class EncodingRetriever {

    private static readonly STANDARD_TEXT_ENCODING = "utf8";

    public static determineFileEncoding(filePath: string): string {
        if (filePath.endsWith(".jpg") 
            || filePath.endsWith(".jpeg")
            || filePath.endsWith(".png")) {
            return "base64";
        } else {
            return this.STANDARD_TEXT_ENCODING;
        }
    }

    public static isTextFile(filePath: string): boolean {
        return this.determineFileEncoding(filePath) === this.STANDARD_TEXT_ENCODING;
    }
}