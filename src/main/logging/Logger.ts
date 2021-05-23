import { MessageChannel } from "worker_threads";
import { LogLevel } from "./LogLevel";


export class Logger {

    private static instance: Logger;
    public static getInstance() {
        if (!this.instance) {
            this.instance = new Logger();
        }
        return this.instance;
    }

    private logQueue: { [id: string] : (string | Object)[] } = {};

    public log(message: string | Object, logLevel: LogLevel = LogLevel.Info, id?: string, waitWithLogging: boolean = false) {
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