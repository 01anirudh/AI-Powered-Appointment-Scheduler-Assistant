import fs from 'fs';
import { z } from 'zod';
import { extractTextFromImageMistral as extractTextFromImage, validateExtractedText } from '../services/mistralOCRService.js';
import { extractEntities, extractEntitiesFromImage, needsClarification, generateClarificationMessage } from '../services/aiService.js';
import { normalizeEntities } from '../services/normalizationService.js';

// --- IN-MEMORY STORAGE ---
// Ideally this would be in a separate service/model file, but cleaner here than in routes
let appointments = [];
const saveAppointment = (apptData) => {
    const newAppt = { ...apptData, _id: 'appt_' + Date.now(), createdAt: new Date() };
    appointments.unshift(newAppt);
    return newAppt;
};

export const processImageUpload = async (req, res, next) => {
    try {
        if (!req.file) throw new Error('No image file');

        console.log('Processing image with Mistral OCR:', req.file.filename);
        const { text: rawText, confidence } = await extractTextFromImage(req.file.path);

        if (!validateExtractedText(rawText)) {
            throw new Error('Could not extract meaningful text from image');
        }

        console.log(`Extracted text: "${rawText}", Confidence: ${(confidence * 100).toFixed(0)}%`);

        const entities = await extractEntities(rawText);

        const normalized = normalizeEntities(entities, process.env.DEFAULT_TIMEZONE);

        if (needsClarification(entities)) {
            return res.json({
                status: "needs_clarification",
                message: generateClarificationMessage(entities),
                raw_text: rawText,
                confidence: confidence,
                entities_confidence: entities.confidence
            });
        }

        if (!normalized.date || !normalized.time) {
            return res.json({
                status: "needs_clarification",
                message: "Ambiguous date/time or department",
                raw_text: rawText,
                confidence: confidence,
                entities_confidence: entities.confidence
            });
        }

        const appointment = saveAppointment({
            rawText,
            extractedEntities: entities,
            normalizedData: normalized,
            status: 'success',
            source: 'image',
            imagePath: req.file.path
        });

        // Calculate normalization confidence
        const normConfidence = (normalized.date && normalized.time) ? 0.95 : 0.5;

        res.json({
            status: "ok",
            raw_text: rawText, // Keeping this as it's useful for OCR debugging
            ocr_confidence: confidence,
            entities: {
                date_phrase: entities.date_phrase,
                time_phrase: entities.time_phrase,
                department: entities.department
            },
            entities_confidence: entities.confidence,
            normalized: {
                date: normalized.date,
                time: normalized.time,
                tz: normalized.timezone
            },
            normalization_confidence: normConfidence,
            appointment: {
                department: normalized.department || entities.department || "General",
                date: normalized.date,
                time: normalized.time,
                tz: normalized.timezone
            },
            _id: appointment._id
        });
    } catch (err) { next(err); }
};

export const processTextParse = async (req, res, next) => {
    try {
        const { text } = z.object({ text: z.string().min(1) }).parse(req.body);
        console.log('Processing text:', text);

        const entities = await extractEntities(text);
        const normalized = normalizeEntities(entities, process.env.DEFAULT_TIMEZONE);

        if (needsClarification(entities)) {
            return res.json({
                status: "needs_clarification",
                message: generateClarificationMessage(entities),
                raw_text: text,
                confidence: 1.0,
                entities_confidence: entities.confidence
            });
        }

        if (!normalized.date || !normalized.time) {
            return res.json({
                status: "needs_clarification",
                message: "Ambiguous date/time or department",
                raw_text: text,
                confidence: 1.0,
                entities_confidence: entities.confidence
            });
        }

        const appointment = saveAppointment({
            rawText: text,
            extractedEntities: entities,
            normalizedData: normalized,
            status: 'success',
            source: 'text'
        });

        // Calculate normalization confidence (mock logic for now)
        const normConfidence = (normalized.date && normalized.time) ? 0.95 : 0.5;

        res.json({
            status: "ok",
            raw_text: text,
            confidence: 1.0,
            entities: {
                date_phrase: entities.date_phrase,
                time_phrase: entities.time_phrase,
                department: entities.department
            },
            entities_confidence: entities.confidence,
            normalized: {
                date: normalized.date,
                time: normalized.time,
                tz: normalized.timezone
            },
            normalization_confidence: normConfidence,
            appointment: {
                department: normalized.department || entities.department || "General",
                date: normalized.date,
                time: normalized.time,
                tz: normalized.timezone
            },
            _id: appointment._id
        });
    } catch (err) { next(err); }
};

export const getAppointments = (req, res) => {
    res.json({ success: true, count: appointments.length, appointments: appointments.slice(0, 50) });
};
