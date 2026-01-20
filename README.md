# AI-Powered Appointment Scheduler Assistant

A modern, intelligent appointment scheduling system that uses AI-powered OCR and natural language processing to extract appointment details from images and text. Built with Node.js, Express, Mistral AI, and Google Gemini.



## ✨ Features

### 🔍 Advanced OCR
- **Mistral Pixtral Vision Model** - State-of-the-art text extraction from images
- **Handwriting Recognition** - Excellent accuracy with handwritten appointment notes
- **Multi-format Support** - Works with JPG, JPEG, and PNG images

### 🧠 AI-Powered Entity Extraction
- **Google Gemini Integration** - Uses Gemini 2.5 Flash for intelligent text analysis
- **Natural Language Understanding** - Extracts dates, times, and departments from casual text
- **Smart Typo Correction** - Automatically corrects common spelling mistakes

### 📅 Date/Time Intelligence
- **Natural Language Parsing** - Understands phrases like "tomorrow at 3pm", "next Friday"
- **Timezone Support** - Handles timezone conversions (default: Asia/Kolkata)
- **ISO 8601 Normalization** - Converts to standard date/time formats

### 🎯 Smart Features
- **Ambiguity Detection** - Flags unclear requests for clarification
- **Confidence Scoring** - Provides confidence levels for OCR and entity extraction
- **RESTful API** - Clean, well-documented endpoints
- **Modern UI** - Beautiful, responsive web interface with glassmorphism design

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

### Required API Keys

You'll need to obtain the following API keys:

1. **Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Free tier available with generous limits

