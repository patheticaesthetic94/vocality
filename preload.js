const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC Renderer to the renderer process (your frontend)
contextBridge.exposeInMainWorld('electron', {
    playVideo: (videoURL) => ipcRenderer.send('play-video', videoURL),

    onPlayVideo: (callback) => ipcRenderer.on('play-video', callback),

    stopVideo: () => ipcRenderer.send('stop-video'),

    onStopVideo: (callback) => ipcRenderer.on('stop-video', () => {
        callback();
    }),
    // Sends a 'video-ended' message to the main process when a video ends
    onVideoEnded: () => {
        console.log('Sending next-video request to main process');
        ipcRenderer.send('next-video');  // Ensure this sends the 'next-video' event
    },
    addToQueue: (videoSrc) => ipcRenderer.send('queue-video', videoSrc),
    addVideosToQueue: (videos) => ipcRenderer.send('add-videos-to-queue', videos),
    onQueueUpdated: (callback) => ipcRenderer.on('queue-updated', (event, updatedQueue) => callback(updatedQueue)),
    onPlayVideo: (callback) => ipcRenderer.on('play-video', (event, videoSrc) => callback(videoSrc)),
    nextVideo: () => ipcRenderer.send('next-video'),
    removeFromQueue: (videoSrc) => ipcRenderer.send('remove-video', videoSrc),
    playFirstVideo: () => ipcRenderer.send('play-first-video'),  // Trigger the first video in the queue
    nextVideo: () => ipcRenderer.send('next-video'),
    onNextVideo: (callback) => ipcRenderer.on('next-video', callback),  // Listen for when to play the next video
    onPlayVideo: (callback) => ipcRenderer.on('play-video', (event, videoSrc) => callback(videoSrc)),  // Listen for video play event
    resumeVideo: () => ipcRenderer.send('resume-video'),
    onResumeVideo: (callback) => ipcRenderer.on('resume-video', callback),
    skipVideo: () => ipcRenderer.send('skip-video'),
});
