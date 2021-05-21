import { AllLowerCaseModifier } from './modifier/AllLowerCaseModifier';
import { VariableExtensionsConfig } from "../../config_records/VariableExtensionsConfig";
import { VariableExtensionCollectionRecord } from "../../config_records/extension/VariableExtensionCollectionRecord";
import { NestedObjectVariationRecord } from "../../config_records/object/NestedObjectVariationRecord";
import { FirstLowerCaseModifier } from './modifier/FirstLowerCaseModifier';
import { Modifier } from './modifier/Modifier';


export class VariableExtensionManager {

    public constructor (private variableExtensionGroups: VariableExtensionsConfig) { }

    
    public applyVariableExtensionsToNestedObjectVariationRecord(nestedObjectVariation: NestedObjectVariationRecord, variableExtensionCollections: VariableExtensionCollectionRecord[]) {
        for (var variableExtensionCollection of variableExtensionCollections) {
            for (var variableKey in variableExtensionCollection) {
                if (nestedObjectVariation[variableKey] == null) {
                    let variableValueParameters = variableExtensionCollection[variableKey];
                    if (variableValueParameters != null) {
                        let referencedVariableValue = this.getVariableValueByKey(nestedObjectVariation, variableValueParameters["value"]);
                        if (referencedVariableValue) {
                            let modifier = this.getModifierById(variableValueParameters["modifier"]);
                            if (modifier != null) {
                                referencedVariableValue = modifier.applyModifierToValue(referencedVariableValue);
                            }
                            let variableValue = 
                                variableValueParameters["preValue"] +
                                referencedVariableValue +
                                variableValueParameters["postValue"];
                            nestedObjectVariation[variableKey] = variableValue;
                        }
                    }
                }
            }
        } 
    }

    public getVariableExtensionCollectionsByIds(variableExtensionGroupIds: string[]): VariableExtensionCollectionRecord[] {
        let variableExtensionCollections: VariableExtensionCollectionRecord[] = [];

        for (var variableExtensionGroupId of variableExtensionGroupIds) {
            let foundVariableExtensionGroup = null;
            for (var variableExtensionGroup of this.variableExtensionGroups) {
                if (variableExtensionGroup["id"].toUpperCase() === variableExtensionGroupId.toUpperCase()) {
                    foundVariableExtensionGroup = variableExtensionGroup;
                    variableExtensionCollections.push(foundVariableExtensionGroup["variableExtensions"]);
                    break;
                }
            }

            if (foundVariableExtensionGroup == null) {
                throw Error(`Error: Variable Extension Group not found by id: ${variableExtensionGroupId}`);
            }
        }

        return variableExtensionCollections;
    }

    private getVariableValueByKey(nestedObjectVariation: NestedObjectVariationRecord, key: string): string | undefined {
        let variableValue: string | number | object = nestedObjectVariation[key];
        
        if (variableValue == null  || !(typeof variableValue === 'string')) {
            return undefined;
        }

        return variableValue;
    }

    private getModifierById(id: string): Modifier | null {
        if (id === "FIRST_LOWER_CASE") {
            return new FirstLowerCaseModifier();
        } else if (id === "ALL_LOWER_CASE") {
            return new AllLowerCaseModifier();
        } else if (id === "NONE") {
            return null;
        }

        throw Error(`Error: Referenced Modifier ${id} not found`);
    }
}