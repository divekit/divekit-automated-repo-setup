import { ObjectRecord } from "./object/ObjectRecord";
import { LogicRecord } from "./logic/LogicRecord";
import { RelationRecord } from "./relation/RelationRecord";

export interface VariationsConfig {
    objects: ObjectRecord[], 
    relations: RelationRecord[], 
    logic: LogicRecord[]
}