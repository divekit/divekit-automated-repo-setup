import { VariationsConfig } from '../../config_records/VariationsConfig';
import { ObjectRecord } from '../../config_records/object/ObjectRecord';
import { VariableExtensionManager } from './VariableExtensionManager';
import { NestedObjectVariationRecord } from '../../config_records/object/NestedObjectVariationRecord';
import { VariableExtensionCollectionRecord } from '../../config_records/extension/VariableExtensionCollectionRecord';
import { ObjectCloner } from '../../../utils/ObjectCloner';
import { VariableExtensionGroupRecord } from '../../config_records/extension/VariableExtensionGroupRecord';


export class VariablePreProcessor {

    private variableExtensionManager: VariableExtensionManager;


    constructor () {
        this.variableExtensionManager = new VariableExtensionManager();
    }


    public processVariationsConfig(variableExtensionGroups: VariableExtensionGroupRecord[], variationsConfig: VariationsConfig): VariationsConfig {
        variationsConfig = ObjectCloner.deepCopy(variationsConfig);
        let objectRecords = variationsConfig.objects;

        for (var objectRecord of objectRecords) {
            this.processObjectRecord(variableExtensionGroups, objectRecord);
        }

        return variationsConfig;
    }

    private processObjectRecord(variableExtensionGroups: VariableExtensionGroupRecord[], objectRecord: ObjectRecord) {
        let variableExtensionCollections = this.variableExtensionManager.getVariableExtensionCollectionsByIds(variableExtensionGroups, objectRecord.variableExtensions);

        for (var objectVariation of objectRecord.objectVariations) {
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