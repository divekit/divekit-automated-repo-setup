
export interface GeneralRecord {
    localMode: boolean,
    createTestRepository: boolean,
    variateRepositories: boolean,
    maxConcurrentWorkers: number,
    repositoryName: string
    repositoryCount: number
    repositoryMembers: string[][]
}