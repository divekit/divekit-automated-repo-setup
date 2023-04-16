import { Logger } from "./logging/Logger";
import { LogLevel } from "./logging/LogLevel";
import { RepositoryCreator } from "./repository_creation/RepositoryCreator";


const main = async () => {
    try {
        let repositoryCreator: RepositoryCreator = new RepositoryCreator();
        await repositoryCreator.generateRepositories();
    } catch (error) {
        Logger.getInstance().error(<any> error);
    }   
}

main();
