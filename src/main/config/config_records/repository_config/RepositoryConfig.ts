import { GeneralRecord } from "./GeneralRecord";
import { IndividualRepositoryPersistRecord } from "./IndividualRepositoryPersistRecord";
import { LocalRecord } from "./LocalRecord";
import { OverviewRecord } from "./OverviewRecord";
import { RemoteRecord } from "./RemoteRecord";

export interface RepositoryConfig {
    general: GeneralRecord,
    local: LocalRecord,
    remote: RemoteRecord,
    overview: OverviewRecord,
    individualRepositoryPersist: IndividualRepositoryPersistRecord
}