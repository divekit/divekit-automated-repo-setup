import { NestedObjectVariationRecord } from "../config_records/object/NestedObjectVariationRecord";
import { IndividualVariation } from "../IndividualVariation";
import { SerializationUtils } from "../SerializationUtils";


export abstract class VariableGenerator {

    constructor(protected divideChar: string) { };

    protected generateIndividualVariables(preIdentifier: string, identifier: string, variationRecord: NestedObjectVariationRecord, individualVariation: IndividualVariation): void {
        for (let key in variationRecord) {
            let value = variationRecord[key];
            if (value instanceof Object) {
                let newIdentifier = `${identifier}${this.divideChar}${key}`;
                this.generateIndividualVariables(preIdentifier, newIdentifier, value, individualVariation);
            } else {
                if (key !== "id") {
                    let variableKey = `${identifier}${key}`;
                    individualVariation[preIdentifier][variableKey] = SerializationUtils.valueToString(value);
                }
            }
        }
    }

    protected toArray(value: string | string[]): string[] {
        if (Array.isArray(value)) {
            return value;
        }
        return [value];
    }

    protected getRandomInt(max: number): number {
        return Math.floor(Math.random() * Math.floor(max));
    }
}