import express from 'express';
import { upload } from '../middleware/upload.js';
import { processImageUpload, processTextParse, getAppointments } from '../controllers/appointmentController.js';

const router = express.Router();

router.post('/upload', upload.single('image'), processImageUpload);
router.post('/parse-text', processTextParse);
router.get('/appointments', getAppointments);

export default router;
