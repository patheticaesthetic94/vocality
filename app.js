const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to fetch videos from the /videos directory
app.get('/videos', (req, res) => {
    const videoFolder = path.join(__dirname, 'videos');
    fs.readdir(videoFolder, (err, files) => {
        if (err) {
            console.error("Error reading video directory:", err);  // Log the error
            return res.status(500).json({ message: 'Unable to read video directory' });
        }

        // Filter out only video files
        const videoFiles = files.filter(file => file.endsWith('.mp4'));
        res.json(videoFiles);  // Return the list of video files as JSON
    });
});

// Serve video files with spaces in the name
app.get('/videos/:filename', (req, res) => {
    const videoFolder = path.join(__dirname, 'videos');
    const decodedFilename = decodeURIComponent(req.params.filename);  // Decode the URL-encoded file name
    const videoPath = path.join(videoFolder, decodedFilename);

    if (fs.existsSync(videoPath)) {
        res.sendFile(videoPath);
    } else {
        res.status(404).send('Video not found');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
