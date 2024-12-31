import { type XML_Block } from "./index"; // Adjust import path as needed

/**
 * Finds the first top-level XML_Block in `blocks` whose `tag` matches `tagName`.
 * Returns the entire block if found; otherwise returns undefined.
 */
export function findTopLevelBlock(
    blocks: Array<XML_Block | string>,
    tagName: string,
): XML_Block | undefined {
    for (const block of blocks) {
        if (typeof block !== "string" && block.tag === tagName) {
            return block;
        }
    }
    return undefined;
}
