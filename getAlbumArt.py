import os
import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
import re

# Function to clean the song name by removing unwanted words
def clean_song_name(song_name):
    # Define a list of words to remove from the search query
    unwanted_words = ['karaoke', 'version', 'instrumental', 'cover', 'remix']
    # Use a regex to remove these words (case insensitive)
    cleaned_name = re.sub(r'\b(?:' + '|'.join(unwanted_words) + r')\b', '', song_name, flags=re.IGNORECASE)
    # Remove any extra spaces left from the cleaning
    return ' '.join(cleaned_name.split())

# Function to search and scrape album art from Google Images
def get_album_art(query):
    search_url = f"https://www.google.com/search?tbm=isch&q={query}+album+art"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(search_url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the first valid image URL
    img_tags = soup.find_all("img")
    for img_tag in img_tags:
        img_url = img_tag.get("src")
        if img_url and img_url.startswith("http"):
            return img_url
    return None

# Function to download and save the image
def save_image(image_url, file_path):
    response = requests.get(image_url)
    image = Image.open(BytesIO(response.content))
    
    # Convert image to RGB if it's in 'P' mode
    if image.mode == 'P':
        image = image.convert('RGB')
        
    image.save(file_path)

# Folder paths
input_folder = '/run/media/deck/0345453a-3874-477d-8624-cb6214e2e631/video-player-app/videos'
output_folder = '/run/media/deck/0345453a-3874-477d-8624-cb6214e2e631/video-player-app/public/resources/covers'

# Ensure output folder exists
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Loop through files in the input folder
for filename in os.listdir(input_folder):
    if filename.endswith(('.mp4', '.avi', '.mkv')):  # Add your video file extensions
        song_name = os.path.splitext(filename)[0]  # Extract song name (without extension)
        output_path = os.path.join(output_folder, f"{song_name}.jpg")

        # Skip file if album art already exists
        if os.path.exists(output_path):
            print(f"Album art already exists for {song_name}. Skipping...")
            continue

        print(f"Original song name: {song_name}")

        # Clean the song name by removing unwanted words
        cleaned_song_name = clean_song_name(song_name)
        print(f"Searching for album art for: {cleaned_song_name}")

        # Search for the album art
        album_art_url = get_album_art(cleaned_song_name)

        if album_art_url:
            print(f"Found album art for {cleaned_song_name}. Downloading...")
            save_image(album_art_url, output_path)
            print(f"Album art saved as: {output_path}")
        else:
            print(f"No album art found for: {cleaned_song_name}")
