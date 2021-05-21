import { Modifier } from "./Modifier";


export class FirstLowerCaseModifier implements Modifier {

    applyModifierToValue(value: string): string {
        return value.charAt(0).toLowerCase() + value.slice(1);
    }
}