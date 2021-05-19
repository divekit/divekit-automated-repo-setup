import { RepositoryFile } from "./RepositoryFile";
import { RepositoryManager } from "../repository_manager/RepositoryManager";
import { SolutionDeleter } from "../solution_deletion/SolutionDeleter";
import { ConfigManager } from "../config/ConfigManager";


export class ContentRetriever {
    
    private solutionDeleter: SolutionDeleter;

    constructor(public readonly repositoryManager: RepositoryManager) { 
        this.solutionDeleter = new SolutionDeleter();
    }

    async retrieveOriginFiles() : Promise<RepositoryFile[]> {
        return await this.repositoryManager.retrieveOriginFiles();
    }

    filterOriginFiles(repositoryFiles: RepositoryFile[]) : RepositoryFile[] {
        let filteredRepositoryFiles : RepositoryFile[] = [];
        
        for (var repositoryFile of repositoryFiles) {
            
            if (ConfigManager.getInstance().getOriginRepositoryConfig().solutionDeletion.deleteSolution) {
                let solutionDeleterResult = this.solutionDeleter.deleteSolution(repositoryFile.content);
                if (!solutionDeleterResult.deleteFile) {
                    repositoryFile.content = solutionDeleterResult.newFileContent;
                    filteredRepositoryFiles.push(repositoryFile);
                }
            } else {
                filteredRepositoryFiles.push(repositoryFile);
            }
        }

        return filteredRepositoryFiles;
    }
}