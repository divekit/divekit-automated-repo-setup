import { GitlabProjectLinks } from "./GitlabProjectLinks";
import { GitlabProjectNameSpace } from "./GitlabProjectNameSpace";

export interface GitlabProject {
    id: number,
    name: string,
    web_url: string,
    namespace: GitlabProjectNameSpace,
    _links: GitlabProjectLinks
}