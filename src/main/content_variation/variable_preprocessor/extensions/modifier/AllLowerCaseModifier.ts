import { Modifier } from "./Modifier";


export class AllLowerCaseModifier implements Modifier {

    applyModifierToValue(value: string): string {
        return value.toLowerCase();
    }
}