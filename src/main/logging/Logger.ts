import {LogLevel} from "./LogLevel";


export class Logger {

    private static instance: Logger;
    private static globalLogLevel: LogLevel = LogLevel.Info;

    public static getInstance() {
        if (!this.instance) {
            this.instance = new Logger();
        }
        return this.instance;
    }

    private logQueue: { [id: string] : (string | Object)[] } = {};


    public static setLogLevel(logLevelString?: string): void {
        if (logLevelString === undefined) {
            return;
        }
        const logLevelStringLower = logLevelString.toLowerCase();
        switch (logLevelStringLower) {
            case 'debug':
                Logger.globalLogLevel = LogLevel.Debug;
                break;
            case 'info':
                Logger.globalLogLevel = LogLevel.Info;
                break;
            case 'warning':
                Logger.globalLogLevel =  LogLevel.Warning;
                break;
            case 'error':
                Logger.globalLogLevel =  LogLevel.Error;
                break;
            default:
                throw new Error(`Invalid 'globalLogLevel' detected in repositoryConfig.json: ${logLevelString}`);
        }
    }

    public static getLogLevelString(): string {
        switch (Logger.globalLogLevel) {
            case LogLevel.Debug:
                return 'Debug';
                break;
            case LogLevel.Info:
                return 'Info';
                break;
            case LogLevel.Warning:
                return 'Warning';
                break;
            case LogLevel.Error:
                return 'Error';
                break;
        }
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

    public debug(message: string | Object, id?: string, waitWithLogging: boolean = false) {
        this.log(message, LogLevel.Debug, id, waitWithLogging);
    }

    public log(message: string | Object, logLevel: LogLevel = LogLevel.Info, id?: string, waitWithLogging: boolean = false) {
        if (Logger.globalLogLevel > logLevel) return;

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

    private constructLogMessage(message: string | Object, _logLevel: LogLevel, id?: string): string | Object {
        if (message instanceof Object) {
            return message;
        } else {
            let logLevelString = Logger.getLogLevelString()
            let logLevelMessage = "[" + logLevelString + "]";
            let idMessage = id ? "[" + id + "]" : "";
            return logLevelMessage + idMessage + " " + message;
        }
    }



}