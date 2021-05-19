import { RelationShipRecord } from "./RelationShipRecord";
import { RelationObjectRecord } from "./RelationObjectRecord";

export interface RelationRecord {
    relationShips: RelationShipRecord[], 
    relationObjects: RelationObjectRecord[]
}