// polyfills for pdf-parse
if (typeof Promise.withResolvers === 'undefined') {
    // @ts-ignore
    if (typeof global.Promise.withResolvers === 'undefined') {
        // Some versions might need this, but the error was DOMMatrix
    }
}

if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { };
}
if (typeof global.ImageData === 'undefined') {
    (global as any).ImageData = class ImageData { };
}
if (typeof global.Path2D === 'undefined') {
    (global as any).Path2D = class Path2D { };
}

import { PDFParse } from 'pdf-parse';

export interface ParsedQuestion {
    questionNumber: number;
    text: string;
    options: string[];
    correctAnswer: string;
}

export interface ParseResult {
    success: boolean;
    questions: ParsedQuestion[];
    error?: string;
}

import path from 'path';
import { pathToFileURL } from 'url';

export async function parsePDFStrict(buffer: Buffer): Promise<ParseResult> {
    try {
        // Explicitly set worker path to node_modules specific file
        // On Windows with ESM, this needs to be a file:// URL
        const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
        PDFParse.setWorker(pathToFileURL(workerPath).href);

        const parser = new PDFParse({
            data: buffer
        });
        const data = await parser.getText();
        const text = data.text;
        console.log('Extracted PDF Text Length:', text.length);
        console.log('Extracted PDF Text Preview:', text.substring(0, 500));

        // Normalize text (handling newlines mostly)
        // We split by "Question #" to isolate blocks.
        // Regex for Question Header: /Question\s*#\s*(\d+)/i

        // Strategy: Split text by "Question #" logic, then parse each block.
        // The first split part is usually header/intro, ignore or check.

        // Note: This regex assumes the standard CAD format: "Question #1 ... A) ... B) ... Correct Answer: A"
        const questionBlocks = text.split(/(?=Question\s*#\s*\d+)/i).filter((b: string) => b.trim().length > 0);

        const questions: ParsedQuestion[] = [];

        for (const block of questionBlocks) {
            // 1. Extract Question Number
            const numberMatch = block.match(/Question\s*#\s*(\d+)/i);
            if (!numberMatch) continue; // Should not happen given split logic, but safety.

            const questionNumber = parseInt(numberMatch[1], 10);

            // 2. Extract Correct Answer
            // Look for "Correct Answer: X" or "Suggested Answer: X"
            // Supported range A-H
            const answerMatch = block.match(/(?:Correct|Suggested)\s*Answer\s*[:\.]\s*([A-H])/i);

            if (!answerMatch) {
                // Strict Mode failure
                return {
                    success: false,
                    error: `Strict Parsing Error: Question #${questionNumber} found but no 'Correct Answer' detected.`,
                    questions: []
                };
            }
            const correctAnswer = answerMatch[1].toUpperCase();

            // 3. Extract Options & Body
            // We need to parse text between "Question #N" and the options.
            // And then the options themselves.
            // And remove the "Correct Answer" line.

            // Support options A-H
            // Regex explanation:
            // \s([A-H])[\)\.] -> Matches " A)" or " A." captured group is the letter.
            // \s+([\s\S]+?) -> Matches content non-greedy using [\s\S] to include newlines
            // (?=\s[A-H][\)\.]|\s(?:Correct|Suggested)\s*Answer|$) -> Lookahead for next option or Answer or End.

            const optionMatches = [...block.matchAll(/\s([A-H])[\)\.]\s+([\s\S]+?)(?=\s[A-H][\)\.]|\s(?:Correct|Suggested)\s*Answer|$)/g)];

            const optionsMap: Record<string, string> = {};

            // Also extract the Question Text.
            // Content between "Question #N" and first option "A)"

            let firstOptionIndex = block.length;
            if (optionMatches.length > 0) {
                firstOptionIndex = optionMatches[0].index!;
            }

            // Text is everything before first option, minus the "Question #N" tag.
            let questionText = block.substring(numberMatch[0].length, firstOptionIndex).trim();

            const optionsList: string[] = [];

            // If we didn't find 4 options, is it an error?
            // Some boolean questions might have 2. allow 2-8?
            if (optionMatches.length < 2) {
                return {
                    success: false,
                    error: `Strict Parsing Error: Question #${questionNumber} has fewer than 2 parsed options.`,
                    questions: []
                };
            }

            for (const match of optionMatches) {
                const letter = match[1].toUpperCase();
                const content = match[2].trim();
                optionsMap[letter] = content;
                // Normalize to 'A) Content' format
                optionsList.push(`${letter}) ${content}`);
            }

            // Verify correct answer is in options
            if (!optionsMap[correctAnswer]) {
                return {
                    success: false,
                    error: `Strict Parsing Error: Question #${questionNumber} correct answer '${correctAnswer}' not found in options.`,
                    questions: []
                };
            }

            questions.push({
                questionNumber,
                text: questionText,
                options: optionsList,
                correctAnswer
            });
        }

        if (questions.length === 0) {
            return {
                success: false,
                error: `Strict Parsing Error: No questions detected in the file.`,
                questions: []
            };
        }

        return { success: true, questions };

    } catch (error: any) {
        return { success: false, error: error.message || 'Unknown parsing error', questions: [] };
    }
}
