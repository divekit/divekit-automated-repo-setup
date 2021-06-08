import { ConfigManager } from "../config/ConfigManager";

export interface SolutionDeleteResult {
    deleteFile: boolean,
    newFileContent: string
}

export class SolutionDeleter {

    private originRepositoryConfig = ConfigManager.getInstance().getOriginRepositoryConfig();

    
    constructor() { };

    public deleteSolution(fileContent: string) : SolutionDeleteResult {
        let result : SolutionDeleteResult = { deleteFile: false, newFileContent: "" };
        
        if (this.shouldFileBeDeleted(fileContent)) {
            result.deleteFile = true;
        } else {
            result.deleteFile = false;
            result.newFileContent = this.changeFileContent(fileContent);
        }

        return result;
    }

    private shouldFileBeDeleted(fileContent: string) {
        return fileContent.includes(this.originRepositoryConfig.solutionDeletion.deleteFileKey);
    }

    private changeFileContent(fileContent: string) {
        let deleteKey = this.originRepositoryConfig.solutionDeletion.deleteParagraphKey;
        let newFileContent = fileContent.replace(new RegExp(`${deleteKey}[\\s\\S]*?${deleteKey}`, "gm"), "");
        
        for (let replaceKey in this.originRepositoryConfig.solutionDeletion.replaceMap) {
            let replaceValue = this.originRepositoryConfig.solutionDeletion.replaceMap[replaceKey];
            newFileContent = newFileContent.replace(new RegExp(`${replaceKey}[\\s\\S]*?${replaceKey}`, "gm"), replaceValue);
        }
        return newFileContent;
    }
}