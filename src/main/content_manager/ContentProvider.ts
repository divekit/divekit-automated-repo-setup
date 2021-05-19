import { RepositoryManager } from "../repository_manager/RepositoryManager";
import { RepositoryFile } from "./RepositoryFile";
import { ContentReplacer } from '../content_variation/ContentReplacer';
import { FileManipulatorManager } from '../file_manipulator/FileManipulatorManager';
import { IndividualRepository } from '../repository_creation/IndividualRepository';
import { IndividualSelectionCollection } from '../content_variation/selections/IndividualSelectionCollection';
import { ConfigManager } from "../config/ConfigManager";


export class ContentProvider {
    
    private readonly filePreIdentifier = "_";

    private readonly codeRepoFileIdentifier = this.filePreIdentifier + "coderepo";
    private readonly testRepoFileIdentifier = this.filePreIdentifier + "testrepo";
    private readonly noRepoFileIdentifier = this.filePreIdentifier + "norepo";

    private fileManipulatorManager: FileManipulatorManager;


    constructor(public readonly repositoryManager: RepositoryManager, public readonly individualRepository: IndividualRepository) {
        this.fileManipulatorManager = new FileManipulatorManager();    
    }
    
    public async provideRepositoriesWithContent(originRepositoryFiles: RepositoryFile[], codeRepositoryName: string, testRepositoryName: string): Promise<void> {

        await this.prepareRepositoryManager(codeRepositoryName, testRepositoryName);

        let codeRepositoryFiles: RepositoryFile[] = [];
        let testRepositoryFiles: RepositoryFile[] = [];

        for (var individualRepositoryFile of await this.getIndividualRepositoryFiles(originRepositoryFiles)) {
            // Commit file to code, test repo or to both
            if (individualRepositoryFile.path.includes(this.codeRepoFileIdentifier)) {
                individualRepositoryFile.path = individualRepositoryFile.path.replace(this.codeRepoFileIdentifier, '');
                individualRepositoryFile.content = individualRepositoryFile.content.replace(new RegExp(this.codeRepoFileIdentifier, "g"), "");
                codeRepositoryFiles.push(individualRepositoryFile);
            } else if (individualRepositoryFile.path.includes(this.testRepoFileIdentifier)) {
                individualRepositoryFile.path = individualRepositoryFile.path.replace(this.testRepoFileIdentifier, '');
                individualRepositoryFile.content = individualRepositoryFile.content.replace(new RegExp(this.testRepoFileIdentifier, "g"), "");
                testRepositoryFiles.push(individualRepositoryFile);
            } else if (!individualRepositoryFile.path.includes(this.noRepoFileIdentifier)) {
                codeRepositoryFiles.push({ path: individualRepositoryFile.path, content: individualRepositoryFile.content, encoding: individualRepositoryFile.encoding });
                testRepositoryFiles.push({ path: individualRepositoryFile.path, content: individualRepositoryFile.content, encoding: individualRepositoryFile.encoding });
            }
        }

        codeRepositoryFiles = this.filterIndividualRepositoryFiles(codeRepositoryFiles); // TODO better solution instead of 2 times filtering
        testRepositoryFiles = this.filterIndividualRepositoryFiles(testRepositoryFiles);

        await this.repositoryManager.provideContentToCodeRepository(codeRepositoryFiles);
        if (ConfigManager.getInstance().getRepositoryConfig().general.createTestRepository) {
            await this.repositoryManager.provideContentToTestRepository(testRepositoryFiles);
        }
    }

    private filterIndividualRepositoryFiles(individualRepositoryFiles: RepositoryFile[]): RepositoryFile[] {
        let filteredIndividualRepositoryFiles: RepositoryFile[] = [];
        let keepFileIdentifiers = this.getKeepFileIdentifier(this.individualRepository.individualSelectionCollection!);
        
        for (var individualRepositoryFile of individualRepositoryFiles) {
            let includeFile = true;
            if (individualRepositoryFile.path.includes(this.filePreIdentifier)) {
                includeFile = false;
                for (let keepFileIdentifier of keepFileIdentifiers) {
                    keepFileIdentifier = this.filePreIdentifier + keepFileIdentifier;

                    if (individualRepositoryFile.path.includes(keepFileIdentifier)) {
                        individualRepositoryFile.path = individualRepositoryFile.path.replace(keepFileIdentifier, '');
                        individualRepositoryFile.content = individualRepositoryFile.content.replace(new RegExp(keepFileIdentifier, "g"), "");
                        includeFile = true;
                        break;
                    }
                }
            }
            if (includeFile) {
                filteredIndividualRepositoryFiles.push(individualRepositoryFile);
            }
        }

        return filteredIndividualRepositoryFiles;
    } 

    private getKeepFileIdentifier(individualSelectionCollection: IndividualSelectionCollection): string[] {
        let keepFileIdentifiers: string[] = [];
        for (let individualSelection of Object.values(individualSelectionCollection)) {
            keepFileIdentifiers = keepFileIdentifiers.concat(Object.values(individualSelection));
        }
        return keepFileIdentifiers;
    }

    private async getIndividualRepositoryFiles(originRepositoryFiles: RepositoryFile[]): Promise<RepositoryFile[]> {
        let individualRepositoryFiles: RepositoryFile[] = [];
        
        let contentReplacer: ContentReplacer | undefined = undefined;
        if (this.individualRepository.individualVariation) {
            contentReplacer = new ContentReplacer(this.individualRepository.individualVariation);
        }

        for (var originRepositoryFile of originRepositoryFiles) {
            let individualRepositoryFile: RepositoryFile = { path: originRepositoryFile.path, content: originRepositoryFile.content, encoding: originRepositoryFile.encoding };
            
            if (contentReplacer) {
                individualRepositoryFile = contentReplacer.replacePathAndContent(individualRepositoryFile);
            }

            let manipulatedRepositoryFiles = await this.fileManipulatorManager.manipulateRepositoryFile(individualRepositoryFile);
            individualRepositoryFiles = individualRepositoryFiles.concat(manipulatedRepositoryFiles);
        }

        return individualRepositoryFiles;
    }

    private async prepareRepositoryManager(codeRepositoryName: string, testRepositoryName: string) {
        await this.repositoryManager.createCodeRepository(codeRepositoryName);
        await this.repositoryManager.addMembersToCodeRepository(this.individualRepository.members);

        if (ConfigManager.getInstance().getRepositoryConfig().general.createTestRepository) {
            await this.repositoryManager.createTestRepository(testRepositoryName);
            await this.repositoryManager.linkCodeAndTestRepository();
        }
    }
}