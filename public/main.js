$(document).ready(function() {
    const $videoList = $('#videoList');
    const $queueList = $('#queueList');
    const $queueSelectedButton = $('#queueSelectedButton');
    const $playQueueButton = $('#playQueueButton');
    const $removeSelectedButton = $('#removeSelectedButton');
    const $nowPlaying = $('#nowPlaying');  // Now Playing section
    const $searchInput = $('#searchInput');  // Search input
    const $clearSearchButton = $('#clearSearchButton');  // Clear button

    let allVideos = [];  // Store all videos for easy reset
    let selectedVideos = [];  // Array to store selected videos
    let selectedQueueVideos = [];  // Array to store selected videos from the queue
    let videoQueue = [];  // Global video queue accessible by all functions
      
    // Function to clean up video names
    function cleanFileName(fileName) {
        // Remove '(Karaoke Version)' and the file extension
        return fileName
            .replace(/\(Karaoke Version\)/gi, '')  // Remove '(Karaoke Version)', case-insensitive
            .replace(/ - Karaoke Version from Zoom Karaoke/gi, '')
            .replace(/Karaoke Version from Zoom Karaoke/gi, '')
            .replace(/\.[^/.]+$/, '')  // Remove the file extension (e.g., '.mp4')
            .trim();  // Remove extra whitespace
    }

    // Function to extract and decode the file name from a URL
    function extractFileNameFromURL(url) {
        const fileName = url.split('/').pop();  // Get the last part of the URL (the file name)
        return decodeURIComponent(fileName);  // Decode the URL-encoded characters
    }

// Fetch and display the list of videos
function loadVideos() {
    $.get('http://localhost:3000/videos', function(videos) {
        if (videos && videos.length > 0) {
            allVideos = videos;  // Store all videos for later use
            displayVideos(videos);  // Display the videos
        } else {
            $videoList.html('<li>No videos found</li>');
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Failed to load videos:", textStatus, errorThrown);
        $videoList.html('<li>Error loading videos</li>');
    });
}

async function displayVideos(videos) {
    $videoList.empty();
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const video = entry.target.dataset.video;
                const imageUrl = `./resources/covers/${video.replace('.mp4', '.jpg')}`;
                const cleanName = cleanFileName(video);  
                const [artist, song] = cleanName.split(' - ');  
                const artistSpan = artist ? `<span class="artist">${artist}</span>` : '';  
                const songSpan = song ? `<span class="song">${song}</span>` : '';  

                // Initially hide the "Add to Queue" button
                $(entry.target).html(`
                    <div class="videoMeta">
                    <div class="imgContainer"><img src="${imageUrl}" onerror="this.onerror=null;this.src='./resources/covers/generic.png';" alt="Album Art"></div>
                    <div>${songSpan} ${artistSpan}</div>
                    </div>
                    <button class="add-to-queue-button" style="display:none;">Add</button>
                `);

                observer.unobserve(entry.target);  // Stop observing once loaded
            }
        });
    });

    for (const video of videos) {
        const videoItem = $(`<li class="video-item" data-video="${video}"></li>`).get(0);
        $videoList.append(videoItem);
        observer.observe(videoItem);  // Observe each video item for lazy loading
    }
}

// Function to remove special characters (e.g., apostrophes, dashes) from strings
function normalizeString(str) {
    return str.replace(/[^\w\s]/gi, '');  // Remove non-word characters, keep letters, numbers, and spaces
}

// Filter videos based on search input
$searchInput.on('input', function() {
    const searchText = normalizeString($(this).val().toLowerCase());  // Normalize search input

    const filteredVideos = allVideos.filter(video => {
        const cleanVideoName = normalizeString(cleanFileName(video).toLowerCase());  // Normalize video names
        return cleanVideoName.includes(searchText);  // Perform the search
    });

    displayVideos(filteredVideos);  // Display the filtered videos

    // Scroll back to the top of the scrollable area after displaying the filtered videos
    $('.scrollable').scrollTop(0);

    // Show the clear button if there is text, hide it if the input is empty
    if (searchText.length > 0) {
        $clearSearchButton.show();
    } else {
        $clearSearchButton.hide();
    }
});

