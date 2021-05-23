import { RepositoryFile } from "../content_manager/RepositoryFile";
import { ContentRetriever } from "../content_manager/ContentRetriever";
import { GitlabRepositoryAdapter } from "../repository_adapter/gitlab/GitlabRepositoryAdapter";
import { ContentProvider } from "../content_manager/ContentProvider";
import { RepositoryAdapter } from "../repository_adapter/RepositoryAdapter";
import { FileSystemRepositoryAdapter } from "../repository_adapter/file_system/FileSystemRepositoryAdapter";
import { OverviewGenerator } from '../generate_overview/OverviewGenerator';
import { IndividualRepository } from './IndividualRepository';
import { IndividualRepositoryManager } from './IndividualRepositoryManager';
import { ConfigManager } from "../config/ConfigManager";
import { Task, TaskQueue } from "./TaskQueue";
import { Logger } from "../logging/Logger";
import { LogLevel } from "../logging/LogLevel";


export class RepositoryCreator {
    
    public async generateRepositories(): Promise<void> {  
        let originRepositoryFiles: RepositoryFile[] = await this.retrieveOriginRepositoryFiles();
        let individualRepositoryManager: IndividualRepositoryManager = new IndividualRepositoryManager();
        let individualRepositories: IndividualRepository[] = individualRepositoryManager.getIndividualRepositories();   

        this.generateRepositoryAdapter().prepareEnvironment();

        let contentProviders = await this.startRepositoryGenerationTasks(originRepositoryFiles, individualRepositories);

        if (ConfigManager.getInstance().getRepositoryConfig().overview.generateOverview) {
            let overviewGenerator = new OverviewGenerator(this.generateRepositoryAdapter());
            overviewGenerator.generateOverviewPage(contentProviders);
        }
    }

    private async startRepositoryGenerationTasks(originRepositoryFiles: RepositoryFile[], individualRepositories: IndividualRepository[]): Promise<ContentProvider[]> {
        Logger.getInstance().log("Start generating repositories");
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
        Logger.getInstance().log(`Finished generating repositories (Took ${ ((finishedTime - startTime) / 1000 / 60).toFixed(2) } minutes)`);
        return contentProviders;
    }

    private async createRepository(originRepositoryFiles: RepositoryFile[], individualRepository: IndividualRepository): Promise<ContentProvider> {
        const codeRepositoryName = `${ConfigManager.getInstance().getRepositoryConfig().general.repositoryName}_group_${individualRepository.id}`;
        const testRepositoryName = `${ConfigManager.getInstance().getRepositoryConfig().general.repositoryName}_tests_group_${individualRepository.id}`;

        try { 
            let repositoryAdapter = this.generateRepositoryAdapter(individualRepository);
            let contentProvider = new ContentProvider(repositoryAdapter, individualRepository);
            await contentProvider.provideRepositoriesWithContent(originRepositoryFiles, codeRepositoryName, testRepositoryName); 
            Logger.getInstance().log(`Finished generating repository`, LogLevel.Info, individualRepository.id!);
            return contentProvider;
        } catch (error) {
            let errorMsg = `An error occurred while generating repository`;
            if (individualRepository.members) {
                errorMsg = errorMsg + " (Members: " + individualRepository.getMembersList() + ")";
            }
            Logger.getInstance().log(errorMsg, LogLevel.Error, individualRepository.id!);
            Logger.getInstance().log(error, LogLevel.Error, individualRepository.id!);
            throw error;
        }
    }

    private async retrieveOriginRepositoryFiles(): Promise<RepositoryFile[]> {
        try {
            let contentRetriever = new ContentRetriever(this.generateRepositoryAdapter());
            let originRepositoryFiles = await contentRetriever.retrieveOriginFiles();
            ConfigManager.getInstance().loadConfigsFromOriginRepoFiles(originRepositoryFiles);
            originRepositoryFiles = contentRetriever.filterOriginFiles(originRepositoryFiles);
            return originRepositoryFiles;
        } catch (error) {
            Logger.getInstance().log("Could not retrieve origin project", LogLevel.Error);
            throw error;
        }
    }

    private generateRepositoryAdapter(individualRepository?: IndividualRepository): RepositoryAdapter {
        if (ConfigManager.getInstance().getRepositoryConfig().general.localMode) {
            return new FileSystemRepositoryAdapter();
        } else {
            return new GitlabRepositoryAdapter(individualRepository);
        }
    }
}