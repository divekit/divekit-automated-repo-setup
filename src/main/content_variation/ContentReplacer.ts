import { ConfigManager } from "../config/ConfigManager";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { IndividualVariation } from "./IndividualVariation";
import { VariableFaultDetector } from "./VariableFaultDetector";


export class ContentReplacer {

    private originRepositoryConfig = ConfigManager.getInstance().getOriginRepositoryConfig();

    private variableFaultDetector: VariableFaultDetector | undefined = undefined;


    constructor(private individualVariation: IndividualVariation) {
        if (this.originRepositoryConfig.warnings.variableValueWarnings.activate) {
            this.variableFaultDetector = new VariableFaultDetector(individualVariation);
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
        var newContent = oldContent;
        for (var preIdentifier in this.individualVariation) {
            for (var key in this.individualVariation[preIdentifier]) {
                newContent = newContent.replace(new RegExp(`\\$${key}\\$`, "gm"), this.individualVariation[preIdentifier][key]);
            }
        }
        return newContent;
    }
}