// Clear search and reset the video list
$clearSearchButton.on('click', function() {
    $searchInput.val('');  // Clear the search input
    displayVideos(allVideos);  // Display the full video list again
    $clearSearchButton.hide();  // Hide the clear button

    // Scroll back to the top of the scrollable area after resetting the videos
    $('.scrollable').scrollTop(0);
});

// Event handler for selecting/deselecting videos from the main list
$videoList.on('click', '.video-item', function() {
    const $this = $(this);
    const video = $this.data('video');

    var sound = $('#highlightSound')[0];
        sound.currentTime = 0;
        sound.play();

    if ($this.hasClass('selected')) {
        // If the video is already selected, deselect it
        $this.removeClass('selected');
        $this.find('.add-to-queue-button').hide();  // Hide the "Add to Queue" button
    } else {
        // If the video is not selected, select it
        $('.video-item').removeClass('selected');  // Deselect any other selected videos
        $('.add-to-queue-button').hide();  // Hide other "Add to Queue" buttons
        $this.addClass('selected');
        $this.find('.add-to-queue-button').show();  // Show the "Add to Queue" button
    }

    console.log('Selected video:', video);  // For debugging
});

// Event handler for adding a video to the queue individually
$videoList.on('click', '.add-to-queue-button', function(e) {
    e.stopPropagation(); // Prevent click event from bubbling up to the video item

    const $this = $(this);
    const videoItem = $this.closest('.video-item');
    const video = videoItem.data('video');

    var sound = $('#addSound')[0];
    sound.currentTime = 0;
    sound.play();

    // Add the video to the queue directly without requiring any additional button
    const videoUrl = `http://localhost:3000/videos/${encodeURIComponent(video)}`;
    window.electron.addVideosToQueue([videoUrl]);  // Add the video to the queue via the electron method

    // Optionally disable the button or change its label to indicate the video has been added
    $this.prop('disabled', true)
    .text('Added');

    // Log the added video (for debugging)
    console.log('Added video to queue:', videoUrl);
});

// Event handler for selecting/deselecting videos from the queue
$queueList.on('click', '.queue-item', function() {
    const $this = $(this);
    const $removeButton = $this.find('.remove-from-queue-button');  // Find the remove button inside the selected item
    const videoURL = $this.data('video');

    var sound = $('#highlightSound')[0];
    sound.currentTime = 0;
    sound.play();

    if ($this.hasClass('selected')) {
        // If the video is already selected, deselect it
        $this.removeClass('selected');
        selectedQueueVideos = selectedQueueVideos.filter(v => v !== videoURL);  // Remove from selectedQueueVideos
        $removeButton.hide();  // Hide the remove button
    } else {
        // Deselect any previously selected video
        $queueList.find('.queue-item.selected').removeClass('selected').find('.remove-from-queue-button').hide();

        // Clear the selected queue videos array
        selectedQueueVideos = [];

        // Select the clicked video
        $this.addClass('selected');
        selectedQueueVideos.push(videoURL);  // Add to selectedQueueVideos
        $removeButton.show();  // Show the remove button
    }

    console.log('Selected queue video:', selectedQueueVideos);  // For debugging
});



