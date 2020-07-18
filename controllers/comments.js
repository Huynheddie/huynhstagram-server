const commentsRouter = require('express').Router();
const Post = require('../models/post');

commentsRouter.post('/:id', async (request, response)  => {
  const body = request.body;
  const postId = request.params.id;
  const post = await Post.findById(postId);
  post.comments.push(body);
  await post.save();
  const updatedPost = await Post.findById(postId)
  .populate({
    path: 'user', model: 'User', select: 'username name profileImage'
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'user',
      model: 'User',
      select: 'username name profileImage'
    }]
  });
  response.json(updatedPost.toJSON());
}); 

module.exports = commentsRouter;
