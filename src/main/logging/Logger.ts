import {LogLevel} from "./LogLevel";


export class Logger {

    private static instance: Logger;
    private static globalLogLevel: LogLevel = LogLevel.Warning;

    public static getInstance() {
        if (!this.instance) {
            this.instance = new Logger();
        }
        return this.instance;
    }

    private logQueue: { [id: string] : (string | Object)[] } = {};


    public static setLogLevel(logLevel: LogLevel): void {
        Logger.globalLogLevel = logLevel;
    }

    public static getLogLevel(): LogLevel {
        return Logger.globalLogLevel;
    }

    public warning(message: string | Object, id?: string, waitWithLogging: boolean = false) {
        this.log(message, LogLevel.Warning, id, waitWithLogging);
    }

    public error(message: string | Object, id?: string, waitWithLogging: boolean = false) {
        this.log(message, LogLevel.Error, id, waitWithLogging);
    }

    public info(message: string | Object, id?: string, waitWithLogging: boolean = false) {
        this.log(message, LogLevel.Info, id, waitWithLogging);
    }

    public log(message: string | Object, logLevel: LogLevel = LogLevel.Info, id?: string, waitWithLogging: boolean = false) {
        if (logLevel < Logger.globalLogLevel) return;

        let logMessage = this.constructLogMessage(message, logLevel, id);
        if (waitWithLogging) {
            if (id) {
                if (!this.logQueue[id]) {
                    this.logQueue[id] = [];
                }
                this.logQueue[id].push(logMessage);
            } else {
                throw new Error("Cant wait with logging without a specified id");
            }
        } else {
            if (id) {
                this.publishLogForId(id);
            }
            console.log(logMessage);
        }
    }


    public publishLogForId(id: string) {
        if (!this.logQueue[id]) {
            return;
        }

        for (let logMessage of this.logQueue[id]) {
            console.log(logMessage);
        }

        delete this.logQueue[id];
    }

    private constructLogMessage(message: string | Object, logLevel: LogLevel, id?: string): string | Object {
        if (message instanceof Object) {
            return message;
        } else {
            let logLevelMessage = "[" + logLevel + "]";
            let idMessage = id ? "[" + id + "]" : "";
            return logLevelMessage + idMessage + " " + message;
        }
    }



}