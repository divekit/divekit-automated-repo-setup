import { VariationsConfig } from '../config_records/VariationsConfig';
import { ObjectRecord } from '../config_records/object/ObjectRecord';
import { VariableExtensionsConfig } from "../config_records/VariableExtensionsConfig";
import { VariableExtensionManager } from './extensions/VariableExtensionManager';
import { NestedObjectVariationRecord } from '../config_records/object/NestedObjectVariationRecord';
import { VariableExtensionCollectionRecord } from '../config_records/extension/VariableExtensionCollectionRecord';
import { VariationGenerator } from '../VariationGenerator';


export class VariablePreProcessor {

    private readonly DIVIDE_CHAR = VariationGenerator.DIVIDE_CHAR;

    private variableExtensionManager: VariableExtensionManager;


    constructor (variableExtensionGroups: VariableExtensionsConfig) {
        this.variableExtensionManager = new VariableExtensionManager(variableExtensionGroups);
    }


    processVariationsConfig(variationsConfig: VariationsConfig) {
        console.log("Preprocess variables");

        let objectRecords = variationsConfig["objects"];

        for (var objectRecord of objectRecords) {
            this.processObjectRecord(objectRecord);
        }
    }

    private processObjectRecord(objectRecord: ObjectRecord) {
        let variableExtensionCollections = this.variableExtensionManager.getVariableExtensionCollectionsByIds(objectRecord["variableExtensions"]);

        for (var objectVariation of objectRecord["objectVariations"]) {
            this.processNestedObjectVariationRecord(objectVariation, variableExtensionCollections);
        } 
    }

    private processNestedObjectVariationRecord(objectVariationRecord: NestedObjectVariationRecord, variableExtensionCollections: VariableExtensionCollectionRecord[]) {
        this.variableExtensionManager.applyVariableExtensionsToNestedObjectVariationRecord(objectVariationRecord, variableExtensionCollections);

        for (var variableKey in objectVariationRecord) {
            if (objectVariationRecord[variableKey] instanceof Object) {
                let nestedObjectVariationRecord = objectVariationRecord[variableKey] as NestedObjectVariationRecord;
                this.processNestedObjectVariationRecord(nestedObjectVariationRecord, variableExtensionCollections);
            }
        }
    }
}