import { VariationsConfig } from "../content_variation/config_records/VariationsConfig";
import { RelationsConfig } from "../content_variation/config_records/RelationsConfig";
import { RepositoryConfig } from "./config_records/repository_config/RepositoryConfig";
import { OriginRepositoryConfig } from "./config_records/origin_repository_config/OriginRepositoryConfig";
import { VariableExtensionsConfig } from "../content_variation/config_records/VariableExtensionsConfig";

export interface Configs {
    repositoryConfig: RepositoryConfig;
    originRepositoryConfig: OriginRepositoryConfig;
    relationsConfig: RelationsConfig;
    variableExtensionsConfig: VariableExtensionsConfig;
    variationsConfig: VariationsConfig;
    preProcessedVariationsConfig: VariationsConfig | undefined;
}