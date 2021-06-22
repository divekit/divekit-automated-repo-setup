import { ConfigManager } from "../config/ConfigManager";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { IndividualRepository } from "../repository_creation/IndividualRepository";
import { IndividualVariation } from "./IndividualVariation";
import { ReplaceVariable } from "./ReplaceVariable";
import { VariableFaultDetector } from "./VariableFaultDetector";


export class ContentReplacer {

    private readonly tmpCharSeparator = "$";
    private readonly variableDelimeter: string;

    private variableFaultDetector: VariableFaultDetector | undefined = undefined;
    private replaceVariables: ReplaceVariable[];


    constructor(individualRepository: IndividualRepository) {
        this.variableDelimeter = this.calculateVariableDelimeter();
        this.replaceVariables = this.calculateReplaceVariables(individualRepository.individualVariation!);

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
        var newContent = oldContent;

        for (let replaceVariable of this.replaceVariables) {
            newContent = newContent.replace(new RegExp(`${this.variableDelimeter}${replaceVariable.name}${this.variableDelimeter}`, "gm"), replaceVariable.value);
        }

        if (this.variableDelimeter.length == 0) {
            newContent = newContent.replace(new RegExp(`\\${this.tmpCharSeparator}`, "gm"), "");
        }

        return newContent;
    }

    private calculateReplaceVariables(individualVariation: IndividualVariation): ReplaceVariable[] {
        let replaceVariables: ReplaceVariable[] = [];

        for (let preIdentifier in individualVariation) {
            for (let key in individualVariation[preIdentifier]) {
                replaceVariables.push({ 
                    name: key, 
                    value: this.calculateReplaceVariableValue(individualVariation[preIdentifier][key]) 
                });
            }
        }

        if (this.variableDelimeter.length == 0) {
            replaceVariables.sort((a, b) => b.name.length - a.name.length);
        }
        return replaceVariables;
    }

    private calculateReplaceVariableValue(value: string): string {
        if (this.variableDelimeter.length > 0) {
            return value;
        }

        let newValue = this.tmpCharSeparator;
        for (let i = 0; i < value.length; i++) {
            newValue += value.charAt(i) + this.tmpCharSeparator;
        }

        return newValue;
    }

    private calculateVariableDelimeter(): string {
        let variableDelimeter = ConfigManager.getInstance().getOriginRepositoryConfig().variables.variableDelimeter;
        return variableDelimeter.length == 1 ? `\\${variableDelimeter}` : variableDelimeter;
    }
}