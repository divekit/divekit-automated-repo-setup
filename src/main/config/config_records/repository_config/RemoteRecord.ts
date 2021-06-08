
export interface RemoteRecord {
    originRepositoryId: number,
    codeRepositoryTargetGroupId: number,
    testRepositoryTargetGroupId: number,
    deleteExistingRepositories: boolean,
    addUsersAsGuests: boolean
}