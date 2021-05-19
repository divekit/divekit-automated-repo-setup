import path from "path";
import * as fs from 'fs';

import { RepositoryManager } from "../repository_manager/RepositoryManager";
import { TimeStampCreator } from '../utils/TimeStampCreator';
import { ConfigManager } from "../config/ConfigManager";
import { ContentProvider } from "../content_manager/ContentProvider";


export class OverviewGenerator {
    
    private readonly overviewFolder = path.join(__dirname, '..', '..', '..', 'overview');


    constructor(public readonly repositoryManager: RepositoryManager) { 
        fs.mkdirSync(this.overviewFolder, { recursive: true });
    }


    public async generateOverviewPage(contentProviders: ContentProvider[]): Promise<void> {
        let content = ConfigManager.getInstance().getRepositoryConfig().general.createTestRepository ?
            this.getOverviewContentWithTestRepo(contentProviders) :
            this.getOverviewContentWithoutTestRepo(contentProviders);

        let filePath = ConfigManager.getInstance().getRepositoryConfig().overview.overviewFileName + "-" + TimeStampCreator.createTimeStamp() + ".md";

        fs.writeFileSync(path.join(this.overviewFolder, filePath), content);

        try {
            await this.repositoryManager.addOverviewToOverviewRepository({ path: filePath, content: content, encoding: "text" });
        } catch (error) {
            console.log("An error occurred while saving the overview. Keep in mind that a backup overview file was placed in the overview folder");
            console.log(error);
        }
    }

    private getOverviewContentWithTestRepo(contentProviders: ContentProvider[]): string {
        let description = "| Group | Code Repo | Test Repo | Test Page | \n";
        let firstLine = "|-|-|-|-| \n";
        let content = description + firstLine;

        for (let i = 0; i < contentProviders.length; i++) {
            content = content + 
                "|" + this.getNameList(contentProviders[i]) + 
                "|" + this.getCodeRepoLink(contentProviders[i]) + 
                "|" + this.getTestRepoLink(contentProviders[i]) +
                "|" + this.getTestPageLink(contentProviders[i]) + 
                "| \n"; 
        }

        return content;
    }

    private getOverviewContentWithoutTestRepo(contentProviders: ContentProvider[]): string {
        let description = "| Group | Code Repo | Test Page | \n";
        let firstLine = "|-|-|-| \n";
        let content = description + firstLine;

        for (let i = 0; i < contentProviders.length; i++) {
            content = content + 
                "|" + this.getNameList(contentProviders[i]) + 
                "|" + this.getCodeRepoLink(contentProviders[i]) + 
                "|" + this.getTestPageLink(contentProviders[i]) + 
                "| \n"; 
        }

        return content;
    }

    private getNameList(contentProvider: ContentProvider): string {
        return contentProvider.individualRepository.getMembersList();
    }

    private getCodeRepoLink(contentProvider: ContentProvider): String {
        return contentProvider.repositoryManager.getLinkToCodeRepository();
    }

    private getTestRepoLink(contentProvider: ContentProvider): String {
        return contentProvider.repositoryManager.getLinkToTestRepository();
    }

    private getTestPageLink(contentProvider: ContentProvider): String {
        return contentProvider.repositoryManager.getLinkToTestPage();
    }    
}