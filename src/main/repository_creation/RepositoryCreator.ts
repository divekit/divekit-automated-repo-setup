import { RepositoryFile } from "../content_manager/RepositoryFile";
import { ContentRetriever } from "../content_manager/ContentRetriever";
import { GitlabRepositoryManager } from "../repository_manager/gitlab/GitlabRepositoryManager";
import { ContentProvider } from "../content_manager/ContentProvider";
import { RepositoryManager } from "../repository_manager/RepositoryManager";
import { FileSystemRepositoryManager } from "../repository_manager/file_system/FileSystemRepositoryManager";
import { OverviewGenerator } from '../generate_overview/OverviewGenerator';
import { IndividualRepository } from './IndividualRepository';
import { IndividualRepositoryManager } from './IndividualRepositoryManager';
import { ConfigManager } from "../config/ConfigManager";
import { Task, TaskQueue } from "./TaskQueue";


export class RepositoryCreator {
    
    public async generateRepositories(): Promise<void> {        
        let originRepositoryFiles: RepositoryFile[] = await this.retrieveOriginRepositoryFiles();
        let individualRepositoryManager: IndividualRepositoryManager = new IndividualRepositoryManager();
        let individualRepositories: IndividualRepository[] = individualRepositoryManager.getIndividualRepositories();   

        this.generateRepositoryManager().prepareEnvironment();

        let contentProviders = await this.startRepositoryGenerationTasks(originRepositoryFiles, individualRepositories);

        if (ConfigManager.getInstance().getRepositoryConfig().overview.generateOverview) {
            let overviewGenerator = new OverviewGenerator(this.generateRepositoryManager());
            overviewGenerator.generateOverviewPage(contentProviders);
        }
    }

    private async startRepositoryGenerationTasks(originRepositoryFiles: RepositoryFile[], individualRepositories: IndividualRepository[]): Promise<ContentProvider[]> {
        console.log("Start generating repositories")
        let startTime = new Date().getTime();

        let contentProviderTasks: Task<ContentProvider | Error>[] = [];

        for (let i = 0; i < individualRepositories.length; i++) {
            contentProviderTasks.push(() => {
                return this.createRepository(
                    originRepositoryFiles, 
                    individualRepositories[i]);
            });
        }

        let contentProviders: ContentProvider[] = [];
        let taskQueue = new TaskQueue<ContentProvider | Error>(contentProviderTasks, ConfigManager.getInstance().getRepositoryConfig().general.maxConcurrentWorkers);
        let results = await taskQueue.runTasks();
        
        for (let result of results) {
            if (!(result instanceof Error)) {
                contentProviders.push(result);
            }
        }

        let finishedTime = new Date().getTime();
        console.log(`Finished generating repositories (Took ${ ((finishedTime - startTime) / 1000 / 60).toFixed(2) } minutes)`);
        return contentProviders;
    }

    private async createRepository(originRepositoryFiles: RepositoryFile[], individualRepository: IndividualRepository): Promise<ContentProvider> {
        const codeRepositoryName = `${ConfigManager.getInstance().getRepositoryConfig().general.repositoryName}_group_${individualRepository.id}`;
        const testRepositoryName = `${ConfigManager.getInstance().getRepositoryConfig().general.repositoryName}_tests_group_${individualRepository.id}`;

        try { 
            let repositoryManager = this.generateRepositoryManager();
            let contentProvider = new ContentProvider(repositoryManager, individualRepository);
            await contentProvider.provideRepositoriesWithContent(originRepositoryFiles, codeRepositoryName, testRepositoryName); 
            console.log(`Finished generating repository with id ${individualRepository.id}`);
            return contentProvider;
        } catch (error) {
            let errorMsg = `An error occurred while generating repository with id ${individualRepository.id}`;
            if (individualRepository.members) {
                errorMsg = errorMsg + " (Members: " + individualRepository.getMembersList() + ")";
            }
            console.log(errorMsg);
            console.log(error);
            throw error;
        }
    }

    private async retrieveOriginRepositoryFiles(): Promise<RepositoryFile[]> {
        try { 
            let contentRetriever = new ContentRetriever(this.generateRepositoryManager());
            let originRepositoryFiles = await contentRetriever.retrieveOriginFiles();
            ConfigManager.getInstance().loadConfigsFromOriginRepoFiles(originRepositoryFiles);
            originRepositoryFiles = contentRetriever.filterOriginFiles(originRepositoryFiles);
            return originRepositoryFiles;
        } catch (error) {
            console.log("Error: Could not retrieve origin project");
            throw error;
        }  
    }

    private generateRepositoryManager(): RepositoryManager {
        if (ConfigManager.getInstance().getRepositoryConfig().general.localMode) {
            return new FileSystemRepositoryManager();
        } else {
            return new GitlabRepositoryManager();
        }
    }
}