import { RepositoryFile } from "../../content_manager/RepositoryFile";
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from "../../config/ConfigManager";
import { RepositoryFileLoader } from "../RepositoryFileLoader";
import { RepositoryAdapter } from "../RepositoryAdapter";
import { Logger } from "../../logging/Logger";
import { LogLevel } from "../../logging/LogLevel";


export class FileSystemRepositoryAdapter implements RepositoryAdapter {

    private readonly testFolder = path.join(__dirname, '..', '..', '..', '..', 'resources', 'test');
    private readonly inputFolder = path.join(this.testFolder, 'input');
    private readonly outputFolder = path.join(this.testFolder, 'output');
    private readonly codeRepoFolder = path.join(this.outputFolder, 'code');
    private readonly testRepoFolder = path.join(this.outputFolder, 'test');

    private codeRepository?: string;
    private testRepository?: string;

    private repositoryConfig = ConfigManager.getInstance().getRepositoryConfig();


    constructor() {
        this.initializeTestFolder();
    }

    public async prepareEnvironment() {
        await fs.promises.rmdir(this.outputFolder, { recursive: true });
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
                    Logger.getInstance().error(`There was no origin repository found in folder: ${this.inputFolder}`);
                    reject();
                }
        
                originFolder = path.join(this.inputFolder, directoryNames[0]);
            }
            
            resolve(RepositoryFileLoader.loadRepositoryFiles(originFolder, originFolder));
        });
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
        return; // no overview repository on file system
    }

    async linkCodeAndTestRepository(): Promise<void> {
        return; // no pipelines on file system possible
    }

    async provideContentToCodeRepository(codeRepositoryFiles: RepositoryFile[]): Promise<void> {
        if (this.codeRepository) {
            this.writeFilesToFolder(codeRepositoryFiles, this.codeRepository);
        } 
    }

    async provideContentToTestRepository(testRepositoryFiles: RepositoryFile[]): Promise<void> {
        if (this.testRepository) {
            this.writeFilesToFolder(testRepositoryFiles, this.testRepository);
        }
    }

    private writeFilesToFolder(repositoryFiles: RepositoryFile[], folderPath: string): void {
        for (var repositoryFile of repositoryFiles) {
            // Get new file name
            repositoryFile.path = path.join(folderPath, repositoryFile.path);
            // Create folder of file
            let directoryPath = path.dirname(repositoryFile.path);
            fs.mkdirSync(directoryPath, { recursive: true });
            // Write File
            fs.writeFileSync(repositoryFile.path, repositoryFile.content, { encoding: repositoryFile.encoding as BufferEncoding });
        }
    }

    getLinkToTestPage(): string {
        return this.testRepository ? this.testRepository : "";
    }

    getLinkToCodeRepository(): string {
        return this.codeRepository ? this.codeRepository : "";
    }

    getLinkToTestRepository(): string {
        return this.testRepository ? this.testRepository : "";
    }
}