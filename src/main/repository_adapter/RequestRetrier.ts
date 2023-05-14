export type RetryFunction<T> = () => Promise<T>;
export type StatusCodeFunction = (er: any) => number | null;

export class RequestRetrier {

    private readonly RETRY_CODES = [408, 425, 429, 502, 503, 504];


    constructor (public statusCodeFunction: StatusCodeFunction, public maxRetries: number, public startWaitTime: number) { }

    public async retry<T>(retryFunction: RetryFunction<T>): Promise<T> {
        let waitTime = this.startWaitTime;
        let retries = 0;

        while (true) {
            try {        
                return await retryFunction();
            } catch (e) {
                let statusCode = this.statusCodeFunction(e);
                if (statusCode && this.RETRY_CODES.includes(statusCode) && ++retries < this.maxRetries) {
                    await this.wait(waitTime);
                    waitTime *= 2;
                } else {
                    throw e;
                }
            }
        }
    }

    private async wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}