const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

// const commentSchema = new mongoose.Schema({
//   username: String,
//   data: String
// });

// mongoose.model('comment', commentSchema, 'comment');

const postSchema = new mongoose.Schema({
  date: Date,
  content: {
    type: String,
  },
  likes: [String],
  comments: [{
    username: String,
    comment: String
  }],
  imageId: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

postSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('Post', postSchema);
