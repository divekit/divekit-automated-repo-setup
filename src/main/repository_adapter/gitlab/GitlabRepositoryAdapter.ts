import * as dotenv from 'dotenv'
import * as readline from 'node:readline/promises';
import { URL } from 'node:url';
import { RepositoryAdapter } from "../RepositoryAdapter";
import { RepositoryFile } from "../../content_manager/RepositoryFile";
import {
    AccessLevel,
//    CommitSchema,
    Gitlab,
    UserSchema,
    ProjectVariableSchema,
    ProjectSchema
} from "@gitbeaker/rest";
import { ConfigManager } from "../../config/ConfigManager";
import { EncodingRetriever } from "../../content_manager/EncodingRetriever";
import { IndividualRepository } from "../../repository_creation/IndividualRepository";
import { Logger } from "../../logging/Logger";

dotenv.config();
const gitlab = new Gitlab({
    host: process.env.HOST,
    token: process.env.API_TOKEN!,
});

// Get main branch name from environment variable or default to "master"
const mainBranch = process.env.DIVEKIT_MAINBRANCH_NAME || "master";

export class GitlabRepositoryAdapter implements RepositoryAdapter { // TODO create POJOs for any types

    private codeRepository: ProjectSchema | null = null;
    private testRepository: ProjectSchema | null = null;

    private repositoryConfig = ConfigManager.getInstance().getRepositoryConfig();


    constructor(private individualRepository?: IndividualRepository) {

    }

    public async retrieveOriginFiles(): Promise<RepositoryFile[]> {
        let tree: any = await gitlab.Repositories.allRepositoryTrees(this.repositoryConfig.remote.originRepositoryId,
            {recursive: true, orderBy: "path", perPage: 100, sort: "asc", ref: mainBranch});
        let repositoryFiles: RepositoryFile[] = [];

        for (var treeFile of tree) {
            if (treeFile.type === "blob") { // process only files not directories
                if (EncodingRetriever.isBlob(treeFile.path)) {
                    let file = await gitlab.RepositoryFiles.show(this.repositoryConfig.remote.originRepositoryId, treeFile.path, mainBranch);
                    repositoryFiles.push({path: treeFile.path, content: file.content, encoding: file.encoding});
                } else {
                    let fileContent: any = await gitlab.RepositoryFiles.showRaw(this.repositoryConfig.remote.originRepositoryId, treeFile.path, mainBranch);
                    repositoryFiles.push({path: treeFile.path, content: fileContent});
                }
            }
        }

        return repositoryFiles;
    }

    public async createCodeRepository(repositoryName: string): Promise<void> {
        let existingRepository = await this.searchForRepository(repositoryName, this.repositoryConfig.remote.codeRepositoryTargetGroupId);
        this.codeRepository = existingRepository ? existingRepository :
            await gitlab.Projects.create({namespaceId: this.repositoryConfig.remote.codeRepositoryTargetGroupId, name: repositoryName}) as ProjectSchema;
    }

    public async createTestRepository(repositoryName: string): Promise<void> {
        let existingRepository = await this.searchForRepository(repositoryName, this.repositoryConfig.remote.testRepositoryTargetGroupId);
        this.testRepository = existingRepository ? existingRepository :
            await gitlab.Projects.create({namespaceId: this.repositoryConfig.remote.testRepositoryTargetGroupId, name: repositoryName}) as ProjectSchema;
    }

    public async addMembersToCodeRepository(members: string[] | undefined): Promise<void> {
        if (members) {
            for (let i = 0; i < members.length; i++) {
                let user = await this.searchForUser(members[i]);
                if (user) {
                    try {
                        await gitlab.ProjectMembers.add(this.codeRepository!.id, user.id, this.getAccessLevel());
                        Logger.getInstance().info(`Added User ${user.username} to project`, this.individualRepository!.id!, true);
                    } catch (error) {
                        Logger.getInstance().warning(`Could not add user ${members[i]}`, this.individualRepository!.id!, true);
                        Logger.getInstance().warning(<any> error, this.individualRepository!.id!, true);
                    }
                } else {
                    Logger.getInstance().warning(`Could not find user ${members[i]} by name`, this.individualRepository!.id!, true);
                }
            }
        }
    }

    private async searchForRepository(repositoryName: string, groupId: number): Promise<ProjectSchema | null> {
        let foundProjects = (await gitlab.Projects.search(repositoryName, {showExpanded: true})).data as ProjectSchema[];

        for (let foundProject of foundProjects) {
            if (foundProject.namespace.id == groupId) {
                return foundProject;
            }
        }
        return null;
    }

    private async searchForUser(userName: string): Promise<UserSchema | null> {
        let users: UserSchema[] = await gitlab.Search.all("users", userName) as UserSchema[];
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

        await gitlab.Commits.create(this.repositoryConfig.overview.overviewRepositoryId, mainBranch, "add overview file", commitActions);
    }

