import { IndividualSelection } from "../selections/IndividualSelection";
import { ObjectRecord } from "../config_records/object/ObjectRecord";
import { ObjectVariationRecord } from "../config_records/object/ObjectVariationRecord";
import { IndividualObjects } from "../config_records/object/IndividualObjects";
import { IndividualVariation } from "../IndividualVariation";
import { VariableGenerator } from "./VariableGenerator";


export class ObjectVariableGenerator extends VariableGenerator {

    constructor(divideChar: string) { 
        super(divideChar);
    }
    

    public getIndividualObjectSelection(objects: ObjectRecord[], individualObjectSelection: IndividualSelection): IndividualSelection {
        for (var object of objects) {
            let ids = this.toArray(object.ids);
            let objectVariations: ObjectVariationRecord[] = Array.from(object.objectVariations);
            this.filterObjectVariationRecords(objectVariations, individualObjectSelection);

            for (let id of ids) {
                if (!individualObjectSelection[id]) {
                    let randomNumber = this.getRandomInt(objectVariations.length);
                    let objectVariation = objectVariations[randomNumber];
                    objectVariations.splice(randomNumber, 1);
    
                    individualObjectSelection[id] = objectVariation.id;
                }
            }
        }

        return individualObjectSelection;
    }

    private filterObjectVariationRecords(objectVariationRecords: ObjectVariationRecord[], individualObjectSelection: IndividualSelection) {
        for (let i = objectVariationRecords.length - 1; i >= 0; i--) {
            for (let fromId in individualObjectSelection) {
                let toId = individualObjectSelection[fromId];
                if (objectVariationRecords[i].id === toId) {
                    objectVariationRecords.splice(i, 1);
                    break;
                }
            }
        }
    }

    public getSelectedObjects(objects: ObjectRecord[], individualObjectSelection: IndividualSelection): IndividualObjects {
        let individualObjects: IndividualObjects = {};
        for (var object of objects) {
            let ids = this.toArray(object.ids);
            let objectVariations: ObjectVariationRecord[] = Array.from(object.objectVariations);

            for (let id of ids) {
                let objectVariation = this.getObjectVariationRecordById(objectVariations, individualObjectSelection[id]);
                individualObjects[id] = objectVariation;
            }
        }
        return individualObjects;
    }

    public generateIndividualObjectVariables(objects: IndividualObjects, individualVariation: IndividualVariation): IndividualVariation {
        for (var objectId in objects) {
            let object = objects[objectId];
            individualVariation[objectId] = {};

            this.generateIndividualVariables(objectId, objectId, object, individualVariation);
        }
        return individualVariation;
    }

    private getObjectVariationRecordById(objectVariations: ObjectVariationRecord[], id: string): ObjectVariationRecord {
        for (let objectVariation of objectVariations) {
            if (objectVariation.id === id) {
                return objectVariation;
            }
        }
        throw Error(`Could not find Object Variation with id ${id}`);
    }
}
