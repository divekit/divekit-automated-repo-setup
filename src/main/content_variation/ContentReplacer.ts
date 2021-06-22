import { ConfigManager } from "../config/ConfigManager";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { IndividualRepository } from "../repository_creation/IndividualRepository";
import { IndividualVariation } from "./IndividualVariation";
import { VariableFaultDetector } from "./VariableFaultDetector";


export class ContentReplacer {

    private variableFaultDetector: VariableFaultDetector | undefined = undefined;


    constructor(private individualRepository: IndividualRepository) {
        if (ConfigManager.getInstance().getRepositoryConfig().general.variateRepositories
            && ConfigManager.getInstance().getRepositoryConfig().general.activateVariableValueWarnings) {
            this.variableFaultDetector = new VariableFaultDetector(individualRepository);
        }
    }

    public replacePathAndContent(repositoryFile: RepositoryFile): RepositoryFile {
        repositoryFile.path = this.replaceContent(repositoryFile.path); 
        repositoryFile.content = this.replaceContent(repositoryFile.content); 

        if (this.variableFaultDetector) {
            this.variableFaultDetector.detectFaults(repositoryFile);
        }

        return repositoryFile;
    }

    private replaceContent(oldContent: string) {
        let individualVariation = this.individualRepository.individualVariation!;

        var newContent = oldContent;
        for (var preIdentifier in individualVariation) {
            for (var key in individualVariation[preIdentifier]) {
                newContent = newContent.replace(new RegExp(`\\$${key}\\$`, "gm"), individualVariation[preIdentifier][key]);
            }
        }
        return newContent;
    }
}