2. **Mistral AI API Key**
   - Visit [Mistral Console](https://console.mistral.ai/)
   - Sign up and create an API key
   - Paid service (~$0.001-0.002 per image)

## 🚀 Installation & Setup

### 1. Clone or Download the Project

```bash
# If using Git
git clone <repository-url>
cd AI-Powered-Appointment

# Or download and extract the ZIP file
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- `@google/generative-ai` - Google Gemini SDK
- `@mistralai/mistralai` - Mistral AI SDK
- `express` - Web framework
- `multer` - File upload handling
- `date-fns` - Date/time utilities
- `zod` - Validation
- And more...

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy the example file (if available)
cp .env.example .env

# Or create manually
touch .env
```

Add the following configuration to your `.env` file:

```env
# Server Configuration
PORT=3000

# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Mistral AI Configuration
MISTRAL_API_KEY=your_mistral_api_key_here

# Timezone Configuration
DEFAULT_TIMEZONE=Asia/Kolkata

# Upload Configuration
MAX_FILE_SIZE=5242880
```

> **⚠️ Important**: Replace `your_gemini_api_key_here` and `your_mistral_api_key_here` with your actual API keys!

### 4. Start the Server

#### Development Mode (with auto-reload)
```bash
npm run server
```

#### Production Mode
```bash
npm start
```

#### Watch Mode (Node.js built-in)
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 🎮 Usage

### Web Interface

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see a beautiful chat interface with two options:

#### Option 1: Text Input
Type your appointment request naturally:
```
"Book a dentist appointment for tomorrow at 3pm"
"Schedule cardiology next Friday at 10am"
"I need to see a doctor on Jan 25 at 2:30pm"
```

#### Option 2: Image Upload
1. Click the image icon 📷
2. Select an image containing appointment text (handwritten or printed)
3. Optionally add a caption
4. Click send

The AI will:
- Extract text from the image using Mistral OCR
- Identify date, time, and department
- Normalize to standard format
- Display the scheduled appointment

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Parse Text Request

**Endpoint:** `POST /api/parse-text`

**Description:** Process appointment text directly

**Request Body:**
```json
{
  "text": "Book dentist appointment next Friday at 3pm"
}
```

**Response (Success):**
```json
{
  "status": "ok",
  "raw_text": "Book dentist appointment next Friday at 3pm",
  "confidence": 1.0,
  "entities": {
    "date_phrase": "next Friday",
    "time_phrase": "3pm",
    "department": "Dentist"
  },
  "entities_confidence": 0.92,
  "normalized": {
    "date": "2026-01-24",
    "time": "15:00",
    "tz": "Asia/Kolkata"
  },
  "normalization_confidence": 0.95,
  "appointment": {
    "department": "Dentist",
    "date": "2026-01-24",
    "time": "15:00",
    "tz": "Asia/Kolkata"
  },
  "_id": "appt_1768839166600"
}
```

**Response (Needs Clarification):**
```json
{
  "status": "needs_clarification",
  "message": "I understood you want an appointment, but I need a bit more info: date (e.g., \"tomorrow\"), time (e.g., \"3pm\").",
  "raw_text": "Book an appointment",
  "confidence": 1.0,
  "entities_confidence": 0.45
}
```

#### 2. Upload Image

**Endpoint:** `POST /api/upload`

**Description:** Process an image containing appointment text

**Request:** `multipart/form-data`
- Field name: `image`
- Accepted formats: JPG, JPEG, PNG
- Max size: 5MB

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "image=@/path/to/appointment.jpg"
```

**Example using JavaScript:**
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Response:** Same structure as `/api/parse-text`, with additional `ocr_confidence` field

#### 3. Get Appointments

**Endpoint:** `GET /api/appointments`

**Description:** Retrieve all stored appointments

**Response:**
```json
{
  "success": true,
  "count": 2,
  "appointments": [
    {
      "_id": "appt_1768839166600",
      "rawText": "Book dentist appointment next Friday at 3pm",
      "extractedEntities": { ... },
      "normalizedData": { ... },
      "status": "success",
      "source": "text",
      "createdAt": "2026-01-20T05:39:26.600Z"
    }
  ]
}
```

## 🏗️ Project Structure

```
AI-Powered-Appointment/
├── controllers/              # Business logic
│   └── appointmentController.js
├── routes/                   # API route definitions
│   └── appointment.js
├── services/                 # Core services
│   ├── aiService.js         # Google Gemini integration
│   ├── mistralOCRService.js # Mistral Pixtral OCR
│   └── normalizationService.js # Date/time normalization
├── middleware/               # Express middleware
│   ├── upload.js            # Multer file upload config
│   └── errorHandler.js      # Global error handler
├── public/                   # Frontend files
│   ├── index.html           # Main HTML
│   ├── script.js            # Frontend JavaScript
│   └── style.css            # Styling
├── uploads/                  # Temporary image storage
├── .env                      # Environment variables (create this)
├── server.js                 # Application entry point
├── package.json              # Dependencies and scripts
├── README.md                 # This file
└── MISTRAL_OCR_GUIDE.md     # Detailed OCR documentation
```

## 🔧 Technology Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js v18+ |
| **Framework** | Express.js |
| **OCR** | Mistral Pixtral (vision model) |
| **AI/NLP** | Google Gemini 2.5 Flash |
| **Validation** | Zod |
| **Date/Time** | date-fns, date-fns-tz |
| **File Upload** | Multer |
| **Frontend** | Vanilla HTML/CSS/JS |

## 🎨 Frontend Features

- **Glassmorphism Design** - Modern, translucent UI elements
- **Animated Backgrounds** - Dynamic gradient blobs
- **Responsive Layout** - Works on desktop and mobile
- **Real-time Feedback** - Instant visual responses
- **Image Preview** - See uploaded images before sending
- **Confidence Indicators** - Visual confidence scores

## ⚙️ Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `GEMINI_API_KEY` | Google Gemini API key | - | Yes |
| `MISTRAL_API_KEY` | Mistral AI API key | - | Yes |
| `DEFAULT_TIMEZONE` | Default timezone for appointments | Asia/Kolkata | No |
| `MAX_FILE_SIZE` | Max upload size in bytes | 5242880 (5MB) | No |

### Supported Timezones

The system uses IANA timezone identifiers. Common examples:
- `Asia/Kolkata` (India)
- `America/New_York` (US Eastern)
- `Europe/London` (UK)
- `Asia/Tokyo` (Japan)
- `Australia/Sydney` (Australia)

[Full list of timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## 🧪 Testing

### Manual Testing

1. **Test Text Parsing:**
   ```bash
   curl -X POST http://localhost:3000/api/parse-text \
     -H "Content-Type: application/json" \
     -d '{"text": "Dentist appointment tomorrow at 3pm"}'
   ```

2. **Test Image Upload:**
   - Use the web interface at `http://localhost:3000`
   - Upload a sample appointment image
   - Verify the extracted information

3. **Test Edge Cases:**
   - Ambiguous dates: "Book appointment next week"
   - Missing information: "See doctor tomorrow"
   - Typos: "Cardiolgy apointment"


## 🐛 Troubleshooting

### Server won't start

**Issue:** `Error: Cannot find module...`
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Issue:** `Port 3000 already in use`
```bash
# Solution: Change port in .env
PORT=3001
```

### API Key Errors

**Issue:** `MISTRAL_API_KEY not configured`
```bash
# Solution: Check your .env file
# Ensure no extra spaces or quotes around the key
MISTRAL_API_KEY=your_actual_key_here
```

**Issue:** `Invalid API key`
- Verify the key is correct in Mistral/Gemini console
- Check for typos or extra characters
- Ensure the key hasn't expired

### OCR Issues

**Issue:** Low confidence or incorrect extraction
- Ensure image quality is good (clear, well-lit)
- Try cropping to just the relevant text
- Avoid very small or blurry text

**Issue:** `No text extracted from image`
- Check image format (JPG, JPEG, PNG only)
- Verify image isn't corrupted
- Ensure image contains visible text

## 🔒 Security Notes

- **API Keys**: Never commit `.env` file to version control
- **File Uploads**: Files are temporarily stored in `uploads/` directory
- **Input Validation**: All inputs are validated using Zod
- **Error Handling**: Sensitive error details are not exposed to clients

## 📝 Development

### Adding New Features

1. **New API Endpoint:**
   - Add route in `routes/appointment.js`
   - Add controller logic in `controllers/appointmentController.js`

2. **New Service:**
   - Create file in `services/`
   - Export functions
   - Import in controller

3. **Frontend Changes:**
   - Edit `public/index.html`, `public/script.js`, or `public/style.css`
   - Changes are reflected immediately (no build step)

### Code Style

- Use ES6+ features (async/await, arrow functions)
- Follow existing naming conventions
- Add JSDoc comments for functions
- Handle errors gracefully

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


## 🙏 Acknowledgments

- **Mistral AI** - For the powerful Pixtral vision model
- **Google** - For the Gemini AI API
- **Open Source Community** - For the amazing libraries used


---

**Made with ❤️ using AI-powered technologies**
