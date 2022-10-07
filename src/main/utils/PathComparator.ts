/**
 * Compare all strings from the list with another string (filePaths)
 * and ignore differing separators. (Slash or Backslash)
 *
 * e.g.
 * "src/test/magic.yml" is equal to "src\test\magic.yml" <br>
 * "src/test/magic.yml" is equal to "src\\test\\magic.yml" <br>
 * "src/test/magic.yml" is NOT equal to "src\\test\\magic.yaml" <br>
 */
export const pathListIncludes = (pathList: string[], path: string): boolean => {
    if (pathList.includes(path)) return true
    const regex = /[\/\\]/g // all occurrences of / or \
    let updatedPath = path.replace(regex, "")
    let updatedPathList: string[] = [...pathList]

    pathList.forEach(it => {
        updatedPathList.push(it.replace(regex, ""))
    })

    return updatedPathList.includes(updatedPath)
}
