import { ObjectCloner } from "../../../utils/ObjectCloner";
import { IndividualVariation } from "../../IndividualVariation";
import { AllLowerCaseModifier } from "../modifier/AllLowerCaseModifier";
import { FirstLowerCaseModifier } from "../modifier/FirstLowerCaseModifier";


export class VariablePostProcessor {

    private readonly appliedModifiers = [ // TODO is a separate conversion for variable keys / values needed?
        new FirstLowerCaseModifier(),
        new AllLowerCaseModifier()
    ];


    constructor(private ignoreGroupKeys: string[]) { }

    public processIndividualVariation(individualVariation: IndividualVariation): IndividualVariation {
        let transformedIndividualVariation = ObjectCloner.deepCopy(individualVariation);

        for (let groupKey in individualVariation) {
            if (this.ignoreGroupKeys.includes(groupKey)) {
                continue;
            }
            
            let group = individualVariation[groupKey];
            
            for (let variableKey in group) {
                let variableValue = group[variableKey];

                let newVariables = this.applyModifiersToVariable(variableKey, variableValue);
                transformedIndividualVariation = this.insertNewVariablesIntoIndividualVariation(transformedIndividualVariation, groupKey, newVariables);
            }
        }

        return transformedIndividualVariation;
    }

    private insertNewVariablesIntoIndividualVariation(individualVariation: IndividualVariation, groupKey: string, newVariables: { [id: string] : string }): IndividualVariation {
        for (let variableKey in newVariables) {
            if (!individualVariation[groupKey][variableKey]) {
                individualVariation[groupKey][variableKey] = newVariables[variableKey];
            }
        }

        return individualVariation;
    }

    public applyModifiersToVariable(key: string, value: string): { [id: string] : string } {
        let newVariables: { [id: string] : string } = { };

        for (let modifier of this.appliedModifiers) {
            let newKey = modifier.applyToValue(key);
            let newValue = modifier.applyToValue(value);

            if (newKey !== key && !newVariables[newKey]) {
                newVariables[newKey] = newValue;
            }
        }
        return newVariables;
    }
}