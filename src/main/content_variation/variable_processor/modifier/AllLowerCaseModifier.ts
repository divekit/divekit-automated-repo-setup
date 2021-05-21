import { Modifier } from "./Modifier";


export class AllLowerCaseModifier implements Modifier {
    
    public getId(): string {
        return "ALL_LOWER_CASE";
    }

    public applyToValue(value: string): string {
        return value.toLowerCase();
    }
}