import { RepositoryFile } from "../content_manager/RepositoryFile";

export interface RepositoryManager {
    prepareEnvironment(): void;
    retrieveOriginFiles(): Promise<RepositoryFile[]>;
    createCodeRepository(repositoryName: string): Promise<void>;
    createTestRepository(repositoryName: string): Promise<void>;
    addMembersToCodeRepository(members: string[] | undefined): Promise<void>;
    linkCodeAndTestRepository(): Promise<void>;
    provideContentToCodeRepository(codeRepositoryFiles: RepositoryFile[]): Promise<void>;
    provideContentToTestRepository(testRepositoryFiles: RepositoryFile[]): Promise<void>;
    addOverviewToOverviewRepository(overviewContent: RepositoryFile): Promise<void>;
    getLinkToCodeRepository(): string;
    getLinkToTestRepository(): string;
    getLinkToTestPage(): string;
}