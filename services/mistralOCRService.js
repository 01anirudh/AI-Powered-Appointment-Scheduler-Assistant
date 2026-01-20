import { createRequire } from 'module';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const { Mistral } = require('@mistralai/mistralai');

// Lazy initialization of client
let client = null;
const getClient = () => {
    if (!client) {
        client = new Mistral({
            apiKey: process.env.MISTRAL_API_KEY
        });
    }
    return client;
};

/**
 * Extract text from an image using Mistral's Pixtral vision model
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<{text: string, confidence: number}>}
 */
export const extractTextFromImageMistral = async (imagePath) => {
    try {
        if (!process.env.MISTRAL_API_KEY) {
            throw new Error('MISTRAL_API_KEY not configured in .env file');
        }

        console.log('Using Mistral Pixtral for OCR:', imagePath);

        // Read image file and convert to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Determine MIME type
        const mimeType = imagePath.toLowerCase().endsWith('.png')
            ? 'image/png'
            : imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg')
                ? 'image/jpeg'
                : 'image/png';

        // Optimized prompt for appointment text extraction
        const prompt = `You are an expert OCR system. Extract ALL text from this image accurately.

Instructions:
- Extract every word, number, and character you can see
- Preserve the original text layout and line breaks
- Include handwritten and printed text
- If you see dates, times, or department names, include them exactly as written
- Do not add explanations or formatting - just return the raw extracted text

Return ONLY the extracted text, nothing else.`;

        // Call Mistral API with vision capabilities
        const client = getClient();
        const chatResponse = await client.chat.complete({
            model: 'pixtral-12b-2409',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt
                        },
                        {
                            type: 'image_url',
                            imageUrl: `data:${mimeType};base64,${base64Image}`
                        }
                    ]
                }
            ],
            temperature: 0.1, // Low temperature for more deterministic output
            maxTokens: 1000
        });

        const extractedText = chatResponse.choices[0]?.message?.content?.trim() || '';

        if (!extractedText) {
            throw new Error('No text extracted from image');
        }

        console.log('Mistral extracted:', extractedText);

        // Mistral doesn't provide confidence scores, so we estimate based on response quality
        const confidence = extractedText.length > 10 ? 0.90 : 0.70;

        return {
            text: extractedText,
            confidence: confidence
        };

    } catch (error) {
        console.error('Mistral OCR Error:', error);

        // Provide more specific error messages
        if (error.message?.includes('API key')) {
            throw new Error('Mistral API key is missing or invalid. Please check your .env file.');
        }

        throw new Error(`Mistral OCR failed: ${error.message}`);
    }
};

/**
 * Validate if extracted text contains meaningful content
 * @param {string} text - Extracted text to validate
 * @returns {boolean}
 */
export const validateExtractedText = (text) => {
    if (!text || typeof text !== 'string') return false;

    const trimmed = text.trim();

    // Check minimum length
    if (trimmed.length < 3) return false;

    // Check if it contains at least some alphanumeric characters
    const hasAlphanumeric = /[a-zA-Z0-9]/.test(trimmed);

    return hasAlphanumeric;
};
