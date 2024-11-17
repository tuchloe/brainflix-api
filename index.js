const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

const DATA_FILE = path.join(__dirname, 'data/videos.json');

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

const readVideos = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading data file:', err);
    return [];
  }
};

const writeVideos = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to data file:', err);
  }
};

app.get('/videos', (req, res) => {
  const videos = readVideos();
  const videoList = videos.map(({ id, title, channel, image }) => ({
    id,
    title,
    channel,
    image,
  }));
  res.json(videoList);
});

app.get('/videos/:id', (req, res) => {
  const videos = readVideos();
  const video = videos.find((video) => video.id === req.params.id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.json(video);
});

app.post('/videos', (req, res) => {
  const videos = readVideos();
  const { title, channel, description } = req.body;

  if (!title || !channel || !description) {
    return res.status(400).json({ error: 'Missing required fields: title, channel, or description' });
  }

  const newVideo = {
    id: Date.now().toString(), 
    title,
    channel,
    image: '/images/example.jpg', 
    description,
    views: '0', 
    likes: '0', 
    duration: '0:00', 
    video: 'https://www.example.com/video.mp4', 
    timestamp: Date.now(),
    comments: [], 
  };

  
  videos.push(newVideo);
  writeVideos(videos);

  res.status(201).json(newVideo); 
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
