import { RelationsConfig } from "../content_variation/config_records/RelationsConfig"
import { VariationsConfig } from "../content_variation/config_records/VariationsConfig"
import { Configs } from "./Configs";
import * as fs from 'fs';
import path from "path";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { RepositoryConfig } from "./config_records/repository_config/RepositoryConfig";
import { OriginRepositoryConfig } from "./config_records/origin_repository_config/OriginRepositoryConfig";
import { VariableExtensionsConfig } from "../content_variation/config_records/VariableExtensionsConfig";


export class ConfigManager {

    private readonly configFolder = path.join(__dirname, '..', '..', '..', 'resources', 'config');

    private configs: Configs;

    private static instance: ConfigManager;
    public static getInstance() {
        if (!this.instance) {
            this.instance = new ConfigManager();
        }
        return this.instance;
    }


    constructor() {
        this.configs = { 
            repositoryConfig: this.loadConfigFromLocalFiles("repositoryConfig"), 
            originRepositoryConfig: this.loadConfigFromLocalFiles("originRepositoryConfig"),
            relationsConfig: this.loadConfigFromLocalFiles("relationsConfig"), 
            variableExtensionsConfig: this.loadConfigFromLocalFiles("variableExtensionsConfig"), 
            variationsConfig: this.loadConfigFromLocalFiles("variationsConfig"),
        };
    }

    private loadConfigFromLocalFiles(configName: string): any {
        let configPath = path.join(this.configFolder, configName);
        let configJson = fs.readFileSync(configPath + ".json").toString();
        return this.parseConfig(configJson, configName);
    }

    public loadConfigsFromOriginRepoFiles(originRepositoryFiles: RepositoryFile[]) {
        let newOriginRepositoryConfig = this.loadConfigFromOriginRepoFiles(originRepositoryFiles, "originRepositoryConfig");
        this.configs.originRepositoryConfig = newOriginRepositoryConfig ? newOriginRepositoryConfig : this.configs.originRepositoryConfig;

        let newRelationsConfig = this.loadConfigFromOriginRepoFiles(originRepositoryFiles, "relationsConfig");
        this.configs.relationsConfig = newRelationsConfig ? newRelationsConfig : this.configs.relationsConfig;

        let newVariableExtensionsConfig = this.loadConfigFromOriginRepoFiles(originRepositoryFiles, "variableExtensionsConfig");
        this.configs.variableExtensionsConfig = newVariableExtensionsConfig ? newVariableExtensionsConfig : this.configs.variableExtensionsConfig;

        let newVariationsConfig = this.loadConfigFromOriginRepoFiles(originRepositoryFiles, "variationsConfig");
        this.configs.variationsConfig = newVariationsConfig ? newVariationsConfig : this.configs.variationsConfig;
    }

    private loadConfigFromOriginRepoFiles(originRepositoryFiles: RepositoryFile[], configName: string): any | undefined {
        for (let originRepositoryFile of originRepositoryFiles) {
            if (originRepositoryFile.path.includes(configName)) {
                return this.parseConfig(originRepositoryFile.content, configName); 
            }
        }
        return undefined;
    }

    private parseConfig(configContent: string, configName: string): object {
        try {
            return JSON.parse(configContent);
        } catch (error) {
            console.log("Error: Could not parse " + configName);
            throw error;
        }
    }

    public getRelationsConfig(): RelationsConfig {
        return this.configs.relationsConfig;
    }

    public getVariableExtensionsConfig(): VariableExtensionsConfig {
        return this.configs.variableExtensionsConfig;
    }

    public getVariationsConfig(): VariationsConfig {
        return this.configs.variationsConfig;
    }

    public getRepositoryConfig(): RepositoryConfig {
        return this.configs.repositoryConfig;
    }

    public getOriginRepositoryConfig(): OriginRepositoryConfig {
        return this.configs.originRepositoryConfig;
    }
}