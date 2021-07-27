import { RelationVariableGenerator } from './variable_generator/RelationVariableGenerator';
import { ObjectVariableGenerator } from './variable_generator/ObjectVariableGenerator';
import { RepositoryMetaData } from './RepositoryMetaData';
import { LogicVariableGenerator } from './variable_generator/LogicVariableGenerator';
import { IndividualSelectionCollection } from './selections/IndividualSelectionCollection';
import { VariationsConfig } from './config_records/VariationsConfig';
import { IndividualVariation } from './IndividualVariation';
import { ConfigManager } from '../config/ConfigManager';
import { VariablePreProcessor } from './variable_processor/pre_processor/VariablePreProcessor';
import { VariablePostProcessor } from './variable_processor/post_processor/VariablePostProcessor';


export class VariationGenerator {

    public static readonly metaDataGroupId = "General";
    public static readonly divideChar = "_";

    private variationsConfig?: VariationsConfig;

    private variablePreProcessor: VariablePreProcessor;

    private objectVariableGenerator: ObjectVariableGenerator; // TODO better abstraction of variable generators
    private relationVariableGenerator: RelationVariableGenerator;
    private logicVariableGenerator: LogicVariableGenerator;

    private variablePostProcessor: VariablePostProcessor;


    constructor() {
        this.variablePreProcessor = new VariablePreProcessor();

        this.objectVariableGenerator = new ObjectVariableGenerator(VariationGenerator.divideChar);
        this.relationVariableGenerator = new RelationVariableGenerator(VariationGenerator.divideChar);
        this.logicVariableGenerator = new LogicVariableGenerator(VariationGenerator.divideChar);

        this.variablePostProcessor = new VariablePostProcessor([VariationGenerator.metaDataGroupId]);

        if (ConfigManager.getInstance().getRepositoryConfig().general.variateRepositories) {
            this.variationsConfig = this.variablePreProcessor.processVariationsConfig(ConfigManager.getInstance().getVariableExtensionsConfig(), ConfigManager.getInstance().getVariationsConfig()); 
        }
    } 

    public getEmptyIndividualSelectionCollection(): IndividualSelectionCollection {
        return { individualObjectSelection: {}, individualRelationSelection: {}, individualLogicSelection: {} };
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

            individualVariation = this.variablePostProcessor.processIndividualVariation(individualVariation);
        }

        return individualVariation;
    }  
    
    private generateIndividualRepositoryMetaDataVariables(repositoryMetaData: RepositoryMetaData, individualVariation: IndividualVariation): IndividualVariation {
        let preIdentifier = VariationGenerator.metaDataGroupId;
        individualVariation[preIdentifier] = {};

        for (let [key, value] of Object.entries(repositoryMetaData)) {
            individualVariation[preIdentifier][key] = String(value);    
        }

        return individualVariation;
    }
}