    private async setInboundTokenPermissions(): Promise<void> {
        // FIXME: Since there is no REST-API endpoint for changing the job token scope,
        //        we need to manually fire a GraphQL request.
        // https://gitlab.com/gitlab-org/gitlab/-/issues/351740

        let url = new URL("/api/graphql", process.env.HOST!);

        const postData = `{"variables":null,"query":"mutation{ciJobTokenScopeAddProject(input:{direction:INBOUND,projectPath:\\"${this.codeRepository!.path_with_namespace}\\",targetProjectPath:\\"${this.testRepository!.path_with_namespace}\\"}){errors}}"}`;

        const response = await fetch(url, {
            method: "POST",
            body: postData,
            headers: {
                "Authorization": `Bearer ${process.env.API_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        const json = await response.json();
        if ((json.data.ciJobTokenScopeAddProject.errors as any[]).length > 0) {
            const errorMessages = json.data.ciJobTokenScopeAddProject.errors
                .map(err => {
                    // Assuming the error objects might have a message property, or could be just strings
                    return typeof err === 'object' && err.message ? err.message : err.toString();
                })
                .join(", ");
            throw new Error("Errors occurred while setting inbound permissions: " + errorMessages);
        }
    }

    public async linkCodeAndTestRepository(): Promise<void> {
        // Set Environment Variables and create pipeline trigger
        if (!(await this.doesVariableExistInRepository(this.testRepository!, 'CODE_REPO_URL'))) {
            await gitlab.ProjectVariables.create(this.testRepository!.id, 'CODE_REPO_URL', this.codeRepository!.web_url);
        }
        if (!(await this.doesVariableExistInRepository(this.testRepository!, 'CODE_REPO_TOKEN'))) {
            const options = {
                protected: true,
                masked: true
            }
            const projectToken = await gitlab.ProjectAccessTokens.create(this.codeRepository!.id,
                "ACCESS_TOKEN", ['read_api'], "2024-12-31" )
            await gitlab.ProjectVariables.create(this.testRepository!.id, 'CODE_REPO_TOKEN', projectToken.token as string , options);
        }
        if (!(await this.doesVariableExistInRepository(this.codeRepository!, 'TEST_REPO_TRIGGER_URL'))) {
            const triggerURL = `${this.testRepository!._links.self}/trigger/pipeline`;
            await gitlab.ProjectVariables.create(this.codeRepository!.id, 'TEST_REPO_TRIGGER_URL', triggerURL);
        }
        if (!(await this.doesVariableExistInRepository(this.codeRepository!, 'TEST_REPO_TRIGGER_TOKEN'))) {
            const pipelineTrigger: any = await gitlab.PipelineTriggerTokens.create(this.testRepository!.id, "other_project");
            await gitlab.ProjectVariables.create(this.codeRepository!.id, 'TEST_REPO_TRIGGER_TOKEN', pipelineTrigger.token);
        }

        await this.setInboundTokenPermissions();
    }

    private async doesVariableExistInRepository(repository: ProjectSchema, variableName: string): Promise<boolean> {
        let foundVariables = await gitlab.ProjectVariables.all(repository.id) as ProjectVariableSchema[];

        for (let foundVariable of foundVariables) {
            if (foundVariable.key == variableName) {
                return true;
            }
        }

        return false;
    }

    public async provideContentToCodeRepository(codeRepositoryFiles: RepositoryFile[]): Promise<void> {
        let codeRepositoryCommitActions = this.convertFileArrayToCommits(codeRepositoryFiles);

        // this Gitlab API call seems to produce error 500 consistently
        // (try https://git.archi-lab.io/api/v4/projects/<id>/repository/commits with <id> being a valid project id,
        //  for a freshly created, EMPTY repo - it will return 500)
        // Therefore we skip this call.
        //if (!(await this.IsAtLeastOneCommitInRepository(this.codeRepository!))) {
            await gitlab.Commits.create(this.codeRepository!.id, mainBranch, "initial commit", codeRepositoryCommitActions);
        //}
    }

    public async provideContentToTestRepository(testRepositoryFiles: RepositoryFile[]): Promise<void> {
        let testRepositoryCommitActions = this.convertFileArrayToCommits(testRepositoryFiles);

        // this Gitlab API call seems to produce error 500 consistently
        // (try https://git.archi-lab.io/api/v4/projects/<id>/repository/commits with <id> being a valid project id,
        //  for a freshly created, EMPTY repo - it will return 500)
        // Therefore we skip this call.
        //if (this.testRepository && testRepositoryCommitActions.length > 0 && !(await this.IsAtLeastOneCommitInRepository(this.testRepository!))) {
            await gitlab.Commits.create(this.testRepository!.id, mainBranch, "initial commit", testRepositoryCommitActions);
        //}
    }

    private convertFileArrayToCommits(repositoryFiles: RepositoryFile[]): any[] {
        repositoryFiles = EncodingRetriever.replaceFileEncoding(repositoryFiles, "text");

        let commitActions: any[] = [];
        for (var file of repositoryFiles) {
            commitActions.push({ action: 'create', filePath: file.path, content: file.content, encoding: file.encoding });
        }
        return commitActions;
    }

    /*
    private async IsAtLeastOneCommitInRepository(repository: ProjectSchema): Promise<boolean> {
        let commits = await gitlab.Commits.all(repository.id) as CommitSchema[];
        return commits.length > 0;
    }
    */

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

    private getAccessLevel(): number {
        if (this.repositoryConfig.remote.addUsersAsGuests) {
            return AccessLevel.GUEST;
        } else {
            return AccessLevel.MAINTAINER;
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
            const rl = readline.createInterface({input: process.stdin, output: process.stdout});

            const answer = await rl.question(`You are about to delete all repositories associated with this environment.\n  Continue? [y/N] `);
            rl.close();
          
            if(answer !== 'y') {
              console.log("User terminated environment preparation");
              process.exit();
            }
          
            console.log("Clearing current environment..");
            await this.deleteProjectsInGroup(this.repositoryConfig.remote.codeRepositoryTargetGroupId);

            if (this.repositoryConfig.general.createTestRepository) {
                await this.deleteProjectsInGroup(this.repositoryConfig.remote.testRepositoryTargetGroupId);
            }
        }
    }

    private async deleteProjectsInGroup(groupId: number) {
        let projects = await gitlab.Groups.allProjects(groupId);
        for (let project of projects) {
            await gitlab.Projects.remove(project.id);
        }
    }
}
