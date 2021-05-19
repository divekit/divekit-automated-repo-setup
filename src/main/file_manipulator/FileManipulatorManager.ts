import { FileManipulator } from "./FileManipulator";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { UmletFileManipulator } from "./UmletFileManipulator";


export class FileManipulatorManager {

    private fileManipulators: FileManipulator[] = this.getFileManipulators(); 

    async manipulateRepositoryFile(repositoryFile: RepositoryFile): Promise<RepositoryFile[]> {
        let repositoryFiles: RepositoryFile[] = [];
        let manipulated = false;

        for (var fileManipulator of this.fileManipulators) {
            if (fileManipulator.shouldManipulateRepositoryFile(repositoryFile)) {
                repositoryFiles = repositoryFiles.concat(await fileManipulator.manipulateRepositoryFile(repositoryFile));
                manipulated = true;
            }
        }

        if (!manipulated) {
            repositoryFiles.push(repositoryFile);
        }
        return repositoryFiles;
    }

    getFileManipulators(): FileManipulator[] {
        var fileManipulators: FileManipulator[] = [];
        fileManipulators.push(new UmletFileManipulator());
        return fileManipulators;
    }
}