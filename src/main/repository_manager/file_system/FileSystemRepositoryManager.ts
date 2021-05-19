import { RepositoryManager } from "../RepositoryManager";
import { RepositoryFile } from "../../content_manager/RepositoryFile";
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from "../../config/ConfigManager";
import { EncodingRetriever } from "../../content_manager/EncodingRetriever";


export class FileSystemRepositoryManager implements RepositoryManager {

    private readonly testFolder = path.join(__dirname, '..', '..', '..', '..', 'test');
    private readonly inputFolder = path.join(this.testFolder, 'input');
    private readonly outputFolder = path.join(this.testFolder, 'output');
    private readonly codeRepoFolder = path.join(this.outputFolder, 'code');
    private readonly testRepoFolder = path.join(this.outputFolder, 'test');

    private codeRepository: string = "";
    private testRepository: string = "";

    private repositoryConfig = ConfigManager.getInstance().getRepositoryConfig();


    constructor() {
        this.initializeTestFolder();
    }

    public prepareEnvironment() {
        fs.rmdirSync(this.outputFolder, { recursive: true });
    }

    private initializeTestFolder() {
        fs.mkdirSync(this.inputFolder, { recursive: true });

        fs.mkdirSync(this.codeRepoFolder, { recursive: true });
        fs.mkdirSync(this.testRepoFolder, { recursive: true });
    }

    async retrieveOriginFiles(): Promise<RepositoryFile[]> {
        return new Promise((resolve, reject) => {
            let originFolder: string = this.repositoryConfig.local.originRepositoryFilePath;

            if (originFolder.length == 0) {
                let directoryNames = fs.readdirSync(this.inputFolder);
                if (directoryNames.length == 0) {
                    console.log(`There was no origin repository found in folder: ${this.inputFolder}`);
                    reject();
                }
        
                originFolder = path.join(this.inputFolder, directoryNames[0]);
            }
            
            resolve(this.getRepositoryFiles(originFolder, originFolder));
        });
    }

    private getRepositoryFiles(originFolder: string, folderPath : string): RepositoryFile[] {
        let repositoryFiles: RepositoryFile[] = [];
        let directoryNames = fs.readdirSync(folderPath);
    
        for (let directoryName of directoryNames) {
            let fullDirectoryPath = path.join(folderPath, directoryName);
            if (fs.lstatSync(fullDirectoryPath).isDirectory()) {
                repositoryFiles = repositoryFiles.concat(this.getRepositoryFiles(originFolder, fullDirectoryPath));
            } else {
                repositoryFiles.push(this.getRepositoryFile(originFolder, fullDirectoryPath));
            }
        }

        return repositoryFiles;
    }

    private getRepositoryFile(originFolder: string, filePath : string): RepositoryFile {
        let relativeFilePath = path.relative(originFolder, filePath);
        let fileEncoding = EncodingRetriever.determineFileEncoding(filePath);
        let fileContent = fs.readFileSync(filePath, { encoding: fileEncoding });

        return { path: relativeFilePath, content: fileContent, encoding: fileEncoding };
    }

    async createCodeRepository(repositoryName: string): Promise<void> {
        this.codeRepository = path.join(this.codeRepoFolder, repositoryName);
        fs.mkdirSync(this.codeRepository);
    }

    async createTestRepository(repositoryName: string): Promise<void> {
        this.testRepository = path.join(this.testRepoFolder, repositoryName);
        fs.mkdirSync(this.testRepository);
    }

    async addMembersToCodeRepository(members: string[] | undefined): Promise<void> {
        return; // no student members on file system possible
    }

    async addOverviewToOverviewRepository(overviewContent: RepositoryFile): Promise<void> {
        return; // no student members on file system possible
    }

    async linkCodeAndTestRepository(): Promise<void> {
        return; // no pipelines on file system possible
    }

    async provideContentToCodeAndTestRepository(codeRepositoryFiles: RepositoryFile[], testRepositoryFiles: RepositoryFile[]): Promise<void> {
        this.writeFilesToFolder(codeRepositoryFiles, this.codeRepository);
        this.writeFilesToFolder(testRepositoryFiles, this.testRepository);
    }

    private writeFilesToFolder(repositoryFiles: RepositoryFile[], folderPath: string): void {
        for (var repositoryFile of repositoryFiles) {
            // Get new file name
            repositoryFile.path = path.join(folderPath, repositoryFile.path);
            // Create folder of file
            let directoryPath = path.dirname(repositoryFile.path);
            fs.mkdirSync(directoryPath, { recursive: true });
            // Write File
            fs.writeFileSync(repositoryFile.path, repositoryFile.content, { encoding: repositoryFile.encoding });
        }
    }

    getLinkToTestPage(): String {
        return this.testRepository;
    }

    getLinkToCodeRepository(): String {
        return this.codeRepository;
    }

    getLinkToTestRepository(): String {
        return this.testRepository;
    }
}