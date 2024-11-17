const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Path to the data file
const DATA_FILE = path.join(__dirname, 'data/videos.json');

// Middleware for parsing JSON request bodies
app.use(express.json());

// Serve static files (e.g., images) from 'public/images' directory
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Utility function to read video data
const readVideos = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading data file:', err);
    return [];
  }
};

// Utility function to write video data
const writeVideos = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to data file:', err);
  }
};

// GET /videos - Respond with an array of videos
app.get('/videos', (req, res) => {
  const videos = readVideos();
  // Return only the required fields for the video list
  const videoList = videos.map(({ id, title, channel, image }) => ({
    id,
    title,
    channel,
    image,
  }));
  res.json(videoList);
});

// GET /videos/:id - Respond with the details of a video by ID
app.get('/videos/:id', (req, res) => {
  const videos = readVideos();
  const video = videos.find((video) => video.id === req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.json(video);
});

// POST /videos - Add a new video to the video list
app.post('/videos', (req, res) => {
  const videos = readVideos();
  const { title, channel, description } = req.body;

  // Validate required fields
  if (!title || !channel || !description) {
    return res.status(400).json({ error: 'Missing required fields: title, channel, or description' });
  }

  // Create a new video object
  const newVideo = {
    id: Date.now().toString(), // Generate a unique ID
    title,
    channel,
    image: '/images/example.jpg', // Static image path (image should be in 'public/images')
    description,
    views: '0', // Default views
    likes: '0', // Default likes
    duration: '0:00', // Default duration
    video: 'https://www.example.com/video.mp4', // Dummy video URL
    timestamp: Date.now(),
    comments: [], // Empty comments array
  };

  // Add the new video to the array and save to file
  videos.push(newVideo);
  writeVideos(videos);

  res.status(201).json(newVideo); // Respond with the newly created video
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
