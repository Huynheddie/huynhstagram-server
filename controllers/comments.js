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
  }).populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'user',
        model: 'User',
        select: 'username name profileImage'
      }]
    }]
  });
  response.json(updatedPost.toJSON());
}); 

commentsRouter.patch('/like/:id', async (request, response) => {
  const body = request.body;
  const userId = body.userId;
  const commentId = body.commentId;
  const postId = request.params.id;

  const post = await Post.findById(postId);
  const commentIndex = post.comments.findIndex(comment => comment._id.toString() === commentId);
  post.comments[commentIndex].likes.push({ user: userId });
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
  }).populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'user',
        model: 'User',
        select: 'username name profileImage'
      }]
    }]
  });
  response.json(updatedPost.toJSON());
});

commentsRouter.patch('/dislike/:id', async (request, response) => {
  const body = request.body;
  const userId = body.userId;
  const commentId = body.commentId;
  const postId = request.params.id;

  const post = await Post.findById(postId);
  const commentIndex = post.comments.findIndex(comment => comment._id.toString() === commentId);
  post.comments[commentIndex].likes = post.comments[commentIndex].likes.filter(like => like.user.toString() !== userId);
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
  })
  .populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'user',
        model: 'User',
        select: 'username name profileImage'
      }]
    }]
  });
  response.json(updatedPost.toJSON());
});

commentsRouter.patch('/remove', async (request, response) => {
  const { postId, commentId } = request.body;
  const post = await Post.findById(postId);
  post.comments = post.comments.filter(comment => comment.id !== commentId);
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
  }).populate({
    path: 'comments',
    populate: [{
      path: 'likes',
      populate: [{
        path: 'user',
        model: 'User',
        select: 'username name profileImage'
      }]
    }]
  });
  response.json(updatedPost.toJSON());
});

module.exports = commentsRouter;
