const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = 5000;

const DATA_FILE = path.join(__dirname, 'data/videos.json');
const API_URL = 'https://unit-3-project-api-0a5620414506.herokuapp.com';
const API_KEY = 'b9839b31-b3b8-4a10-a6c4-541c7c4b9c28';

app.use(express.json());
app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/videos/');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

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
    console.log('Successfully wrote to videos.json');
  } catch (err) {
    console.error('Error writing to data file:', err);
  }
};

const fetchVideoDetailsFromAPI = async (videoId) => {
  try {
    const response = await axios.get(`${API_URL}/videos/${videoId}?api_key=${API_KEY}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching video details for video ID ${videoId}:`, error);
    throw error;
  }
};

const populateVideos = async () => {
  try {
    const videoListResponse = await axios.get(`${API_URL}/videos?api_key=${API_KEY}`);
    const videoList = videoListResponse.data;

    const formattedVideos = [];
    for (let video of videoList) {
      const videoDetails = await fetchVideoDetailsFromAPI(video.id);
      formattedVideos.push({
        id: videoDetails.id,
        title: videoDetails.title,
        channel: videoDetails.channel,
        image: videoDetails.image,
        description: videoDetails.description || "No description available",
        views: videoDetails.views || "0",
        likes: videoDetails.likes || "0",
        duration: videoDetails.duration || "0:00",
        video: videoDetails.video || "https://www.example.com/video.mp4",
        timestamp: videoDetails.timestamp || Date.now(),
        comments: videoDetails.comments ? videoDetails.comments.map(comment => ({
          id: comment.id,
          name: comment.name,
          comment: comment.comment,
          likes: comment.likes,
          timestamp: comment.timestamp,
        })) : [],
      });
    }

    writeVideos(formattedVideos);
    console.log('Successfully populated videos.json with full video data!');
  } catch (error) {
    console.error('Error populating videos:', error);
  }
};

app.post('/videos', upload.fields([{ name: 'video' }, { name: 'poster' }]), (req, res) => {
  const { title, channel, description } = req.body;

  const newVideo = {
    id: uuidv4(),
    title,
    channel,
    image: req.files.poster
      ? `/images/${req.files.poster[0].filename}`
      : '/images/placeholder.jpg',
    description,
    views: '0',
    likes: '0',
    duration: '0:00',
    video: `/videos/${req.files.video[0].filename}`,
    timestamp: Date.now(),
    comments: [],
  };

  const videos = readVideos();
  videos.push(newVideo);
  writeVideos(videos);

  res.status(201).json(newVideo);
});

app.get('/videos', (req, res) => {
  const videos = readVideos();
  res.status(200).json(videos);
});

app.get('/videos/:id', (req, res) => {
  const videos = readVideos();
  const video = videos.find((v) => v.id === req.params.id);

  if (video) {
    res.status(200).json(video);
  } else {
    res.status(404).json({ message: 'Video not found' });
  }
});

app.post('/videos/:videoId/comments', (req, res) => {
  const { videoId } = req.params;
  const { comment } = req.body;

  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    return res.status(400).json({ message: 'Invalid comment' });
  }

  const videos = readVideos();
  const video = videos.find((v) => v.id === videoId);

  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }

  const newComment = {
    id: uuidv4(),
    name: 'Anonymous',
    comment: comment.trim(),
    likes: 0,
    timestamp: Date.now(),
  };

  video.comments.push(newComment);
  writeVideos(videos);

  res.status(201).json(newComment);
});

app.delete('/videos/:videoId/comments/:commentId', (req, res) => {
  const { videoId, commentId } = req.params;

  const videos = readVideos();
  const video = videos.find((v) => v.id === videoId);

  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }

  const commentIndex = video.comments.findIndex((comment) => comment.id === commentId);

  if (commentIndex === -1) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  video.comments.splice(commentIndex, 1);
  writeVideos(videos);

  res.status(200).json({ message: 'Comment deleted successfully' });
});

populateVideos();

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
