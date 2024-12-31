export type XML_Block = {
    tag: string;
    partial: boolean;
    content: Array<string | XML_Block>;
};

/**
 * A minimal XML-like parser that:
 *   - Recognizes <tag> and the matching </tag> (alphanumeric or underscore).
 *   - If the closing tag is missing, the block is partial.
 *   - Treats non-tag <... as a literal '<' character, then merges it into text.
 *   - Merges adjacent text so there's never two adjacent strings in the array.
 *   - Returns an array of strings or {tag, partial, content} objects.
 */
export function stringToXmlBlocks(input: string): Array<string | XML_Block> {
    let pos = 0;

    // Main function: parse until we find `</untilTag>` or end of string.
    function parseBlocks(untilTag?: string): {
        blocks: Array<string | XML_Block>;
        foundClosingTag: boolean;
    } {
        const blocks: Array<string | XML_Block> = [];
        let foundClosingTag = false;

        while (pos < input.length) {
            // If we're looking for `</untilTag>` and it appears at the current position, break.
            if (untilTag && input.startsWith(`</${untilTag}>`, pos)) {
                pos += `</${untilTag}>`.length;
                foundClosingTag = true;
                break;
            }

            if (input[pos] !== "<") {
                // Read text up to the next '<' or end of string
                const textChunk = readTextUpToAngleBracket();
                pushText(blocks, textChunk);
            } else {
                // We see a '<'. Try to parse an opening or closing tag.
                const maybeBlock = tryParseTag();
                if (maybeBlock) {
                    // Valid opening tag => we got an XML_Block
                    blocks.push(maybeBlock);
                } else {
                    // Not a valid tag => treat '<' as literal text and merge
                    pushText(blocks, "<");
                    pos++;
                }
            }
        }

        return { blocks, foundClosingTag };
    }

    /**
     * Attempts to parse either a closing tag (which we handle by returning `null`
     * so the caller can bubble up) or an opening tag `<tag>`.
     * Returns an XML_Block if it successfully parsed `<tag> ... </tag>`, otherwise null.
     */
    function tryParseTag(): XML_Block | null {
        // Must start with '<'
        if (!input.startsWith("<", pos)) return null;

        // Check for closing tag
        const closingTagMatch = input.slice(pos).match(/^<\/([a-zA-Z0-9_]+)>/);
        if (closingTagMatch) {
            // Let the parent parse handle it
            return null;
        }

        // Check for opening tag
        const openingTagMatch = input.slice(pos).match(/^<([a-zA-Z0-9_]+)>/);
        if (!openingTagMatch) {
            return null; // Not a valid opening tag
        }

        const tagName = openingTagMatch[1];
        // Move pos beyond `<tagName>`
        pos += openingTagMatch[0].length;

        // Recursively parse
        const { blocks: contentBlocks, foundClosingTag } = parseBlocks(tagName);

        return {
            tag: tagName,
            partial: !foundClosingTag,
            content: contentBlocks,
        };
    }

    /**
     * Reads text from the current position up to (but not including) the next '<' or end of string.
     */
    function readTextUpToAngleBracket(): string {
        const start = pos;
        while (pos < input.length && input[pos] !== "<") {
            pos++;
        }
        return input.slice(start, pos);
    }

    /**
     * Pushes a text chunk onto the `blocks` array. If the last item is also text,
     * merge them to avoid having adjacent strings.
     */
    function pushText(blocks: Array<string | XML_Block>, text: string) {
        if (!text) return;
        const lastIndex = blocks.length - 1;
        if (lastIndex >= 0 && typeof blocks[lastIndex] === "string") {
            // Merge with the last string
            blocks[lastIndex] = (blocks[lastIndex] as string) + text;
        } else {
            blocks.push(text);
        }
    }

    // Start parsing at the top level
    const { blocks } = parseBlocks();
    return blocks;
}

/**
 * Converts an array of (XML_Block | string) back to a single XML-like string.
 * - Strings are output as-is.
 * - For XML_Block with partial: false, we emit `<tag>...</tag>`.
 * - For XML_Block with partial: true, we emit `<tag>...` (no closing tag).
 *
 * If the XML_Block content itself contains leftover text like `"world</foo"`,
 * it will remain as is in the output (which may preserve "missing closing tag" scenarios).
 */
export function blocksToXmlString(blocks: Array<XML_Block | string>): string {
    return blocks
        .map((block) => {
            if (typeof block === "string") {
                return block;
            }
            // block is an XML_Block
            const { tag, partial, content } = block;
            const inner = blocksToXmlString(content);

            if (!partial) {
                // Fully closed tag
                return `<${tag}>${inner}</${tag}>`;
            } else {
                // Partial => omit the closing tag
                return `<${tag}>${inner}`;
            }
        })
        .join("");
}
