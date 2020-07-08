const postsRouter = require('express').Router();
const Post = require('../models/post');


postsRouter.get('/', async (request, response) => {
  const posts = await Post.find({});
  response.json(posts.map(post=>post.toJSON()));
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

  const post = new Post({
    userName: body.userName,
    date: new Date(),
    content: body.content
  });
  
  const savedPost = await post.save();
  response.json(savedPost.toJSON());
  
});

postsRouter.put('/:id', async (request, response) => {
  const body = request.body;

  const post = {
    userName: body.userName,
    Date: new Date(),
    content: body.content
  };

  const updatedPost = await Post.findByIdAndUpdate(request.params.id, post, { new: true });
  response.json(updatedPost.toJSON());
});

postsRouter.delete('/:id', async (request, response) => {
  await Post.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

module.exports = postsRouter;
