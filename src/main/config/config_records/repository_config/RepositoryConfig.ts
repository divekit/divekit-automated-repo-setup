import { GeneralRecord } from "./GeneralRecord";
import { IndividualRepositoryPersistRecord } from "./IndividualRepositoryPersistRecord";
import { LocalRecord } from "./LocalRecord";
import { OverviewRecord } from "./OverviewRecord";
import { RemoteRecord } from "./RemoteRecord";
import { RepositoryRecord } from "./RepositoryRecord";

export interface RepositoryConfig {
    general: GeneralRecord,
    repository: RepositoryRecord,
    individualRepositoryPersist: IndividualRepositoryPersistRecord,
    local: LocalRecord,
    remote: RemoteRecord,
    overview: OverviewRecord
}