import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { VariationGenerator } from '../content_variation/VariationGenerator';
import { TimeStampCreator } from '../utils/TimeStampCreator';
import { IndividualRepository } from './IndividualRepository';
import { ConfigManager } from '../config/ConfigManager';


export class IndividualRepositoryManager {

    private readonly individualRepositoriesFolder = path.join(__dirname, '..', '..', '..', 'individual_repositories');

    private repositoryConfig = ConfigManager.getInstance().getRepositoryConfig();
    private variationGenerator: VariationGenerator;


    constructor() {
        this.variationGenerator = new VariationGenerator();
        this.initializeIndividualRepositoriesFolder();
    }

    private initializeIndividualRepositoriesFolder() {
        fs.mkdirSync(this.individualRepositoriesFolder, { recursive: true });
    }

    private saveIndividualRepositories(individualRepositories: IndividualRepository[]): void {
        // Get file name
        let filePath;
        if (this.repositoryConfig.individualRepositoryPersist.useSavedIndividualRepositories) {
            filePath = path.join(this.individualRepositoriesFolder, this.repositoryConfig.individualRepositoryPersist.savedIndividualRepositoriesFileName);
        } else {
            filePath = path.join(this.individualRepositoriesFolder, this.generateFileName());
        }
        // Write File
        let fileContent = JSON.stringify(individualRepositories, null, 4);
        fs.writeFileSync(filePath, fileContent, 'utf8');
    }

    private generateFileName(): string {
        let fileName = "individual_repositories_" + TimeStampCreator.createTimeStamp() + ".json";
        return fileName;
    }

    private loadIndividualRepositories(): IndividualRepository[] {
        let filePath = path.join(this.individualRepositoriesFolder, this.repositoryConfig.individualRepositoryPersist.savedIndividualRepositoriesFileName);

        let fileContent = fs.readFileSync(filePath).toString();

        let individualRepositories: IndividualRepository[] = [];
        for (let individualRepository of JSON.parse(fileContent)) {
            individualRepositories.push(Object.assign(new IndividualRepository, individualRepository));
        }

        return individualRepositories;
    }

    private createIndividualRepository(members: string[] | undefined): IndividualRepository {
        let uuid = uuidv4();

        let individualSelectionCollection = this.variationGenerator.getEmptyIndividualSelectionCollection();
        return new IndividualRepository(uuid, members, individualSelectionCollection);
    }

    private doesIndividualRepositoryExist(individualRepositories: IndividualRepository[], members: string[]): boolean {
        for (let individualRepository of individualRepositories) {
            if (individualRepository.compareMembers(members)) {
                return true;
            }
        }
        return false;
    }

    private updateIndividualSelectionCollections(individualRepositories: IndividualRepository[]) {
        for (let individualRepository of individualRepositories) {
            individualRepository.individualSelectionCollection = this.variationGenerator.getIndividualSelectionCollection(individualRepository.individualSelectionCollection!);
        }
    }

    private updateIndividualVariations(individualRepositories: IndividualRepository[]) {
        for (let individualRepository of individualRepositories) {
            individualRepository.individualVariation = this.variationGenerator.generateIndividualVariation({ Id: individualRepository.id! }, individualRepository.individualSelectionCollection!);
            console.log(`Info: Generated variables for repository with id ${individualRepository.id}`);
            console.log(individualRepository.individualVariation);
        }
    }

    private createIndividualRepositories(): IndividualRepository[] {
        console.log("Load existing individual repositories");
        let individualRepositories: IndividualRepository[] = this.repositoryConfig.individualRepositoryPersist.useSavedIndividualRepositories 
                                                                ? this.loadIndividualRepositories() : [];
        if (this.repositoryConfig.general.repositoryMembers.length == 0) {
            console.log("Create missing individual repositories without members");
            for (let i = individualRepositories.length; i < this.repositoryConfig.general.repositoryCount; i++) {
                individualRepositories.push(this.createIndividualRepository(undefined));
            }
        } else {
            console.log("Create missing individual repositories with members");
            for (let members of this.repositoryConfig.general.repositoryMembers) {
                if (!this.doesIndividualRepositoryExist(individualRepositories, members)) {
                    individualRepositories.push(this.createIndividualRepository(members));
                }
            }
        }

        return individualRepositories;
    }

    private filterIndividualRepositories(individualRepositories: IndividualRepository[]): IndividualRepository[] {
        if (this.repositoryConfig.general.repositoryMembers.length == 0) {
            console.log("Filter existing individual repositories by count");
            individualRepositories = individualRepositories.splice(0, this.repositoryConfig.general.repositoryCount);
        } else {
            console.log("Filter existing individual repositories by members");
            let tmpIndividualRepositories: IndividualRepository[] = [];
            for (let individualRepository of individualRepositories) {
                for (let members of this.repositoryConfig.general.repositoryMembers) {
                    if (individualRepository.compareMembers(members)) {
                        tmpIndividualRepositories.push(individualRepository);
                        break;
                    }
                }
            }
            individualRepositories = tmpIndividualRepositories;
        }
        return individualRepositories;
    }

    public getIndividualRepositories(): IndividualRepository[] {
        let individualRepositories: IndividualRepository[] = this.createIndividualRepositories();
        this.updateIndividualSelectionCollections(individualRepositories);
        this.saveIndividualRepositories(individualRepositories);
        
        let filteredIndividualRepositories: IndividualRepository[] = this.filterIndividualRepositories(individualRepositories);
        this.updateIndividualVariations(filteredIndividualRepositories);
        return filteredIndividualRepositories;
    }
}