$queueList.on('click', '.remove-from-queue-button', function(e) {
    e.stopPropagation();  // Prevent triggering the selection event

    const $this = $(this).closest('.queue-item');
    const videoURL = $this.data('video');

    var sound = $('#removeSound')[0];
    sound.currentTime = 0;
    sound.play();

    // Remove the selected video from the queue
    window.electron.removeFromQueue(videoURL);

    // Remove the video item from the UI and update selectedQueueVideos
    $this.remove();
    selectedQueueVideos = selectedQueueVideos.filter(v => v !== videoURL);

    // Check if the queue is now empty and show the empty message if needed
    if ($queueList.children().length === 0) {
        $('#emptyQueueMessage').show();  // Show the empty queue message
    }

    // Extract the filename from the full video URL
    const videoFileName = videoURL.split('/').pop();  // Extract the filename from the URL
    const decodedVideoFileName = decodeURIComponent(videoFileName);  // Decode URL-encoded characters (e.g., %20)

    // Enable the "Add to Queue" button for the corresponding video in the main list
    const $videoItem = $videoList.find(`.video-item[data-video="${decodedVideoFileName}"]`);
    
    // Log for debugging to see if the video item is found
    console.log('Video item found:', $videoItem.length > 0);

    if ($videoItem.length) {
        const $addToQueueButton = $videoItem.find('.add-to-queue-button');

        // Ensure the button exists and enable it
        if ($addToQueueButton.length) {
            $addToQueueButton.prop('disabled', false).text('Add');  // Enable and show the button
            console.log('Add to Queue button enabled for:', decodedVideoFileName);
        } else {
            console.error('Add to Queue button not found for:', decodedVideoFileName);
        }
    } else {
        console.error('Video item not found for:', decodedVideoFileName);
    }
});

    let isPlaying = false;  // Track whether a video is playing
    let isQueueStarted = false;  // Track if the queue has already started
    let currentVideo = null;  // Track the current playing video

    function playNextInQueue() {
        if (videoQueue.length > 0) {
            const nextVideo = videoQueue.shift();  // Remove and get the first video in the queue
            window.electron.playVideo(nextVideo);  // Play the video in the Electron player
    
            // Immediately update the UI after removing the video from the queue
            updateQueueUI(videoQueue);  // Call the function that updates the UI
        } else {
            console.log("Queue is empty.");
        }
    }
    
    
// Event handler for the Play Queue button
$playQueueButton.on('click', function() {
    if (!isPlaying) {
        if (!isQueueStarted) {
            window.electron.playFirstVideo();  // Trigger the first video in the queue
            isQueueStarted = true;  // Mark queue as started
        } else {
            window.electron.resumeVideo();  // Resume the current video if paused
        }
        $playQueueButton.html('<img src="./resources/icons/stop-svgrepo-com.svg">');  // Change the button to "Stop" icon
        isPlaying = true;  // Set the state to playing
    } else {
        window.electron.stopVideo();  // Stop the current video
        $playQueueButton.html('<img src="./resources/icons/play-svgrepo-com(1).svg">');  // Change the button to "Play" icon
        isPlaying = false;  // Set the state to stopped
    }
});

// Event handler for the Skip button
skipButton.addEventListener('click', () => {
    console.log('Skip button clicked, skipping to next video');
    window.electron.skipVideo();  // Send IPC event to skip the current video
});

// Play the next video in the queue and re-enable the "Add to Queue" button
window.electron.onNextVideo(() => {
    if (isPlaying && isQueueStarted) {
        window.electron.nextVideo();  // Play the next video in the queue

        // Re-enable the "Add to Queue" button for the video that just finished playing
        const videoFileName = currentVideo.split('/').pop();  // Extract the filename
        const decodedVideoFileName = decodeURIComponent(videoFileName);  // Decode the filename

        const $videoItem = $videoList.find(`.video-item[data-video="${decodedVideoFileName}"]`);
        if ($videoItem.length) {
            const $addToQueueButton = $videoItem.find('.add-to-queue-button');
            if ($addToQueueButton.length) {
                $addToQueueButton.prop('disabled', false).text('Add');  // Enable and show the button
                console.log('Add to Queue button enabled for:', decodedVideoFileName);
            }
        }
    }
});
    
    // Listen for the currently playing video
    window.electron.onPlayVideo((videoSrc) => {
        currentVideo = videoSrc;  // Track the currently playing video
        // Optionally update UI, like "Now Playing" section
        $('#nowPlaying').html(`<img src="./resources/covers/generic.png">${videoSrc}`);
    });    

