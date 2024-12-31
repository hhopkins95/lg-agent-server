export type XML_Block = {
    tag: string;
    partial: boolean;
    content: (XML_Block | string)[];
};

/**
 * Parses an input string for XML-like tags and returns an array of either:
 *  - string literals, or
 *  - XML_Block objects (with `tag`, `content`, and `partial` indicating missing closing tags).
 *
 * Example Inputs and Outputs:
 *
 * "hello world" => ["hello world"]
 *
 * "hello <foo>world</foo>" =>
 * ["hello", {tag : "foo", partial : false, content : ["world"]}]
 *
 * "hello <foo>world</foo" =>
 * ["hello", {tag : "foo", partial : true, content : ["world</foo"]}]
 *
 * "hello <foo>world<foo2>hello again</foo2>abc</foo>" =>
 * [
 *   "hello",
 *   {
 *     tag: "foo",
 *     partial: false,
 *     content: [
 *       "world",
 *       { tag: "foo2", partial: false, content: ["hello again"] },
 *       "abc"
 *     ]
 *   }
 * ]
 */
export function parseXmlFromString(input: string): (XML_Block | string)[] {
    let position = 0;
    const length = input.length;

    // Recursively collect top-level blocks until we exhaust the string
    // or encounter the expected closing tag for a parent.
    function parseBlocks(untilTag?: string): (XML_Block | string)[] {
        const blocks: (XML_Block | string)[] = [];

        while (position < length) {
            // If we find a closing tag for our current `untilTag`, exit
            if (
                untilTag && input.slice(position).startsWith(`</${untilTag}>`)
            ) {
                // Advance past the closing tag
                position += `</${untilTag}>`.length;
                return blocks;
            }

            // If we see an opening <, check whether it's a new tag or a stray `<`.
            if (input[position] === "<") {
                // Attempt to read a tag name (opening or closing).
                const openTagMatch = input.slice(position).match(
                    /^<([a-zA-Z0-9_]+)>/,
                );
                const closeTagMatch = input.slice(position).match(
                    /^<\/([a-zA-Z0-9_]+)>/,
                );

                if (openTagMatch) {
                    // This is an opening tag like <tag>
                    const [, tagName] = openTagMatch;
                    // Move position to after the <tag>
                    position += openTagMatch[0].length;

                    // Recursively parse blocks inside this newly opened tag.
                    // We'll try to parse until we encounter `</tagName>` or end of string.
                    const contentBlocks = parseBlocks(tagName);

                    // If we returned naturally, we encountered the matching closing tag.
                    // If we ended because we reached end-of-string, it's partial.
                    const partial = position >= length; // if we never found the closing tag
                    blocks.push({
                        tag: tagName,
                        partial,
                        content: contentBlocks,
                    } as XML_Block);
                } else if (closeTagMatch) {
                    // We somehow see a closing tag that doesn't match our `untilTag`.
                    // That usually means we should bubble up and let a higher parse call handle it.
                    return blocks;
                } else {
                    // We have a `<` that doesn't match either <tag> or </tag>.
                    // Treat it as text and move one character forward.
                    blocks.push("<");
                    position++;
                }
            } else {
                // It's text. Gather as much text as we can until the next `<` or end-of-string.
                let textStart = position;
                while (position < length && input[position] !== "<") {
                    position++;
                }
                const textChunk = input.slice(textStart, position);
                blocks.push(textChunk);
            }
        }

        // If we reach here, we're at the end of the string.
        // If we were expecting a closing `</untilTag>`, that means partial is true
        // for that unclosed tag. The function that called parseBlocks can handle
        // marking it partial if needed (by checking if we found the close).
        return blocks;
    }

    // Top-level parse (with no `untilTag`)
    return parseBlocks();
}
