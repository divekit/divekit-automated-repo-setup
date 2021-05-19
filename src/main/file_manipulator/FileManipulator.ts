import { RepositoryFile } from "../content_manager/RepositoryFile";

export interface FileManipulator {
    shouldManipulateRepositoryFile(repositoryFile: RepositoryFile): Boolean
    manipulateRepositoryFile(repositoryFile: RepositoryFile): Promise<RepositoryFile[]>
}