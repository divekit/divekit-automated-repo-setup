import { ConfigManager } from "../config/ConfigManager";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { IndividualRepository } from "../repository_creation/IndividualRepository";
import { IndividualVariation } from "./IndividualVariation";
import { ReplaceVariable } from "./ReplaceVariable";
import { VariableFaultDetector } from "./VariableFaultDetector";
import { VariationGenerator } from "./VariationGenerator";


export class ContentReplacer {

    private readonly tmpCharSeparator = "\\$\\$\\$";
    private readonly variableDelimiter = ConfigManager.getInstance().getOriginRepositoryConfig().variables.variableDelimiter;

    private variableFaultDetector: VariableFaultDetector | undefined = undefined;
    private replaceVariables: ReplaceVariable[];


    constructor(individualRepository: IndividualRepository) {
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
        let escapeVariableDelimiter = ContentReplacer.escapeVariableDelimiter(this.variableDelimiter);
        var newContent = oldContent;

        for (let replaceVariable of this.replaceVariables) {
            newContent = newContent.replace(new RegExp(`${escapeVariableDelimiter}${replaceVariable.name}${escapeVariableDelimiter}`, "gm"), replaceVariable.value);
        }

        if (this.variableDelimiter.length == 0) {
            newContent = newContent.replace(new RegExp(`${this.tmpCharSeparator}`, "gm"), "");
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

        if (this.variableDelimiter.length == 0 || this.variableDelimiter == VariationGenerator.divideChar) {
            replaceVariables.sort((a, b) => b.name.length - a.name.length);
        }
        return replaceVariables;
    }

    private calculateReplaceVariableValue(value: string): string {
        if (this.variableDelimiter.length > 0) {
            return value;
        }

        let newValue = this.tmpCharSeparator;
        for (let i = 0; i < value.length; i++) {
            newValue += value.charAt(i) + this.tmpCharSeparator;
        }

        return newValue;
    }

    public static escapeVariableDelimiter(delimiter: string): string {
        return delimiter.length == 1 ? `\\${delimiter}` : delimiter;
    }
}