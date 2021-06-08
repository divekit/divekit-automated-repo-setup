import path from "path";
import * as fs from 'fs';

import { RepositoryFile } from "./RepositoryFile";
import { RepositoryAdapter } from "../repository_adapter/RepositoryAdapter";
import { SolutionDeleter } from "../solution_deletion/SolutionDeleter";
import { ConfigManager } from "../config/ConfigManager";
import { RepositoryFileLoader } from "../repository_adapter/RepositoryFileLoader";


export class ContentRetriever {
    
    private readonly additionalFilesFolder = path.join(__dirname, '..', '..', '..', 'resources', 'additional_origin_files');
    private readonly additionalFilesWithTestRepositoryFolder = path.join(this.additionalFilesFolder, 'with_test_repository');
    private readonly additionalFilesWithoutTestRepositoryFolder = path.join(this.additionalFilesFolder, 'without_test_repository');

    private solutionDeleter: SolutionDeleter;


    constructor(public readonly repositoryAdapter: RepositoryAdapter) { 
        this.solutionDeleter = new SolutionDeleter();

        fs.mkdirSync(this.additionalFilesWithTestRepositoryFolder, { recursive: true });
        fs.mkdirSync(this.additionalFilesWithoutTestRepositoryFolder, { recursive: true });
    }

    public async retrieveOriginFiles() : Promise<RepositoryFile[]> {
        let originFiles = await this.repositoryAdapter.retrieveOriginFiles();

        if (ConfigManager.getInstance().getRepositoryConfig().general.createTestRepository) {
            originFiles = originFiles.concat(RepositoryFileLoader.loadRepositoryFiles(this.additionalFilesWithTestRepositoryFolder, 
                this.additionalFilesWithTestRepositoryFolder));
        } else {
            originFiles = originFiles.concat(RepositoryFileLoader.loadRepositoryFiles(this.additionalFilesWithoutTestRepositoryFolder, 
                this.additionalFilesWithoutTestRepositoryFolder));
        }

        return originFiles;
    }

    public filterOriginFiles(repositoryFiles: RepositoryFile[]) : RepositoryFile[] {
        let filteredRepositoryFiles : RepositoryFile[] = [];
        
        for (var repositoryFile of repositoryFiles) {
            
            if (ConfigManager.getInstance().getRepositoryConfig().general.deleteSolution) {
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