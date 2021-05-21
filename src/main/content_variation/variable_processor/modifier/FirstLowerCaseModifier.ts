import { Modifier } from "./Modifier";


export class FirstLowerCaseModifier implements Modifier {

    public getId(): string {
        return "FIRST_LOWER_CASE";
    }

    public applyToValue(value: string): string {
        return value.charAt(0).toLowerCase() + value.slice(1);
    }
}