// Update the Now Playing section and re-enable the "Add to Queue" button when a video starts playing
window.electron.onPlayVideo(async (videoSrc) => {
    try {
        const decodedFileName = extractFileNameFromURL(videoSrc);  // Extract and decode the file name from the URL
        const cleanName = cleanFileName(decodedFileName);  // Clean the file name for display
        const [artist, song] = cleanName.split(' - ');  // Split into artist and song

        const imageUrl = `./resources/covers/${decodedFileName.replace('.mp4', '.jpg')}`;  // Get the album art URL

        const artistSpan = artist ? `<span class="artist">${artist}</span>` : '';  // Wrap artist in span
        const songSpan = song ? `<span class="song">${song}</span>` : '';  // Wrap song in span

        // Update the Now Playing section
        $nowPlaying.html(`
            <img src="${imageUrl}" onerror="this.onerror=null;this.src='./resources/covers/generic.png';" alt="Album Art">
            <div>${songSpan} ${artistSpan}</div>
        `);

        // Re-enable the "Add to Queue" button for the video
        const videoFileName = videoSrc.split('/').pop();  // Extract the filename
        const decodedVideoFileName = decodeURIComponent(videoFileName);  // Decode the filename

        const $videoItem = $videoList.find(`.video-item[data-video="${decodedVideoFileName}"]`);
        if ($videoItem.length) {
            const $addToQueueButton = $videoItem.find('.add-to-queue-button');
            if ($addToQueueButton.length) {
                $addToQueueButton.prop('disabled', false).text('Add');  // Enable and show the button
                console.log('Add to Queue button enabled for:', decodedVideoFileName);
            }
        }

    } catch (error) {
        console.error(`Error updating Now Playing: ${error}`);
        $nowPlaying.html(`
            <img src="./resources/covers/generic.png" alt="Generic Album Art">
            <div><span class="song">Unknown Song</span> <span class="artist">Unknown Artist</span></div>
        `);
    }
});

async function updateQueueUI(updatedQueue) {
    const $queueList = $('#queueList');
    $queueList.empty();  // Clear the current list to avoid duplicates

    // Process all items asynchronously
    const processedItems = await Promise.all(updatedQueue.map(async (videoURL) => {
        const decodedFileName = extractFileNameFromURL(videoURL);  // Extract and decode the file name
        const cleanName = cleanFileName(decodedFileName);  // Clean the file name for display
        const [artist, song] = cleanName.split(' - ');  // Split into artist and song

        // Construct album art URL
        const imageUrl = `./resources/covers/${decodedFileName.replace('.mp4', '.jpg')}`;

// Build the list item using jQuery
const $listItem = $('<li>').addClass('queue-item').attr('data-video', videoURL);

const $imgElement = $('<img>')
    .addClass('queue-cover')
    .attr('src', imageUrl)
    .attr('onerror', "this.onerror=null;this.src='./resources/covers/generic.png';");  // Fallback to generic image if not found

const $songElement = $('<div>').html(
    `${song ? `<span class="song">${song}</span>` : ''} ${artist ? `<span class="artist">${artist}</span>` : ''}`
);

// Wrap imgElement and songElement inside a div with class videoMeta
const $videoMeta = $('<div>').addClass('videoMeta').append($imgElement).append($songElement);

// Initially hide the "Remove from Queue" button
// const $removeButton = $(`<button class="remove-from-queue-button" style="display:none;"><svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M16 8L8 16M8.00001 8L16 16" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
// </svg></button>`);
const $removeButton = $(`<button class="remove-from-queue-button" style="display:none;">Remove</button>`);

// Append the videoMeta and button to the list item
$listItem.append($videoMeta).append($removeButton);

// Return the list item
return $listItem;
    }));

    // Now append all processed items in the correct order
    processedItems.forEach(($listItem) => {
        $queueList.append($listItem);
    });

    // Check if there are any items in the queue, and show/hide the message accordingly
    if (updatedQueue.length === 0) {
        $('#emptyQueueMessage').show();  // Show the message if the queue is empty
    } else {
        $('#emptyQueueMessage').hide();  // Hide the message if there are items in the queue
    }
}

// Ensure this block only runs once
if (!window.queueUpdateListenerAdded) {
    window.electron.onQueueUpdated((updatedQueue) => {
        console.log(`Queue updated: ${JSON.stringify(updatedQueue)}`);
        updateQueueUI(updatedQueue);  // Update the UI with the new queue
    });
    window.queueUpdateListenerAdded = true;  // Set flag to avoid multiple listener attachments
}

    // Load videos initially
    loadVideos();
});

