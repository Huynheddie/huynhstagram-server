const postsRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Post = require('../models/post');
const User = require('../models/user');
const { cloudinary } = require('../utils/cloudinary');

const getTokenFrom = request => {
  const authorization = request.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7);
  }
  return null;
};

postsRouter.get('/', async (request, response) => {
  const posts = await Post.find({}).populate('user', { username: 1, name: 1 });
  response.json(posts);
});

postsRouter.get('/:id', async (request, response) => {
  const post = await Post.findById(request.params.id);
  if (post) {
    response.json(post.toJSON());
  } else {
    response.status(404).end();
  }
});

postsRouter.post('/', async (request, response) => {
  const body = request.body;

  if (body.content === undefined) {
    return response.status(400).json({ error: 'Content missing' });
  }

  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  try {
    const fileStr = body.imageText;
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: 'dev-testing'
    });
    const publicImageId = uploadResponse.public_id;

    const user = await User.findById(decodedToken.id);

    const post = new Post({
      date: new Date(),
      content: body.content,
      imageId: publicImageId,
      user: user._id
    });
    
    const savedPost = await post.save();
    user.posts = user.posts.concat(savedPost._id);
    await user.save();

    response.json(savedPost.toJSON());

  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'uploading file unsuccessful' });
  }
  
});

postsRouter.put('/:id', async (request, response) => {
  const body = request.body;

  if (body.content === undefined) {
    return response.status(400).json({ error: 'Content missing' });
  }

  const token = getTokenFrom(request);
  const decodedToken = jwt.verify(token, process.env.SECRET);
  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = await User.findById(decodedToken.id);

  const post = {
    Date: new Date(),
    content: body.content,
    user: user._id
  };

  const updatedPost = await Post.findByIdAndUpdate(request.params.id, post, { new: true });
  response.json(updatedPost.toJSON());
});

postsRouter.delete('/:id', async (request, response) => {
  const post = await Post.findById(request.params.id);
  cloudinary.api.delete_resources([post.imageId]);
  await Post.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

module.exports = postsRouter;
