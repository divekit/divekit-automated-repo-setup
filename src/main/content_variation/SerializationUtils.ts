export class SerializationUtils {

    public static valueToString(value: string | number | object): string {
        return value instanceof Object ? JSON.stringify(value).replace(new RegExp(`\"`, "g"), "\\\"") : String(value);
    }
}