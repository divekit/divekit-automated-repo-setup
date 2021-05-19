import { RepositoryFile } from "../content_manager/RepositoryFile";

export interface RepositoryManager {
    prepareEnvironment(): void;
    retrieveOriginFiles(): Promise<RepositoryFile[]>;
    createCodeRepository(repositoryName: string): Promise<void>;
    createTestRepository(repositoryName: string): Promise<void>;
    addMembersToCodeRepository(members: string[] | undefined): Promise<void>;
    linkCodeAndTestRepository(): Promise<void>;
    provideContentToCodeAndTestRepository(codeRepositoryFiles: RepositoryFile[], testRepositoryFiles: RepositoryFile[]): Promise<void>;
    addOverviewToOverviewRepository(overviewContent: RepositoryFile): Promise<void>;
    getLinkToCodeRepository(): String;
    getLinkToTestRepository(): String;
    getLinkToTestPage(): String;
}