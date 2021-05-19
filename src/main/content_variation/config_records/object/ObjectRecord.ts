import { ObjectVariationRecord } from "./ObjectVariationRecord";

export interface ObjectRecord {
    ids: string | string[],
    objectVariations: ObjectVariationRecord[], 
    variableExtensions: string[]
}