$(document).ready(function() {
    // Show keyboard when input field is focused
    $('input').focus(function() {
        var input = $(this);

        var sound = $('#openSound')[0];
        sound.currentTime = 0;
        sound.play();

        $('#keyboard').css('display', 'block'); // Ensure the keyboard is displayed
        setTimeout(function() {
            $('#keyboard').addClass('show'); // Add the 'show' class to animate the keyboard
        }, 10); // Small delay to trigger the CSS animation

        // Add click event to each key
        $('.key').off().on('click', function() {
            var key = $(this).text();

            var sound = $('#keySound')[0];
            sound.currentTime = 0;
            sound.play();

            if ($(this).hasClass('enter')) {
                // Close the keyboard when the Enter key is pressed
                $('#keyboard').removeClass('show');
                setTimeout(function() {
                    $('#keyboard').css('display', 'none'); // Hide the keyboard after animation
                }, 200); // Delay matches the CSS transition duration
            } else if ($(this).hasClass('space')) {
                // Add a space character to the input field
                input.val(input.val() + ' ');
            } else if ($(this).hasClass('backspace')) {
                // Simulate backspace by removing the last character
                input.val(input.val().slice(0, -1));
            } else {
                // Append the pressed key to the input field's value
                input.val(input.val() + key);
            }

            // Trigger the input event so it acts as if the user typed the characters
            input.trigger('input');
        });
    });

// Hide keyboard when clicking outside
$(document).click(function(e) {
    // Check if the keyboard has the 'show' class (indicating it is visible)
    if ($('#keyboard').hasClass('show') && !$(e.target).closest('input, #keyboard').length) {

        var sound = $('#closeSound')[0];
        sound.currentTime = 0;
        sound.play();

        // Remove the 'show' class and hide the keyboard after the animation
        $('#keyboard').removeClass('show');
        setTimeout(function() {
            $('#keyboard').css('display', 'none'); // Hide the keyboard after animation
        }, 200); // Delay matches the CSS transition duration
    }
});
});


