import dotenv from "dotenv";

import { RepositoryAdapter } from "../RepositoryAdapter";
import { RepositoryFile } from "../../content_manager/RepositoryFile";
import { CommitSchema, Gitlab, UserSchema } from "gitlab";
import { ConfigManager } from "../../config/ConfigManager";
import { AccessLevel, ResourceVariableSchema } from "gitlab/dist/types/core/templates";
import { EncodingRetriever } from "../../content_manager/EncodingRetriever";
import { GitlabProject } from "./GitlabProject";
import { IndividualRepository } from "../../repository_creation/IndividualRepository";
import { Logger } from "../../logging/Logger";
import { LogLevel } from "../../logging/LogLevel";

dotenv.config();
const gitlab = new Gitlab({
    host: process.env.HOST,
    token: process.env.API_TOKEN,
});


export class GitlabRepositoryAdapter implements RepositoryAdapter { // TODO create POJOs for any types

    private codeRepository: GitlabProject | null = null;
    private testRepository: GitlabProject | null = null;

    private repositoryConfig = ConfigManager.getInstance().getRepositoryConfig();


    constructor(private individualRepository?: IndividualRepository) {

    }

    public async retrieveOriginFiles(): Promise<RepositoryFile[]> {
        let tree: any = await gitlab.Repositories.tree(this.repositoryConfig.remote.originRepositoryId, { recursive: true, per_page: Number.MAX_SAFE_INTEGER });
        let repositoryFiles: RepositoryFile[] = [];

        for (var treeFile of tree) {
            if (treeFile.type === "blob") { // process only files not directories
                if (EncodingRetriever.isBlob(treeFile.path)) {
                    let file = await gitlab.RepositoryFiles.show(this.repositoryConfig.remote.originRepositoryId, treeFile.path, "master");
                    repositoryFiles.push({path: treeFile.path, content: file.content, encoding: file.encoding});
                } else {
                    let fileContent: any = await gitlab.RepositoryFiles.showRaw(this.repositoryConfig.remote.originRepositoryId, treeFile.path, "master");
                    repositoryFiles.push({path: treeFile.path, content: fileContent});
                }
            }
        }

        return repositoryFiles;
    }

    public async createCodeRepository(repositoryName: string): Promise<void> {
        let existingRepository = await this.searchForRepository(repositoryName, this.repositoryConfig.remote.codeRepositoryTargetGroupId);
        this.codeRepository = existingRepository ? existingRepository :
            await gitlab.Projects.create({namespace_id: this.repositoryConfig.remote.codeRepositoryTargetGroupId, name: repositoryName, path: repositoryName}) as GitlabProject;
    }

    public async createTestRepository(repositoryName: string): Promise<void> {
        let existingRepository = await this.searchForRepository(repositoryName, this.repositoryConfig.remote.testRepositoryTargetGroupId);
        this.testRepository = existingRepository ? existingRepository :
            await gitlab.Projects.create({namespace_id: this.repositoryConfig.remote.testRepositoryTargetGroupId, name: repositoryName, path: repositoryName}) as GitlabProject;
    }

    public async addMembersToCodeRepository(members: string[] | undefined): Promise<void> {
        if (members) {
            for (let i = 0; i < members.length; i++) {
                let user = await this.searchForUser(members[i]);
                if (user) {
                    try {
                        await gitlab.ProjectMembers.add(this.codeRepository!.id, user.id, this.getAccessLevel());
                        Logger.getInstance().log(`Added User ${user.username} to project`, LogLevel.Info, this.individualRepository!.id!, true);
                    } catch (error) {
                        Logger.getInstance().log(`Could not add user ${members[i]}`, LogLevel.Warning, this.individualRepository!.id!, true);
                        Logger.getInstance().log(<any> error, LogLevel.Warning, this.individualRepository!.id!, true);
                    }
                } else {
                    Logger.getInstance().log(`Could not find user ${members[i]} by name`, LogLevel.Warning, this.individualRepository!.id!, true);
                }
            }
        }
    }

    private async searchForRepository(repositoryName: string, groupId: number): Promise<GitlabProject | null> {
        let foundProjects = await gitlab.Projects.search(repositoryName) as GitlabProject[];

        for (let foundProject of foundProjects) {
            if (foundProject.namespace.id == groupId) {
                return foundProject;
            }
        }
        return null;
    }

    private async searchForUser(userName: string): Promise<UserSchema | null> {
        let users: UserSchema[] = await gitlab.Users.search(userName) as UserSchema[];
        if (users.length == 0) {
            return null;
        }

        for (let i = 0; i < users.length; i++) {
            if (users[i].username === userName) {
                return users[i];
            }
        }
        return null;
    }

    public async addOverviewToOverviewRepository(overviewContent: RepositoryFile): Promise<void> {
        let commitActions: any[] = [{ action: 'create', filePath: overviewContent.path, content: overviewContent.content }];

        await gitlab.Commits.create(this.repositoryConfig.overview.overviewRepositoryId, "master", "add overview file", commitActions);
    }

