import { describe, expect, it } from "bun:test";
import {
    blocksToXmlString,
    stringToXmlBlocks as parseXml,
    type XML_Block,
} from "./index"; // adjust the path as needed

const CASES: Array<{
    testCase: string;
    string: string;
    blocks: Array<string | XML_Block>;
}> = [
    {
        testCase: "plain text with no tags",
        string: "hello world",
        blocks: ["hello world"],
    },
    {
        testCase: "a single, fully closed tag",
        string: "hello <foo>world</foo>",
        blocks: [
            "hello ",
            {
                tag: "foo",
                partial: false,
                content: ["world"],
            },
        ],
    },
    {
        testCase: "tag marked as partial (missing closing tag)",
        string: "hello <foo>world</foo",
        blocks: [
            "hello ",
            {
                tag: "foo",
                partial: true,
                content: ["world</foo"],
            },
        ],
    },
    {
        testCase: "parses nested tags properly",
        string: "hello <foo>world<foo2>hello again</foo2>abc</foo>",
        blocks: [
            "hello ",
            {
                tag: "foo",
                partial: false,
                content: [
                    "world",
                    {
                        tag: "foo2",
                        partial: false,
                        content: ["hello again"],
                    },
                    "abc",
                ],
            },
        ],
    },
    {
        testCase: "treats stray < as literal text",
        string: "Some stray < text <foo>inner</foo>",
        blocks: [
            "Some stray < text ",
            {
                tag: "foo",
                partial: false,
                content: ["inner"],
            },
        ],
    },
    {
        testCase: "multiple top-level tags and text segments",
        string: "<a>Alpha</a> Some text <b>Beta</b> more text",
        blocks: [
            {
                tag: "a",
                partial: false,
                content: ["Alpha"],
            },
            " Some text ",
            {
                tag: "b",
                partial: false,
                content: ["Beta"],
            },
            " more text",
        ],
    },
    {
        testCase: "nested partial tags",
        string: "hello <foo>world <foo2>stuff",
        blocks: [
            "hello ",
            {
                tag: "foo",
                partial: true,
                content: [
                    "world ",
                    {
                        tag: "foo2",
                        partial: true,
                        content: ["stuff"],
                    },
                ],
            },
        ],
    },
    {
        testCase: "empty string yields empty array",
        string: "",
        blocks: [],
    },
];

describe("string => blocks", () => {
    CASES.forEach(({ testCase, string, blocks }) => {
        it(testCase, () => {
            const parsed = parseXml(string);
            expect(parsed).toEqual(blocks);
        });
    });
});

describe("blocks => string", () => {
    CASES.forEach(({ testCase, string, blocks }) => {
        it(testCase, () => {
            const rebuilt = blocksToXmlString(blocks);
            expect(rebuilt).toEqual(string);
        });
    });
});
