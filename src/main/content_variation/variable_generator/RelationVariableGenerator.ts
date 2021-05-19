import { SerializationUtils } from "../SerializationUtils";
import { IndividualSelection } from "../selections/IndividualSelection";
import { RelationRecord } from "../config_records/relation/RelationRecord";
import { RelationObjectRecord } from "../config_records/relation/RelationObjectRecord";
import { IndividualObjects } from "../config_records/object/IndividualObjects";
import { RelationShipTypeRecord } from "../config_records/relation/RelationShipTypeRecord";
import { ObjectVariationRecord } from "../config_records/object/ObjectVariationRecord";
import { IndividualVariation } from "../IndividualVariation";
import { VariableGenerator } from "./VariableGenerator";


export class RelationVariableGenerator extends VariableGenerator {
    
    constructor(divideChar: string) { 
        super(divideChar);
    }

    
    public getIndividualRelationSelection(relationVariations: RelationRecord[], individualRelationSelection: IndividualSelection): IndividualSelection {
        for (let relationVariation of relationVariations) {
            let relationShipsArray = relationVariation.relationShips;
            let relationObjectsArray = Array.from(relationVariation.relationObjects);

            if (relationShipsArray.length !== relationObjectsArray.length) {
                throw Error("The length of the arrays relationShips and relationObjects need to be equal");
            }
        
            this.filterRelationObjectRecords(relationObjectsArray, individualRelationSelection);
            for (let relationShip of relationShipsArray) {
                let relationShipId = relationShip.id;
                if (!individualRelationSelection[relationShipId]) {
                    let randomNumber = this.getRandomInt(relationObjectsArray.length);
                    let relationObjects = relationObjectsArray[randomNumber];
                    relationObjectsArray.splice(randomNumber, 1);

                    individualRelationSelection[relationShipId] = relationObjects.id;
                }
            }
        }

        return individualRelationSelection;
    }

    private filterRelationObjectRecords(relationObjectRecords: RelationObjectRecord[], individualRelationSelection: IndividualSelection) {
        for (let i = relationObjectRecords.length - 1; i >= 0; i--) {
            for (let fromId in individualRelationSelection) {
                let toId = individualRelationSelection[fromId];
                if (relationObjectRecords[i].id === toId) {
                    relationObjectRecords.splice(i, 1);
                    break;
                }
            }
        }
    }

    public generateIndividualRelationVariables(objects: IndividualObjects, relations: RelationShipTypeRecord[], relationVariations: RelationRecord[], individualVariation: IndividualVariation, individualRelationSelection: IndividualSelection): IndividualVariation {
        for (let relationVariation of relationVariations) {
            let relationShipsArray = relationVariation.relationShips;
            let relationObjectsArray = Array.from(relationVariation.relationObjects);
        
            for (let relationShip of relationShipsArray) {
                let relationObjects = this.getRelationObjectRecordById(relationObjectsArray, individualRelationSelection[relationShip.id]);

                // Generate relation related variables
                individualVariation = this.generateIndividualRelationVariable(objects, relationObjects, relations, relationShip.relationType, relationShip.id, individualVariation);

                // Generate object related variables
                individualVariation = this.generateIndividualRelationVariable(objects, relationObjects, relations, relationShip.relationType, relationObjects.id, individualVariation);
            }
        }

        return individualVariation;
    }

    private generateIndividualRelationVariable(objects: IndividualObjects, relationObjects: RelationObjectRecord, relations: RelationShipTypeRecord[], relationType: string, preIdentifier: string, individualVariation: IndividualVariation): IndividualVariation {
        let relation = this.getRelationById(relations, relationType);
        if (relation === null) {
            throw Error(`Could not find relation with Id: ${relationType}`);
        }

        individualVariation[preIdentifier] = {};

        for (var key in relation) {
            if (key !== "id") {
                let variableKey = `${preIdentifier}${this.divideChar}${key}`;
                individualVariation[preIdentifier][variableKey] = relation[key];
            }
        }

        for (var relationObjectKey in relationObjects) {
            if (relationObjectKey !== "id") {
                let relationObject = this.getObjectById(objects, relationObjects[relationObjectKey]);
                if (relationObject == null) {
                    throw Error(`Could not find object with Id: ${relationObjects[relationObjectKey]}`);
                }
        
                let identifier = `${preIdentifier}${this.divideChar}${relationObjectKey.charAt(0).toUpperCase() + relationObjectKey.slice(1)}`; 
                this.generateIndividualVariables(preIdentifier, identifier, relationObject, individualVariation);
            }
        }

        return individualVariation;
    }

    private getRelationObjectRecordById(relationObjectRecords: RelationObjectRecord[], id: string): RelationObjectRecord {
        for (let relationObjectRecord of relationObjectRecords) {
            if (relationObjectRecord.id === id) {
                return relationObjectRecord;
            }
        }
        throw Error(`Could not find Relation Variation with id ${id}`);
    }

    private getRelationById(relations: RelationShipTypeRecord[], id: string): RelationShipTypeRecord | null {
        for (var relation of relations) {
            if (relation.id === id) {
                return relation;
            }
        }
        return null;
    }

    private getObjectById(objects: IndividualObjects, id: string): ObjectVariationRecord {
        return objects[id];
    }
}