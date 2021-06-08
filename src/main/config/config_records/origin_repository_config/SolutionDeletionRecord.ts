
export interface SolutionDeletionRecord {
    deleteFileKey: string,
    deleteParagraphKey: string,
    replaceMap: { [ id: string]: string }
}