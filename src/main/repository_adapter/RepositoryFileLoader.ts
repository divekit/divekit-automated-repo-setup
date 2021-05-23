import * as fs from 'fs';
import * as path from 'path';
import { EncodingRetriever } from '../content_manager/EncodingRetriever';
import { RepositoryFile } from '../content_manager/RepositoryFile';


export class RepositoryFileLoader {

    public static loadRepositoryFiles(originFolder: string, folderPath : string): RepositoryFile[] {
        let repositoryFiles: RepositoryFile[] = [];
        let directoryNames = fs.readdirSync(folderPath);
    
        for (let directoryName of directoryNames) {
            let fullDirectoryPath = path.join(folderPath, directoryName);
            if (fs.lstatSync(fullDirectoryPath).isDirectory()) {
                repositoryFiles = repositoryFiles.concat(this.loadRepositoryFiles(originFolder, fullDirectoryPath));
            } else {
                repositoryFiles.push(this.loadRepositoryFile(originFolder, fullDirectoryPath));
            }
        }

        return repositoryFiles;
    }

    private static loadRepositoryFile(originFolder: string, filePath : string): RepositoryFile {
        let relativeFilePath = path.relative(originFolder, filePath);
        let fileEncoding = EncodingRetriever.determineFileEncoding(filePath);
        let fileContent = fs.readFileSync(filePath, { encoding: fileEncoding });

        return { path: relativeFilePath, content: fileContent, encoding: fileEncoding };
    }
}