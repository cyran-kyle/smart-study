import React, { useState, useCallback } from 'react';
import './Loader.css'; // Import the new CSS file
import {
    Container,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    AppBar,
    Toolbar,
    Box,
    Grid,
    CssBaseline,
    ThemeProvider,
    createTheme,
    IconButton,
    Select,
    MenuItem,
    InputLabel,
    FormControl
} from '@mui/material';
import {
    ContentCopy,
    ClearAll,
    CloudUpload,
    Description,
    PictureAsPdf,
    GetApp,
    ShortText,
    HelpOutline,
    Create,
    School
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import SmartStudyLogo from './SmartStudyLogo';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
        },
        secondary: {
            main: '#f48fb1',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
    },
});

const learningStyles = [
    "Visual Learner (diagrams, charts)",
    "Auditory Learner (lectures, discussions)",
    "Kinesthetic Learner (hands-on activities)",
    "Reading/Writing Learner (text-based)",
    "For a 10-year-old",
    "For a University Student",
    "Socratic Method",
];

function App() {
    const [sourceText, setSourceText] = useState('');
    const [learningStyle, setLearningStyle] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        handleFileChange({ target: { files: [file] } });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {
        'application/pdf': [],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': [],
        'text/plain': [],
        'image/png': [],
        'image/jpeg': [],
        'image/gif': [],
        'image/bmp': [],
        'image/tiff': [],
    } });

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setIsLoading(true);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error((await response.text()) || `HTTP error! status: ${response.status}`);
            const data = await response.json();
            setSourceText(data.text);
        } catch (error) {
            setGeneratedContent(`Failed to upload file. Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async (action) => {
        if (!sourceText) {
            alert('Please provide some text to work with.');
            return;
        }

        setIsLoading(true);
        setGeneratedContent('');

        const style = learningStyle ? ` in a style tailored for a ${learningStyle}` : '';
        let prompt = '';

        switch (action) {
            case 'summarize':
                prompt = `Summarize the following text${style}:

${sourceText}`;
                break;
            case 'questions':
                prompt = `Generate a list of practice questions based on the following text${style}:

${sourceText}`;
                break;
            case 'explain':
                prompt = `Explain the following concept in simple terms${style}:

${sourceText}`;
                break;
            case 'flashcards':
                prompt = `Create a set of flashcards (term: definition) from the following text${style}:

${sourceText}`;
                break;
            case 'problems':
                prompt = `Generate a set of practice problems based on the following text${style}:

${sourceText}`;
                break;
            case 'solve-math':
                prompt = `Solve the following mathematical expression or problem. If it's not a mathematical problem, state "This is not a mathematical problem." and explain why. If it is a mathematical problem, provide the solution and the steps to solve it:

${sourceText}`;
                break;
            default:
                setIsLoading(false);
                return;
        }

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt
                }),
            });
            if (!response.ok) throw new Error((await response.text()) || `HTTP error! status: ${response.status}`);
            const data = await response.text();
            setGeneratedContent(data);
        } catch (error) {
            setGeneratedContent(`Failed to generate content. Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedContent);
    };

    const downloadContent = () => {
        const element = document.createElement("a");
        const file = new Blob([generatedContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "generated-content.txt";
        document.body.appendChild(element);
        element.click();
    }

    const clearFields = () => {
        setSourceText('');
        setLearningStyle('');
        setGeneratedContent('');
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid #333' }}>
                <Toolbar>
                                        <SmartStudyLogo />
                    <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
                        Smart Study
                    </Typography>
                    <IconButton onClick={clearFields} title="Clear Fields">
                        <ClearAll />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Unlock Deeper Understanding from Your Study Materials
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
                    Upload a document or paste text to generate summaries, practice questions, and more in your preferred learning style.
                </Typography>

                <Card sx={{ mb: 4, backgroundColor: 'rgba(30, 30, 30, 0.8)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            1. Provide Your Source Material
                        </Typography>
                        <Box {...getRootProps()} sx={{
                            border: `2px dashed ${isDragActive ? '#90caf9' : '#aaa'}`,
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            mb: 2
                        }}>
                            <input {...getInputProps()} />
                            <CloudUpload sx={{ fontSize: 48, color: '#90caf9' }} />
                            <Typography>
                                {isDragActive ? "Drop the files here ..." : "Drag 'n' drop some files here, or click to select files"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                (PDF, DOCX, PPTX, TXT, Images)
                            </Typography>
                        </Box>
                        <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                            <PictureAsPdf />
                            <Description />
                            <img src="https://img.icons8.com/ios/50/000000/image.png" alt="File icon" style={{ width: 24, height: 24, filter: 'invert(100%)' }} />
                        </Grid>
                        <TextField
                            label="Or paste your textbook chapter, article, or concept here"
                            multiline
                            rows={10}
                            fullWidth
                            variant="outlined"
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="For example, paste the text of a Wikipedia article or a chapter from your digital textbook."
                        />
                    </CardContent>
                </Card>

                <Card sx={{ mb: 4, backgroundColor: 'rgba(30, 30, 30, 0.8)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            2. Customize Your Learning Experience
                        </Typography>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel id="learning-style-label">Optional: Select a Learning Style</InputLabel>
                            <Select
                                labelId="learning-style-label"
                                value={learningStyle}
                                label="Optional: Select a Learning Style"
                                onChange={(e) => setLearningStyle(e.target.value)}
                            >
                                {learningStyles.map(style => (
                                    <MenuItem key={style} value={style}>{style}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 4, backgroundColor: 'rgba(30, 30, 30, 0.8)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            3. Generate Your Learning Materials
                        </Typography>
                        <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                            <Grid>
                                <Button variant="contained" color="primary" onClick={() => handleGenerate('summarize')} startIcon={<ShortText />}>
                                    Summarize
                                </Button>
                            </Grid>
                            <Grid>
                                <Button variant="contained" color="secondary" onClick={() => handleGenerate('questions')} startIcon={<HelpOutline />}>
                                    Generate Questions
                                </Button>
                            </Grid>
                            <Grid>
                                <Button variant="contained" color="success" onClick={() => handleGenerate('explain')} startIcon={<School />}>
                                    Explain Simply
                                </Button>
                            </Grid>
                            <Grid>
                                <Button variant="contained" style={{ backgroundColor: '#ff9800' }} onClick={() => handleGenerate('flashcards')} startIcon={<Create />}>
                                    Create Flashcards
                                </Button>
                            </Grid>
                            <Grid>
                                <Button variant="contained" style={{ backgroundColor: '#673ab7' }} onClick={() => handleGenerate('problems')} startIcon={<Create />}>
                                    Practice Problems
                                </Button>
                            </Grid>
                            <Grid>
                                <Button variant="contained" color="info" onClick={() => handleGenerate('solve-math')} startIcon={<School />}>
                                    Solve Math
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {isLoading && (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        zIndex: 9999
                    }}>
                        <div className="loader-container">
                            <svg version="1.1" id="L7" x="0px" y="0px"
                                viewBox="0 0 100 100" enable-background="new 0 0 100 100" className="loader-svg">
                                <path fill="#fff" d="M31.6,3.5C5.9,13.6-6.6,42.7,3.5,68.4c10.1,25.7,39.2,38.3,64.9,28.1l-3.1-7.9c-21.3,8.4-45.4-2-53.8-23.3
                                c-8.4-21.3,2-45.4,23.3-53.8L31.6,3.5z">
                                    <animateTransform 
                                        attributeName="transform" 
                                        attributeType="XML" 
                                        type="rotate"
                                        dur="2s" 
                                        from="0 50 50"
                                        to="360 50 50" 
                                        repeatCount="indefinite" />
                                </path>
                                <path fill="#fff" d="M42.3,39.6c5.7-4.3,13.9-3.1,18.1,2.7c4.3,5.7,3.1,13.9-2.7,18.1l4.1,5.5c8.8-6.5,10.6-19,4.1-27.7
                                c-6.5-8.8-19-10.6-27.7-4.1L42.3,39.6z">
                                    <animateTransform 
                                        attributeName="transform" 
                                        attributeType="XML" 
                                        type="rotate"
                                        dur="1s" 
                                        from="0 50 50"
                                        to="-360 50 50" 
                                        repeatCount="indefinite" />
                                </path>
                                <path fill="#fff" d="M82,35.7C74.1,18,53.4,10.1,35.7,18S10.1,46.6,18,64.3l7.6-3.4c-6-13.5,0-29.3,13.5-35.3s29.3,0,35.3,13.5
                                L82,35.7z">
                                    <animateTransform 
                                        attributeName="transform" 
                                        attributeType="XML" 
                                        type="rotate"
                                        dur="2s" 
                                        from="0 50 50"
                                        to="360 50 50" 
                                        repeatCount="indefinite" />
                                </path>
                            </svg>
                        </div>
                    </Box>
                )}

                {generatedContent && (
                    <Card sx={{ backgroundColor: 'rgba(30, 30, 30, 0.8)', backdropFilter: 'blur(10px)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" gutterBottom>
                                    Your Generated Material
                                </Typography>
                                <div>
                                    <IconButton onClick={copyToClipboard} title="Copy to Clipboard">
                                        <ContentCopy />
                                    </IconButton>
                                    <IconButton onClick={downloadContent} title="Download Content">
                                        <GetApp />
                                    </IconButton>
                                </div>
                            </Box>
                            <Typography variant="body1" sx={{ whiteWhiteSpace: 'pre-wrap', mt: 2 }}>
                                {generatedContent}
                            </Typography>
                        </CardContent>
                    </Card>
                )}
            </Container>
        </ThemeProvider>
    );
}

export default App;
