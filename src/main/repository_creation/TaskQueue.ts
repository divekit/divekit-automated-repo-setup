
export type Task<T> = () => Promise<T>;


export class TaskQueue<T> {

    private running = false;
    private concurrentTasks = 0;

    private currentTaskIndex: number = 0;
    private results: (T | Error)[];


    constructor(private tasks: Task<T>[], private maxConcurrentTasks: number) { 
        this.results = new Array<T | Error>(tasks.length);
    }

    public async runTasks(): Promise<(T | Error)[]> {
        return new Promise<(T | Error)[]>((resolve, reject) => {
            if (this.running) {
                reject("Taskqueue already running");
            }
            this.running = true;

            this.getNextTask(resolve);
        });
    }

    private handleResult(taskIndex: number, result: T | Error, done: (results: (T | Error)[]) => void) {
        this.results[taskIndex] = result;
        this.concurrentTasks--;
        this.getNextTask(done);
    }

    private getNextTask(done: (results: (T | Error)[]) => void) {
        if (this.concurrentTasks < this.maxConcurrentTasks && this.currentTaskIndex < this.tasks.length) {
            let taskIndex = this.currentTaskIndex;
            this.tasks[taskIndex]().then(result => {
                this.handleResult(taskIndex, result, done);
            }, error => {
                this.handleResult(taskIndex, error, done);
            });

            this.currentTaskIndex++;
            this.concurrentTasks++;
            this.getNextTask(done);
        } else if (this.concurrentTasks === 0 && this.currentTaskIndex === this.tasks.length) {
            done(this.results);
        }
    }
}