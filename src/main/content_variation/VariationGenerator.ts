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

    public readonly metaDataGroupId = "General";
    public readonly divideChar = "_";

    private readonly variateRepositories = ConfigManager.getInstance().getRepositoryConfig().general.variateRepositories;

    private variationsConfig?: VariationsConfig;

    private objectVariableGenerator?: ObjectVariableGenerator; // TODO better abstraction of variable generators
    private relationVariableGenerator?: RelationVariableGenerator;
    private logicVariableGenerator?: LogicVariableGenerator;

    private variablePostProcessor?: VariablePostProcessor;


    constructor() {
        if (this.variateRepositories) {
            let variablePreProcessor = new VariablePreProcessor(ConfigManager.getInstance().getVariableExtensionsConfig());
            this.variationsConfig = variablePreProcessor.processVariationsConfig(ConfigManager.getInstance().getVariationsConfig()); 
    
            this.objectVariableGenerator = new ObjectVariableGenerator(this.divideChar);
            this.relationVariableGenerator = new RelationVariableGenerator(this.divideChar);
            this.logicVariableGenerator = new LogicVariableGenerator(this.divideChar);
    
            this.variablePostProcessor = new VariablePostProcessor([this.metaDataGroupId]);
        }
    } 

    public getEmptyIndividualSelectionCollection(): IndividualSelectionCollection {
        return { individualObjectSelection: {}, individualRelationSelection: {}, individualLogicSelection: {} };
    }

    public getIndividualSelectionCollection(individualSelectionCollection: IndividualSelectionCollection): IndividualSelectionCollection {
        if (this.variateRepositories) {
            individualSelectionCollection.individualObjectSelection = this.objectVariableGenerator!.getIndividualObjectSelection(this.variationsConfig!.objects, individualSelectionCollection.individualObjectSelection);
            individualSelectionCollection.individualRelationSelection = this.relationVariableGenerator!.getIndividualRelationSelection(this.variationsConfig!.relations, individualSelectionCollection.individualRelationSelection);
            individualSelectionCollection.individualLogicSelection = this.logicVariableGenerator!.getIndividualLogicSelection(this.variationsConfig!.logic, individualSelectionCollection.individualLogicSelection);
        }
        return individualSelectionCollection;
    }

    public generateIndividualVariation(repositoryMetaData: RepositoryMetaData, individualSelectionCollection: IndividualSelectionCollection): IndividualVariation { // TODO error handling?
        let individualVariation: IndividualVariation = {};
        individualVariation = this.generateIndividualRepositoryMetaDataVariables(repositoryMetaData, individualVariation);

        if (this.variateRepositories) {
            let individualObjects = this.objectVariableGenerator!.getSelectedObjects(this.variationsConfig!.objects, individualSelectionCollection.individualObjectSelection);

            individualVariation = this.objectVariableGenerator!.generateIndividualObjectVariables(
                individualObjects, 
                individualVariation);
    
            individualVariation = this.relationVariableGenerator!.generateIndividualRelationVariables(
                individualObjects, 
                ConfigManager.getInstance().getRelationsConfig(), 
                this.variationsConfig!.relations, 
                individualVariation,
                individualSelectionCollection.individualRelationSelection);

            individualVariation = this.logicVariableGenerator!.generateIndividualLogicVariables(
                this.variationsConfig!.logic, 
                individualVariation,
                individualSelectionCollection.individualLogicSelection);

            individualVariation = this.variablePostProcessor!.processIndividualVariation(individualVariation);
        }

        return individualVariation;
    }  
    
    private generateIndividualRepositoryMetaDataVariables(repositoryMetaData: RepositoryMetaData, individualVariation: IndividualVariation): IndividualVariation {
        let preIdentifier = this.metaDataGroupId;
        individualVariation[preIdentifier] = {};

        for (let [key, value] of Object.entries(repositoryMetaData)) {
            individualVariation[preIdentifier][key] = String(value);    
        }

        return individualVariation;
    }
}