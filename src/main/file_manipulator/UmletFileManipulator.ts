import { promisify } from 'util';
import { exec as execCb } from 'child_process';
const exec = promisify(execCb);
import { FileManipulator } from "./FileManipulator";
import { RepositoryFile } from "../content_manager/RepositoryFile";
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import {Logger} from "../logging/Logger";

export class UmletFileManipulator implements FileManipulator {

    private readonly tmpUmletFolder = path.join("./resources/tmp/umlet");

    shouldManipulateRepositoryFile(repositoryFile: RepositoryFile): Boolean {
        return repositoryFile.path.endsWith(".uxf");
    }

    async manipulateRepositoryFile(repositoryFile: RepositoryFile): Promise<RepositoryFile[]> {
        let repositoryFiles: RepositoryFile[] = [];
        try {
            repositoryFiles.push(repositoryFile);

            fs.mkdirSync(this.tmpUmletFolder, { recursive: true });
            let fileId = uuidv4();
            let rawFilePathTmp = path.join(this.tmpUmletFolder, `umlet_${fileId}.uxf`);
            let imageFilePathTmp = path.join(this.tmpUmletFolder, `umlet_${fileId}.jpg`);
            fs.writeFileSync(rawFilePathTmp, repositoryFile.content);
            await exec("umlet -action=convert -format=jpg -filename=" + rawFilePathTmp + " -output=" + imageFilePathTmp);

            let imageFileContent = fs.readFileSync(imageFilePathTmp, { encoding: 'base64' });
            let newRepositoryFile: RepositoryFile = { path: repositoryFile.path.replace("uxf", "jpg"), content: imageFileContent, encoding: "base64" };
            repositoryFiles.push(newRepositoryFile);

            fs.unlinkSync(rawFilePathTmp);
            fs.unlinkSync(imageFilePathTmp);
        } catch (error) {
            Logger.getInstance().error(error, "Error while manipulating umlet file");
            throw error;
        }
        return repositoryFiles;
    }

}
