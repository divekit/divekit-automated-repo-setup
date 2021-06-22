import { SolutionDeletionRecord } from "./SolutionDeletionRecord";
import { VariablesRecord } from "./VariablesRecord";
import { WarningsRecord } from "./WarningsRecord";

export interface OriginRepositoryConfig {
    variables: VariablesRecord,
    solutionDeletion: SolutionDeletionRecord,
    warnings: WarningsRecord
}