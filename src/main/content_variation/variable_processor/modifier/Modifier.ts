export interface Modifier {
    getId(): string,
    applyToValue(value: string): string
}