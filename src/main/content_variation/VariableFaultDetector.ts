import { ConfigManager } from "../config/ConfigManager";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { Logger } from "../logging/Logger";
import { IndividualRepository } from "../repository_creation/IndividualRepository";
import { NestedObjectVariationRecord } from "./config_records/object/NestedObjectVariationRecord";
import { VariationsConfig } from "./config_records/VariationsConfig";
import { ContentReplacer } from "./ContentReplacer";
import { IndividualVariation } from "./IndividualVariation";
import { VariablePreProcessor } from "./variable_processor/pre_processor/VariablePreProcessor";


export class VariableFaultDetector {

    private ignoreFilesContains = [ "norepo" ];

    private readonly variableDelimiter = ConfigManager.getInstance().getOriginRepositoryConfig().variables.variableDelimiter;

    private originRepositoryConfig = ConfigManager.getInstance().getOriginRepositoryConfig();
        
    private blackListedVariableValues: string[] = [];


    constructor(private individualRepository: IndividualRepository) {
        this.identifyBlackListedVariableValues(individualRepository.individualVariation!);
        this.identifyIgnoreFilesContains();
    }

    public identifyBlackListedVariableValues(individualVariation: IndividualVariation) {
        let allVariableValues = this.getAllVariableValues();
        let allIndividualVariableValues = this.getAllVariableValuesFromIndividualVariation(individualVariation);
        
        this.blackListedVariableValues = [];
        for (let variableValue of allVariableValues) {
            if (!this.variableValueListContainsItem(allIndividualVariableValues, variableValue) 
                && !this.variableValueListContainsItem(this.originRepositoryConfig.warnings.variableValueWarnings.ignoreList, variableValue)) {
                this.blackListedVariableValues.push(variableValue);
            }
        }
    }

    public identifyIgnoreFilesContains() {
        const ignoreFileList = this.originRepositoryConfig?.warnings?.variableValueWarnings?.ignoreFileList;
        if (Array.isArray(ignoreFileList)) {
            for (let filename of ignoreFileList) {
                this.ignoreFilesContains.push(filename);
            }
        }
    }

    private getAllVariableValuesFromIndividualVariation(individualVariation: IndividualVariation): string[] {
        let allIndividualVariableValues: string[] = []; 

        for (let variableSetKey in individualVariation) {
            let variableSet = individualVariation[variableSetKey];
            for (let variableKey in variableSet) {
                let variableValue = variableSet[variableKey];
                allIndividualVariableValues.push(variableValue);
            }
        }

        return allIndividualVariableValues;
    }

    private getAllVariableValues(): string[] {
        let variablePreProcessor = new VariablePreProcessor();
        let preProcessedVariationsConfig = variablePreProcessor.processVariationsConfig(
            ConfigManager.getInstance().getVariableExtensionsConfig(), 
            ConfigManager.getInstance().getVariationsConfig()); 

        let allVariableValues: string[] = []; 

        allVariableValues = allVariableValues.concat(this.getAllVariableValuesFromObjectRecords(preProcessedVariationsConfig));
        allVariableValues = allVariableValues.concat(this.getAllVariableValuesFromLogicRecords(preProcessedVariationsConfig));

        return allVariableValues;
    }

    private getAllVariableValuesFromObjectRecords(variationsConfig: VariationsConfig): string[] {
        let allObjectVariableValues: string[] = []; 

        for (let objectRecord of variationsConfig.objects) {
            for (let objectVariation of objectRecord.objectVariations) {
                this.getAllVariableValuesFromVariationRecord(objectVariation, allObjectVariableValues);
            }
        }

        return allObjectVariableValues;
    }

    private getAllVariableValuesFromVariationRecord(variationRecord: NestedObjectVariationRecord, allVariationRecordValues: string[]) {
        for (let variableKey in variationRecord) {
            let variableValue = variationRecord[variableKey];
            if (variableValue instanceof Object) {
                this.getAllVariableValuesFromVariationRecord(variableValue, allVariationRecordValues);
            } else {
                if (!allVariationRecordValues.includes(String(variableValue))) {
                    allVariationRecordValues.push(String(variableValue));
                }
            }
        }

        return allVariationRecordValues;
    }

    private getAllVariableValuesFromLogicRecords(variationsConfig: VariationsConfig): string[] {
        let allLogicVariableValues: string[] = []; 

        for (let logicRecord of variationsConfig.logic) {
            for (let logicVariation of logicRecord.logicVariations) {
                for (let variableKey in logicVariation) {
                    if (variableKey !== "id") {
                        let variableValue = logicVariation[variableKey];
                        if (!allLogicVariableValues.includes(String(variableValue))) { // TODO does this work for type object?
                            allLogicVariableValues.push(String(variableValue));
                        }
                    }
                }
            }
        }

        return allLogicVariableValues;
    }

    public detectFaults(repositoryFile: RepositoryFile) {
        if (!this.ignoreFile(repositoryFile)) {
            if (this.variableDelimiter.length > 0 && (this.detectRemainingDelimiter(repositoryFile.path) || this.detectRemainingDelimiter(repositoryFile.content))) {
                Logger.getInstance().warning(`There are remaining "${this.variableDelimiter}" in the file: ${repositoryFile.path}`, this.individualRepository.id!, true);
            }

            for (let blackListedVariableValue of this.blackListedVariableValues) {
                if (repositoryFile.path.includes(blackListedVariableValue) || repositoryFile.content.includes(blackListedVariableValue)) {
                    Logger.getInstance().warning(`The variable value "${blackListedVariableValue}" should not be contained in the file: ${repositoryFile.path}`, this.individualRepository.id!, true);
                }
            }
        }
    }

    private detectRemainingDelimiter(content: string): boolean {
        let escapeVariableDelimiter = ContentReplacer.escapeVariableDelimiter(this.variableDelimiter);
        let regex = new RegExp(`\\S*${escapeVariableDelimiter}+\\S*`, "g");
        let resultArray = content.match(regex);

        if (!resultArray) {
            return false;
        }

        for (let result of resultArray) {
            if (!this.variableValueContainsList(this.originRepositoryConfig.warnings.variableValueWarnings.ignoreList, result)) {
                return true;
            }
        }

        return false;
    }

    private variableValueListContainsItem(variableValues: string[], checkVariableValue: string): boolean {
        for (let variableValue of variableValues) {
            if (new RegExp(checkVariableValue, "i").test(variableValue)) {
                return true;
            }
        }
        return false;
    }

    private variableValueContainsList(variableValues: string[], checkVariableValue: string): boolean {
        for (let variableValue of variableValues) {
            if (new RegExp(variableValue, "i").test(checkVariableValue)) {
                return true;
            }
        }
        return false;
    }

    private ignoreFile(repositoryFile: RepositoryFile): boolean {
        for (let ignoreFileIdentifier of this.ignoreFilesContains) {
            if (repositoryFile.path.includes(ignoreFileIdentifier)) {
                return true;
            }
        }

        for (let whiteListIdentifier of this.originRepositoryConfig.warnings.variableValueWarnings.typeWhiteList) {
            if (repositoryFile.path.endsWith(`.${whiteListIdentifier}`)) {
                return false;
            }
        }

        return true;
    }
}