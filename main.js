const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let videoWindow;
let videoQueue = [];  // This will hold the queue of videos
let isQueueStarted = false;  // Flag to check if the queue has started
let currentVideo = null;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800, // Set width to your preference
        height: 600, // Set height to your preference
        fullscreen: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'public', 'main-window.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createVideoWindow() {
    videoWindow = new BrowserWindow({
        width: 800, // Set width to your preference
        height: 600, // Set height to your preference
        fullscreen: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    videoWindow.loadFile(path.join(__dirname, 'public', 'video-player-window.html'));

    videoWindow.on('closed', () => {
        videoWindow = null;
    });
}

app.whenReady().then(() => {
    createMainWindow();
    createVideoWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
            createVideoWindow();
        }
    });
});

// IPC Handler for Queue Video
ipcMain.on('queue-video', (event, videoSrc) => {
    videoQueue.push(videoSrc);  // Add the video to the queue
    console.log(`Video queued: ${videoSrc}`);
    mainWindow.webContents.send('queue-updated', videoQueue);  // Send the updated queue to the renderer
});

ipcMain.on('add-videos-to-queue', (event, videos) => {
    videoQueue = videoQueue.concat(videos);  // Add all selected videos to the queue
    mainWindow.webContents.send('queue-updated', videoQueue);  // Send the updated queue once after all videos are added
});


// IPC Handler for Remove Video from Queue
ipcMain.on('remove-video', (event, videoSrc) => {
    console.log(`Attempting to remove video: ${videoSrc}`);
    console.log(`Current queue before removal: ${JSON.stringify(videoQueue)}`);
    
    videoQueue = videoQueue.filter(v => !v.includes(videoSrc));  // Use more lenient comparison
    
    console.log(`Updated queue after removal: ${JSON.stringify(videoQueue)}`);
    mainWindow.webContents.send('queue-updated', videoQueue);  // Send updated queue to renderer
});

// Handle play first video event
ipcMain.on('play-first-video', (event) => {
    if (videoQueue.length > 0) {
        currentVideo = videoQueue.shift();  // Remove the first video from the queue
        videoWindow.webContents.send('play-video', currentVideo);  // Play the video in the video player window
        mainWindow.webContents.send('play-video', currentVideo);  // Update Now Playing in the main window
        mainWindow.webContents.send('queue-updated', videoQueue);  // Send updated queue to the renderer
    } else {
        console.log('No videos in the queue.');
    }
});

// IPC Handler for skipping the current video
ipcMain.on('skip-video', (event) => {
    console.log('Skipping current video');
    if (videoQueue.length > 0) {
        const nextVideo = videoQueue.shift();  // Get the next video from the queue
        currentVideo = nextVideo;  // Update current video

        // Send the next video to both windows (player and main window)
        videoWindow.webContents.send('play-video', nextVideo);
        mainWindow.webContents.send('play-video', nextVideo);
        mainWindow.webContents.send('queue-updated', videoQueue);  // Update the queue in the UI
    } else {
        console.log('No more videos in the queue.');
    }
});

// Handle stop video event
ipcMain.on('stop-video', (event) => {
    videoWindow.webContents.send('stop-video');  // Stop the current video
});

// Handle resume video event
ipcMain.on('resume-video', (event) => {
    if (currentVideo) {
        videoWindow.webContents.send('play-video', currentVideo);  // Resume the current video in the video player
        mainWindow.webContents.send('play-video', currentVideo);  // Update Now Playing in the main window
    }
});

// IPC to play the next video
ipcMain.on('next-video', (event) => {
    if (videoQueue.length > 0) {
        currentVideo = videoQueue.shift();  // Update the current video
        videoWindow.webContents.send('play-video', currentVideo);
        mainWindow.webContents.send('play-video', currentVideo);
        mainWindow.webContents.send('queue-updated', videoQueue);
    } else {
        isQueueStarted = false;
        currentVideo = null;
        console.log('Queue is empty');
    }
});

let currentVideoIndex = 0;  // Track the current video index

// IPC handler to play the video
ipcMain.on('play-video', (event) => {
    if (videoQueue.length > 0 && currentVideoIndex < videoQueue.length) {
        const videoSrc = videoQueue[currentVideoIndex];
        console.log(`Playing video: ${videoSrc}`);
        videoWindow.webContents.send('play-video', videoSrc); 
        mainWindow.webContents.send('play-video', videoSrc);
    }
});

// IPC handler to stop the video
ipcMain.on('stop-video', (event) => {
    videoWindow.webContents.send('stop-video');  // Send a message to stop the video
    console.log('Stopping video');
});
