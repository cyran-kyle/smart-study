const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const pptx2json = require('pptx2json');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load API keys from apis.json
let apiKeys = [];
try {
    const apiData = fs.readFileSync('apis.json', 'utf8');
    apiKeys = JSON.parse(apiData).keys;
} catch (error) {
    console.error('Error reading apis.json:', error);
    process.exit(1);
}

if (apiKeys.length === 0) {
    console.error('Error: No API keys found in apis.json.');
    process.exit(1);
}

let currentKeyIndex = 0;
let genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);

const app = express();
const port = 3001;
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

const rotateApiKey = () => {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
    console.log(`Rotating to API key index: ${currentKeyIndex}`);
};

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    let attempts = 0;

    while (attempts < apiKeys.length) {
        try {
                        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();
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