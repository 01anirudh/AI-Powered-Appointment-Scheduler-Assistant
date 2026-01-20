import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const extractEntities = async (text) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const prompt = `You are an intelligent appointment scheduling assistant. Extract structured data from natural language requests and correct any typos.

Extract these fields:
1. date_phrase: Any date mention (e.g., "tomorrow", "next Friday", "Jan 25")
2. time_phrase: Any time mention (e.g., "3pm", "10:00", "noon")
3. department: Medical department/service (correct typos, use Title Case)

Rules:
- Capture implied dates/times
- Mark "is_clear" as false if request is unrelated to appointments
- Provide confidence score (0.0 to 1.0)

Text to analyze: "${text}"

IMPORTANT: Respond with ONLY a valid JSON object, no markdown formatting, no explanations:
{
  "date_phrase": "string or null",
  "time_phrase": "string or null",
  "department": "string or null",
  "confidence": 0.95,
  "is_clear": true
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        console.log('Raw Gemini Response:', textResponse);

        // Try to extract JSON (handles both plain JSON and markdown-wrapped JSON)
        let jsonMatch = textResponse.match(/\{[\s\S]*\}/);

        // If no match, try to find JSON within markdown code blocks
        if (!jsonMatch) {
            const codeBlockMatch = textResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
                jsonMatch = [codeBlockMatch[1]];
            }
        }

        if (!jsonMatch) {
            console.error('No JSON found in Gemini response:', textResponse);
            throw new Error('No JSON found in response');
        }

        const entities = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (typeof entities.confidence !== 'number') {
            entities.confidence = 0.5;
        }

        return {
            date_phrase: entities.date_phrase,
            time_phrase: entities.time_phrase,
            department: entities.department,
            confidence: entities.confidence,
            is_clear: entities.is_clear !== false,
        };
    } catch (error) {
        console.error('=== Gemini AI Error ===');
        console.error('Error message:', error.message);
        console.error('Error type:', error.constructor.name);
        if (error.status) console.error('HTTP Status:', error.status);
        if (error.errorDetails) console.error('Error details:', JSON.stringify(error.errorDetails, null, 2));

        return {
            date_phrase: null, time_phrase: null, department: null,
            confidence: 0, is_clear: false, error: error.message,
        };
    }
};

export const extractEntitiesFromImage = async (imagePath) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Read image file and convert to base64
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

        const prompt = `Extract appointment data from this image. Return JSON only:
{
  "date_phrase": "date text or null",
  "time_phrase": "time text or null", 
  "department": "medical dept or null",
  "confidence": 0.9,
  "is_clear": true,
  "extracted_text": "all text from image"
}`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        const textResponse = response.text();

        console.log('Raw Gemini Vision Response:', textResponse);

        // Extract JSON
        let jsonMatch = textResponse.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            const codeBlockMatch = textResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
                jsonMatch = [codeBlockMatch[1]];
            }
        }

        if (!jsonMatch) {
            console.error('No JSON found in Gemini Vision response:', textResponse);
            throw new Error('No JSON found in response');
        }

        const entities = JSON.parse(jsonMatch[0]);

        if (typeof entities.confidence !== 'number') {
            entities.confidence = 0.5;
        }

        return {
            date_phrase: entities.date_phrase,
            time_phrase: entities.time_phrase,
            department: entities.department,
            confidence: entities.confidence,
            is_clear: entities.is_clear !== false,
            extracted_text: entities.extracted_text || ''
        };
    } catch (error) {
        console.error('Gemini Vision Error:', error);
        return {
            date_phrase: null, time_phrase: null, department: null,
            confidence: 0, is_clear: false, error: error.message,
            extracted_text: ''
        };
    }
};

export const needsClarification = (entities) => {
    // Low confidence in extraction
    if (entities.confidence < 0.6) return true;

    // Missing critical information - require date, time, AND department
    if (!entities.date_phrase || !entities.time_phrase || !entities.department) return true;

    // Unclear request
    return !entities.is_clear;
};

export const generateClarificationMessage = (entities) => {
    const missing = [];
    if (!entities.date_phrase) missing.push('Date (e.g., "tomorrow", "Jan 25")');
    if (!entities.time_phrase) missing.push('Time (e.g., "3pm", "10:00")');
    if (!entities.department) missing.push('Department (e.g., "Cardiology", "Dentist")');

    if (missing.length > 0) {
        return `Please provide: ${missing.join(', ')}`;
    }
    return 'Please provide the appointment date, time, and department.';
};
