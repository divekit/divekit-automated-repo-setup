import { AllLowerCaseModifier } from '../modifier/AllLowerCaseModifier';
import { VariableExtensionCollectionRecord } from "../../config_records/extension/VariableExtensionCollectionRecord";
import { NestedObjectVariationRecord } from "../../config_records/object/NestedObjectVariationRecord";
import { FirstLowerCaseModifier } from '../modifier/FirstLowerCaseModifier';
import { Modifier } from '../modifier/Modifier';
import { VariableExtensionGroupRecord } from '../../config_records/extension/VariableExtensionGroupRecord';


export class VariableExtensionManager {

    private readonly noModifierId = "NONE";
    private readonly availableModifiers = [
        new AllLowerCaseModifier(),
        new FirstLowerCaseModifier()
    ];

    
    public applyVariableExtensionsToNestedObjectVariationRecord(nestedObjectVariation: NestedObjectVariationRecord, variableExtensionCollections: VariableExtensionCollectionRecord[]) {
        for (var variableExtensionCollection of variableExtensionCollections) {
            for (var variableKey in variableExtensionCollection) {
                if (nestedObjectVariation[variableKey] == null) {
                    let variableValueParameters = variableExtensionCollection[variableKey];
                    if (variableValueParameters != null) {
                        let referencedVariableValue = this.getVariableValueByKey(nestedObjectVariation, variableValueParameters.value);
                        if (referencedVariableValue) {
                            let modifier = this.getModifierById(variableValueParameters.modifier);
                            if (modifier != null) {
                                referencedVariableValue = modifier.applyToValue(referencedVariableValue);
                            }
                            let variableValue = 
                                variableValueParameters.preValue +
                                referencedVariableValue +
                                variableValueParameters.postValue;
                            nestedObjectVariation[variableKey] = variableValue;
                        }
                    }
                }
            }
        } 
    }

    public getVariableExtensionCollectionsByIds(variableExtensionGroups: VariableExtensionGroupRecord[], variableExtensionGroupIds: string[]): VariableExtensionCollectionRecord[] {
        let variableExtensionCollections: VariableExtensionCollectionRecord[] = [];

        for (var variableExtensionGroupId of variableExtensionGroupIds) {
            let foundVariableExtensionGroup = null;
            for (var variableExtensionGroup of variableExtensionGroups) {
                if (variableExtensionGroup.id.toUpperCase() === variableExtensionGroupId.toUpperCase()) {
                    foundVariableExtensionGroup = variableExtensionGroup;
                    variableExtensionCollections.push(foundVariableExtensionGroup.variableExtensions);
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
        if (id === this.noModifierId) {
            return null;
        }

        for (let modifier of this.availableModifiers) {
            if (modifier.getId() === id) {
                return modifier;
            }
        }

        throw Error(`Error: Referenced Modifier ${id} not found`);
    }
}