    public async linkCodeAndTestRepository(): Promise<void> {
        // Set Environment Variables and create pipeline trigger
        if (!(await this.doesVariableExistInRepository(this.testRepository!, 'CODE_REPO_URL'))) {
            await gitlab.ProjectVariables.create(this.testRepository!.id, {key: 'CODE_REPO_URL', value: this.codeRepository!.web_url});
        }
        if (!(await this.doesVariableExistInRepository(this.codeRepository!, 'TEST_REPO_TRIGGER_URL'))) {
            const triggerURL = `${this.testRepository!._links.self}/trigger/pipeline`;
            await gitlab.ProjectVariables.create(this.codeRepository!.id, {key: 'TEST_REPO_TRIGGER_URL', value: triggerURL});
        }
        if (!(await this.doesVariableExistInRepository(this.codeRepository!, 'TEST_REPO_TRIGGER_TOKEN'))) {
            const pipelineTrigger: any = await gitlab.Triggers.add(this.testRepository!.id, { description: "other_project" });
            await gitlab.ProjectVariables.create(this.codeRepository!.id, {key: 'TEST_REPO_TRIGGER_TOKEN', value: pipelineTrigger.token});
        }
    }

    private async doesVariableExistInRepository(repository: GitlabProject, variableName: string): Promise<boolean> {
        let foundVariables = await gitlab.ProjectVariables.all(repository.id) as ResourceVariableSchema[];

        for (let foundVariable of foundVariables) {
            if (foundVariable.key == variableName) {
                return true;
            }
        }

        return false;
    }

    public async provideContentToCodeRepository(codeRepositoryFiles: RepositoryFile[]): Promise<void> {
        let codeRepositoryCommitActions = this.convertFileArrayToCommits(codeRepositoryFiles);

        if (!(await this.IsAtLeastOneCommitInRepository(this.codeRepository!))) {
            await gitlab.Commits.create(this.codeRepository!.id, "master", "initial commit", codeRepositoryCommitActions);
        }
    }

    public async provideContentToTestRepository(testRepositoryFiles: RepositoryFile[]): Promise<void> {
        let testRepositoryCommitActions = this.convertFileArrayToCommits(testRepositoryFiles);

        if (this.testRepository && testRepositoryCommitActions.length > 0 && !(await this.IsAtLeastOneCommitInRepository(this.testRepository!))) {
            await gitlab.Commits.create(this.testRepository.id, "master", "initial commit", testRepositoryCommitActions);
        }
    }

    private convertFileArrayToCommits(repositoryFiles: RepositoryFile[]): any[] {
        repositoryFiles = EncodingRetriever.replaceFileEncoding(repositoryFiles, "text");

        let commitActions: any[] = [];
        for (var file of repositoryFiles) {
            commitActions.push({ action: 'create', filePath: file.path, content: file.content, encoding: file.encoding });
        }
        return commitActions;
    }

    private async IsAtLeastOneCommitInRepository(repository: GitlabProject): Promise<boolean> {
        let commits = await gitlab.Commits.all(repository.id) as CommitSchema[];
        return commits.length > 0;
    }

    public getLinkToTestPage(): string {
        let link;
        if (this.testRepository == null) {
            link = this.codeRepository!.web_url;
        } else {
            link = this.testRepository.web_url;
        }

        let linkParts = link.split("/");
        let domainParts = linkParts[2].split(".");
        let overviewLink = "http://" + linkParts[3] + ".pages";

        for (let i = 1; i < domainParts.length; i++) {
            overviewLink = overviewLink + "." + domainParts[i];
        }

        for (let i = 4; i < linkParts.length; i++) {
            overviewLink = overviewLink + "/" + linkParts[i];
        }

        return overviewLink;
    }

    private getAccessLevel(): AccessLevel {
        if (this.repositoryConfig.remote.addUsersAsGuests) {
            return 10;
        } else {
            return 40;
        }
    }

    public getLinkToCodeRepository(): string {
        return this.codeRepository!.web_url;
    }

    public getLinkToTestRepository(): string {
        return this.testRepository!.web_url;
    }

    public async prepareEnvironment() { 
        if (this.repositoryConfig.remote.deleteExistingRepositories) {
            await this.deleteProjectsInGroup(this.repositoryConfig.remote.codeRepositoryTargetGroupId);

            if (this.repositoryConfig.general.createTestRepository) {
                await this.deleteProjectsInGroup(this.repositoryConfig.remote.testRepositoryTargetGroupId);
            }
        }
    }

    private async deleteProjectsInGroup(groupId: number) {
        let projects = await gitlab.GroupProjects.all(groupId);
        for (let project of projects) {
            await gitlab.Projects.remove(project.id);
        }
    }
}
