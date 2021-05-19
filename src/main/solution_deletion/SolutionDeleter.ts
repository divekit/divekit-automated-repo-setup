import { ConfigManager } from "../config/ConfigManager";

export interface SolutionDeleteResult {
    deleteFile: boolean,
    newFileContent: string
}

export class SolutionDeleter {

    private originRepositoryConfig = ConfigManager.getInstance().getOriginRepositoryConfig();

    
    constructor() { };

    deleteSolution(fileContent: string) : SolutionDeleteResult {
        let result : SolutionDeleteResult = { deleteFile: false, newFileContent: "" };
        
        if (this.shouldFileBeDeleted(fileContent)) {
            result.deleteFile = true;
        } else {
            result.deleteFile = false;
            result.newFileContent = this.changeFileContent(fileContent);
        }

        return result;
    }

    shouldFileBeDeleted(fileContent: string) {
        return fileContent.includes(this.originRepositoryConfig.solutionDeletion.deleteFileKey);
    }

    changeFileContent(fileContent: string) {
        var newFileContent = fileContent.replace(new RegExp(`${this.originRepositoryConfig.solutionDeletion.deleteParagraphKey}[\\s\\S]*?${this.originRepositoryConfig.solutionDeletion.deleteParagraphKey}`, "gm"), "");
        newFileContent = newFileContent.replace(new RegExp(`${this.originRepositoryConfig.solutionDeletion.replaceKey}[\\s\\S]*?${this.originRepositoryConfig.solutionDeletion.replaceKey}`, "gm"), this.originRepositoryConfig.solutionDeletion.replaceValue);
        return newFileContent;
    }
}