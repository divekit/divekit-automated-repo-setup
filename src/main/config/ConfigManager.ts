import { RelationsConfig } from "../content_variation/config_records/RelationsConfig"
import { VariationsConfig } from "../content_variation/config_records/VariationsConfig"
import { Configs } from "./Configs";
import * as fs from 'fs';
import path from "path";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { RepositoryConfig } from "./config_records/repository_config/RepositoryConfig";
import { OriginRepositoryConfig } from "./config_records/origin_repository_config/OriginRepositoryConfig";
import { VariableExtensionsConfig } from "../content_variation/config_records/VariableExtensionsConfig";
import { Logger } from "../logging/Logger";
import { LogLevel } from "../logging/LogLevel";


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

    private loadConfigFromLocalFiles(configName: string): any | undefined {
        let configPath = path.join(this.configFolder, configName) + ".json";
        if (fs.existsSync(configPath)) {
            let configJson = fs.readFileSync(configPath).toString();
            return this.parseConfig(configJson, configName);
        } else {
            return undefined;
        }
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
            Logger.getInstance().error("Could not parse " + configName);
            throw error;
        }
    }

    public getRepositoryConfig(): RepositoryConfig {
        return this.configs.repositoryConfig;
    }
    
    public getRelationsConfig(): RelationsConfig {
        if (this.configs.relationsConfig) {
            return this.configs.relationsConfig;
        } else {
            throw Error("Could not find relationsConfig");
        }
    }

    public getVariableExtensionsConfig(): VariableExtensionsConfig {
        if (this.configs.variableExtensionsConfig) {
            return this.configs.variableExtensionsConfig;
        } else {
            throw Error("Could not find variableExtensionsConfig");
        }
    }

    public getVariationsConfig(): VariationsConfig {
        if (this.configs.variationsConfig) {
            return this.configs.variationsConfig;
        } else {
            throw Error("Could not find variationsConfig");
        }
    }

    public getOriginRepositoryConfig(): OriginRepositoryConfig {
        if (this.configs.originRepositoryConfig) {
            return this.configs.originRepositoryConfig;
        } else {
            throw Error("Could not find originRepositoryConfig");
        }
    }
}