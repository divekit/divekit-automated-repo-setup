import { RelationVariableGenerator } from './variable_generator/RelationVariableGenerator';
import { ObjectVariableGenerator } from './variable_generator/ObjectVariableGenerator';
import { RepositoryMetaData } from './RepositoryMetaData';
import { LogicVariableGenerator } from './variable_generator/LogicVariableGenerator';
import { IndividualSelectionCollection } from './selections/IndividualSelectionCollection';
import { VariationsConfig } from './config_records/VariationsConfig';
import { IndividualVariation } from './IndividualVariation';
import { ConfigManager } from '../config/ConfigManager';
import { VariablePreProcessor } from './variable_processor/VariablePreProcessor';


export class VariationGenerator {

    public static readonly DIVIDE_CHAR = "_";

    private variationsConfig: VariationsConfig;

    private objectVariableGenerator: ObjectVariableGenerator; // TODO better abstraction of variable generators
    private relationVariableGenerator: RelationVariableGenerator;
    private logicVariableGenerator: LogicVariableGenerator;


    constructor() {
        let variablePreProcessor = new VariablePreProcessor(ConfigManager.getInstance().getVariableExtensionsConfig());
        this.variationsConfig = variablePreProcessor.processVariationsConfig(ConfigManager.getInstance().getVariationsConfig()); 

        this.objectVariableGenerator = new ObjectVariableGenerator(VariationGenerator.DIVIDE_CHAR);
        this.relationVariableGenerator = new RelationVariableGenerator(VariationGenerator.DIVIDE_CHAR);
        this.logicVariableGenerator = new LogicVariableGenerator(VariationGenerator.DIVIDE_CHAR);
    } 

    public getEmptyIndividualSelectionCollection(): IndividualSelectionCollection {
        return { "individualObjectSelection": {}, "individualRelationSelection": {}, "individualLogicSelection": {} };
    }

    public getIndividualSelectionCollection(individualSelectionCollection: IndividualSelectionCollection): IndividualSelectionCollection {
        if (this.variationsConfig) {
            individualSelectionCollection.individualObjectSelection = this.objectVariableGenerator.getIndividualObjectSelection(this.variationsConfig.objects, individualSelectionCollection.individualObjectSelection);
            individualSelectionCollection.individualRelationSelection = this.relationVariableGenerator.getIndividualRelationSelection(this.variationsConfig.relations, individualSelectionCollection.individualRelationSelection);
            individualSelectionCollection.individualLogicSelection = this.logicVariableGenerator.getIndividualLogicSelection(this.variationsConfig.logic, individualSelectionCollection.individualLogicSelection);
        }
        return individualSelectionCollection;
    }

    public generateIndividualVariation(repositoryMetaData: RepositoryMetaData, individualSelectionCollection: IndividualSelectionCollection): IndividualVariation { // TODO error handling?
        let individualVariation: IndividualVariation = {};
        individualVariation = this.generateIndividualRepositoryMetaDataVariables(repositoryMetaData, individualVariation);

        if (this.variationsConfig) {
            let individualObjects = this.objectVariableGenerator.getSelectedObjects(this.variationsConfig.objects, individualSelectionCollection.individualObjectSelection);

            individualVariation = this.objectVariableGenerator.generateIndividualObjectVariables(
                individualObjects, 
                individualVariation);
    
            individualVariation = this.relationVariableGenerator.generateIndividualRelationVariables(
                individualObjects, 
                ConfigManager.getInstance().getRelationsConfig(), 
                this.variationsConfig.relations, 
                individualVariation,
                individualSelectionCollection.individualRelationSelection);

            individualVariation = this.logicVariableGenerator.generateIndividualLogicVariables(
                this.variationsConfig.logic, 
                individualVariation,
                individualSelectionCollection.individualLogicSelection);
        }

        return individualVariation;
    }  
    
    private generateIndividualRepositoryMetaDataVariables(repositoryMetaData: RepositoryMetaData, individualVariation: IndividualVariation): IndividualVariation {
        let preIdentifier = "General";
        individualVariation[preIdentifier] = {};

        for (let [key, value] of Object.entries(repositoryMetaData)) {
            individualVariation[preIdentifier][key] = String(value);    
        }

        return individualVariation;
    }
}