$(document).ready(function() {
    var scrollAmount = 30; // Base scroll increment in pixels
    var maxScrollSpeed = 30; // Maximum scroll speed
    var scrollSpeed = scrollAmount;
    var scrollInterval;
    var isTouchScrolling = false;
    var isDragging = false; // Flag to check if the scrollbar is being dragged
    var lastTouchY = 0;
    var touchScrollSpeed = 0;
    var dragStartY = 0; // Stores the initial position of the drag start
    var dragStartScrollTop = 0; // Stores the initial scroll position when dragging starts

    function updateFakeScrollbar(scrollable) {
        var fakeScrollbar = scrollable.siblings('.fake-scrollbar');
        var scrollHeight = scrollable.prop('scrollHeight');
        var containerHeight = scrollable.outerHeight();
        var scrollTop = scrollable.scrollTop();
        var maxScroll = scrollHeight - containerHeight;

        // Fixed height for the scrollbar
        var fixedScrollbarHeight = 50; 
        var scrollbarTop = (scrollTop / scrollHeight) * containerHeight;

        // Update the scrollbar position and keep height constant
        fakeScrollbar.css({
            height: fixedScrollbarHeight + 'px', // Set to constant height
            top: scrollbarTop + 'px'
        });
    }

    // Function to dynamically calculate the scroll speed based on content size
    function calculateScrollSpeed(scrollable) {
        var scrollHeight = scrollable.prop('scrollHeight');
        var containerHeight = scrollable.outerHeight();
        var contentToVisibleRatio = scrollHeight / containerHeight;
        return scrollAmount * contentToVisibleRatio;
    }

    // Function to handle the scrollbar dragging
    function startDrag(scrollable, fakeScrollbar, event) {
        isDragging = true;
        dragStartY = event.pageY || event.originalEvent.touches[0].pageY; // Starting position
        dragStartScrollTop = scrollable.scrollTop(); // The initial scrollTop position of the div
        event.preventDefault(); // Prevent text selection while dragging
        scaleScrollbar(fakeScrollbar); // Scale the scrollbar when drag starts
    }

    function dragScroll(scrollable, fakeScrollbar, event) {
        if (isDragging) {
            var currentY = event.pageY || event.originalEvent.touches[0].pageY; // Current mouse/touch position
            var scrollHeight = scrollable.prop('scrollHeight');
            var containerHeight = scrollable.outerHeight();
            var maxScroll = scrollHeight - containerHeight;

            // Calculate the drag difference and how much to scroll the div
            var dragDifference = currentY - dragStartY;
            var scrollDistance = (dragDifference / containerHeight) * scrollHeight;

            // Calculate new scrollTop position and constrain it
            var newScrollTop = dragStartScrollTop + scrollDistance;
            newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

            scrollable.scrollTop(newScrollTop); // Scroll the div

            // Update fake scrollbar position
            updateFakeScrollbar(scrollable);
        }
    }

    function stopDrag(fakeScrollbar) {
        isDragging = false; // Stop dragging when the mouse/touch is released
        resetScrollbarScale(fakeScrollbar); // Reset the scale of the scrollbar
    }

    // Function to scale the scrollbar on drag or touch
    function scaleScrollbar(fakeScrollbar) {
        fakeScrollbar.css({
            transform: 'scale(2)', // Increase the width slightly
            transition: 'transform 0.2s ease' // Smooth transition
        });
    }

    // Function to reset the scrollbar scale when drag or touch ends
    function resetScrollbarScale(fakeScrollbar) {
        fakeScrollbar.css({
            transform: 'scale(1)', // Revert to original scale
            transition: 'transform 0.2s ease' // Smooth transition
        });
    }

    // Function to start automatic scrolling for a specific scrollable element
    function startScrolling(scrollable, direction) {
        scrollSpeed = calculateScrollSpeed(scrollable); // Dynamically calculate scroll speed
        scrollInterval = setInterval(function() {
            if (!isTouchScrolling && !isDragging) {
                var currentScroll = scrollable.scrollTop();
                var maxScroll = scrollable.prop('scrollHeight') - scrollable.outerHeight();

                // Calculate the new scroll position
                var newScrollTop = currentScroll + (scrollSpeed * direction);

                // Constrain newScrollTop within the valid range [0, maxScroll]
                newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

                // Apply the clamped scroll position
                scrollable.scrollTop(newScrollTop);

                // Update the disabled state of the up/down scroll buttons
                if (newScrollTop <= 0) {
                    scrollable.siblings('#scroll-up').addClass('disabled');
                } else {
                    scrollable.siblings('#scroll-up').removeClass('disabled');
                }

                if (newScrollTop >= maxScroll) {
                    scrollable.siblings('#scroll-down').addClass('disabled');
                } else {
                    scrollable.siblings('#scroll-down').removeClass('disabled');
                }

                // Update fake scrollbar
                updateFakeScrollbar(scrollable);
            }
        }, 30); // Scroll every 30ms
    }

    // Function to stop automatic scrolling
    function stopScrolling() {
        clearInterval(scrollInterval);
        scrollSpeed = scrollAmount; // Reset speed when the button is released
    }

    // Function to show the fake scrollbar
function showScrollbar(fakeScrollbar) {
    fakeScrollbar.css({
        opacity: 1, // Show scrollbar
        transition: 'opacity 0.3s ease' // Smooth fade-in transition
    });
}

// Function to hide the fake scrollbar
function hideScrollbar(fakeScrollbar) {
    fakeScrollbar.css({
        opacity: 0, // Hide scrollbar
        transition: 'opacity 0.3s ease' // Smooth fade-out transition
    });
}

    // Apply scroll functionality to each .scrollable element
    $('.scrollable').each(function() {
        var scrollable = $(this);
        var fakeScrollbar = scrollable.siblings('.fake-scrollbar');

        var maxScroll = scrollable.prop('scrollHeight') - scrollable.outerHeight();

        var hideTimeout; // To manage the delay for hiding the scrollbar

        // Initially hide the scrollbar
        hideScrollbar(fakeScrollbar);
    
        // Add touch handlers to show scrollbar on scroll initiation
        scrollable.on('touchstart scroll', function() {
            showScrollbar(fakeScrollbar); // Show scrollbar on touchstart or scroll
            clearTimeout(hideTimeout); // Clear the previous timeout
    
            // Set a timeout to hide the scrollbar after inactivity
            hideTimeout = setTimeout(function() {
                hideScrollbar(fakeScrollbar);
            }, 1500); // Hide scrollbar after 1.5 seconds of inactivity
        });
    
        scrollable.on('touchend', function() {
            // Optionally, hide immediately after touch ends
            hideTimeout = setTimeout(function() {
                hideScrollbar(fakeScrollbar);
            }, 1500);
        });

        // Event handlers for scroll down button
        scrollable.siblings('#scroll-down').on('mousedown touchstart', function() {
            startScrolling(scrollable, 1); // Scroll downwards
        }).on('mouseup touchend mouseleave', function() {
            stopScrolling();
        });

        // Event handlers for scroll up button
        scrollable.siblings('#scroll-up').on('mousedown touchstart', function() {
            startScrolling(scrollable, -1); // Scroll upwards
        }).on('mouseup touchend mouseleave', function() {
            stopScrolling();
        });

        // Initial check if the scrollable area is at the top or bottom
        if (scrollable.scrollTop() <= 0) {
            scrollable.siblings('#scroll-up').addClass('disabled');
        }

        if (scrollable.scrollTop() >= maxScroll) {
            scrollable.siblings('#scroll-down').addClass('disabled');
        }

        // Update fake scrollbar immediately after the page loads
        updateFakeScrollbar(scrollable);  // Ensure fake scrollbar is updated on page load

        // Add a scroll event listener to update the button states as the user scrolls manually
        scrollable.on('scroll', function() {
            var currentScroll = scrollable.scrollTop();
            var maxScroll = scrollable.prop('scrollHeight') - scrollable.outerHeight();

            if (currentScroll <= 0) {
                scrollable.siblings('#scroll-up').addClass('disabled');
            } else {
                scrollable.siblings('#scroll-up').removeClass('disabled');
            }

            if (currentScroll >= maxScroll) {
                scrollable.siblings('#scroll-down').addClass('disabled');
            } else {
                scrollable.siblings('#scroll-down').removeClass('disabled');
            }

            // Update fake scrollbar
            updateFakeScrollbar(scrollable);
        });

        // Add dragging behavior to the fake scrollbar
        fakeScrollbar.on('mousedown touchstart', function(e) {
            startDrag(scrollable, fakeScrollbar, e);
        });

        $(document).on('mousemove touchmove', function(e) {
            dragScroll(scrollable, fakeScrollbar, e);
        });

        $(document).on('mouseup touchend', function() {
            stopDrag(fakeScrollbar);
        });

        // Add touch handlers for scrolling via touch drag
        scrollable.on('touchstart', function(e) {
            isTouchScrolling = true; // Indicate touch scrolling is active
            lastTouchY = e.originalEvent.touches[0].clientY; // Capture the initial touch position
            touchScrollSpeed = 0; // Reset the touch scroll speed
        });

        scrollable.on('touchmove', function(e) {
            var touchY = e.originalEvent.touches[0].clientY; // Get the current touch Y position
            var deltaY = lastTouchY - touchY; // Calculate how much the finger has moved

            // Apply the scroll by adjusting the scrollTop based on deltaY
            scrollable.scrollTop(scrollable.scrollTop() + deltaY);

            // Update the last touch position and the scroll speed for momentum calculation
            lastTouchY = touchY;
            touchScrollSpeed = deltaY;

            // Update fake scrollbar while scrolling
            updateFakeScrollbar(scrollable);
        });

        scrollable.on('touchend', function() {
            isTouchScrolling = false; // End touch scrolling

            var maxScroll = scrollable.prop('scrollHeight') - scrollable.outerHeight();

            // Add a momentum effect after touch ends
            var momentumInterval = setInterval(function() {
                if (Math.abs(touchScrollSpeed) > 1) {
                    var newScrollTop = scrollable.scrollTop() + touchScrollSpeed;

                    // Constrain the scrollTop within bounds
                    newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

                    scrollable.scrollTop(newScrollTop);
                    touchScrollSpeed *= 0.96; // Gradually decrease speed for momentum effect

                    // Update fake scrollbar
                    updateFakeScrollbar(scrollable);
                } else {
                    clearInterval(momentumInterval); // Stop the momentum when speed is low
                }
            }, 30);
        });
    });
});
