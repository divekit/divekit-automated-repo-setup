import { SolutionDeletionRecord } from "./SolutionDeletionRecord";
import { WarningsRecord } from "./WarningsRecord";

export interface OriginRepositoryConfig {
    solutionDeletion: SolutionDeletionRecord,
    warnings: WarningsRecord
}