import { SerializationUtils } from "../SerializationUtils";
import { IndividualSelection } from "../selections/IndividualSelection";
import { LogicRecord } from "../config_records/logic/LogicRecord";
import { LogicVariationRecord } from "../config_records/logic/LogicVariationRecord";
import { IndividualVariation } from "../IndividualVariation";
import { VariableGenerator } from "./VariableGenerator";


export class LogicVariableGenerator extends VariableGenerator {

    constructor(divideChar: string) { 
        super(divideChar);
    }
    

    public getIndividualLogicSelection(logicRecords: LogicRecord[], individualLogicSelection: IndividualSelection): IndividualSelection {
        for (var logicRecord of logicRecords) {
            let id = logicRecord.id;
            let logicVariations: LogicVariationRecord[] = logicRecord.logicVariations;

            if (!individualLogicSelection[id]) {
                let randomNumber = this.getRandomInt(logicVariations.length);
                let logicVariation = logicVariations[randomNumber];

                individualLogicSelection[id] = logicVariation.id;
            }
        }

        return individualLogicSelection;
    }

    public generateIndividualLogicVariables(logicRecords: LogicRecord[], individualVariation: IndividualVariation, individualLogicSelection: IndividualSelection): IndividualVariation {
        for (var logicRecord of logicRecords) {
            let id = logicRecord.id;
            let logicVariations: LogicVariationRecord[] = logicRecord.logicVariations;
            let logicVariation = this.getLogicVariationRecordById(logicVariations, individualLogicSelection[id]);

            individualVariation[id] = {};

            for (let key in logicVariation) {
                if (key !== "id") {
                    let variableKey = `${id}${key}`;
                    individualVariation[id][variableKey] = SerializationUtils.valueToString(logicVariation[key]);
                }
            }
        }
        
        return individualVariation;
    }

    private getLogicVariationRecordById(logicVariationRecords: LogicVariationRecord[], id: string): LogicVariationRecord {
        for (let logicVariation of logicVariationRecords) {
            if (logicVariation.id === id) {
                return logicVariation;
            }
        }
        throw Error(`Could not find Logic Variation with id ${id}`);
    }
}
