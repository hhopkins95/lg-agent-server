import { stringToXmlBlocks as parseXml, type XML_Block } from "./index"; // adjust the path as needed
import { describe, expect, it } from "bun:test";

describe("parseXml function", () => {
    it("parses plain text with no tags", () => {
        const input = "hello world";
        const result = parseXml(input);
        expect(result).toEqual(["hello world"]);
    });

    it("parses a single, fully closed tag", () => {
        const input = "hello <foo>world</foo>";
        const result = parseXml(input);
        expect(result).toEqual([
            "hello ",
            {
                tag: "foo",
                partial: false,
                content: ["world"],
            },
        ]);
    });

    it("marks a tag as partial when closing tag is missing", () => {
        const input = "hello <foo>world</foo";
        const result = parseXml(input);
        // Because the closing `</foo>` was never found, the parser lumps it into content
        expect(result).toEqual([
            "hello ",
            {
                tag: "foo",
                partial: true,
                content: ["world</foo"],
            },
        ]);
    });

    it("parses nested tags properly", () => {
        const input = "hello <foo>world<foo2>hello again</foo2>abc</foo>";
        const result = parseXml(input);
        expect(result).toEqual([
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
        ]);
    });

    it("treats stray < as literal text", () => {
        const input = "Some stray < text <foo>inner</foo>";
        const result = parseXml(input);
        // The first '<' does not match a valid opening or closing tag,
        // so it's treated as literal text.
        expect(result).toEqual([
            "Some stray < text ",
            {
                tag: "foo",
                partial: false,
                content: ["inner"],
            },
        ]);
    });

    it("handles multiple top-level tags and text segments", () => {
        const input = "<a>Alpha</a> Some text <b>Beta</b> more text";
        const result = parseXml(input);
        expect(result).toEqual([
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
        ]);
    });

    it("marks nested tags as partial if they (or their parents) never close", () => {
        const input = "hello <foo>world <foo2>stuff";
        const result = parseXml(input);
        // <foo> never closes, so it’s partial.
        // Inside <foo> is <foo2>, which also never closes, so it’s partial.
        expect(result).toEqual([
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
        ]);
    });

    it("returns an empty array for an empty string", () => {
        const input = "";
        const result = parseXml(input);
        expect(result).toEqual([]);
    });
});
