const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const pptx2json = require('pptx2json');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load API keys from apis.json
const geminiApiKeysEnv = process.env.GEMINI_API_KEYS;
let apiKeys = [];

if (geminiApiKeysEnv) {
    apiKeys = geminiApiKeysEnv.split(',');
}

let currentKeyIndex = 0;
let genAI = apiKeys.length > 0 ? new GoogleGenerativeAI(apiKeys[currentKeyIndex]) : null;

const app = express();
const port = 3001;
const upload = multer({ dest: '/tmp' });

app.use(express.json());

const rotateApiKey = () => {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
    console.log(`Rotating to API key index: ${currentKeyIndex}`);
};

app.post('/api/generate', async (req, res) => {
    if (!genAI) {
        return res.status(500).send('Error: Gemini API keys not configured. Please set GEMINI_API_KEYS environment variable.');
    }
    const { prompt } = req.body;
    let attempts = 0;

    while (attempts < apiKeys.length) {
        try {
                        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = await response.text();
            // Remove bold and italics markers
            text = text.replace(/\*{1,3}(.*?)\*{1,3}/g, '$1'); // For **bold** and ***bold***
            text = text.replace(/_{1,3}(.*?)_{1,3}/g, '$1'); // For __bold__ and ___bold___
            // Remove header markers
            text = text.replace(/^#+\s*(.*)$/gm, '$1'); // Remove #, ##, etc. at the start of a line
            // Remove code blocks
            text = text.replace(/```[\s\S]*?```/g, '');
            // Remove inline code
            text = text.replace(/`([^`]+?)`/g, '$1');
            // Remove list items (unordered and ordered)
            text = text.replace(/^[\s]*[-*+]\s/gm, '');
            text = text.replace(/^[\s]*\d+\.\s/gm, '');
            // Remove horizontal rules
            text = text.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '');
            // Remove blockquotes
            text = text.replace(/^[\s]*>\s/gm, '');
            // Remove links (keep text, remove URL)
            text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
            // Remove images (keep alt text, remove URL)
            text = text.replace(/!\[(.*?)\]\(.*?\)/g, '$1');
            // Replace multiple newlines with a single newline
            text = text.replace(/\n\s*\n/g, '\n');
            // Trim leading/trailing whitespace from each line and the whole text
            text = text.split('\n').map(line => line.trim()).join('\n').trim();
            return res.send(text);
        } catch (error) {
            console.error(`Error with API key index ${currentKeyIndex}:`, error.message);
            attempts++;
            if (attempts >= apiKeys.length) {
                return res.status(500).send(error.message);
            }
            rotateApiKey();
        }
    }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    let text = '';

    try {
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdfParse(filePath);
            text = data.text;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            const data = await pptx2json.parse(filePath);
            text = data.slides.map(slide => slide.text).join('\n');
        } else {
            return res.status(400).send('Unsupported file type.');
        }
        res.send({ text });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing file.');
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Clean up the uploaded file
        }
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});