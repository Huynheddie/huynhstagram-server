const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

const postSchema = new mongoose.Schema({
  userName: {
    type: String,
    minlength: 5,
    required: true
  },
  date: Date,
  content: {
    type: String,
    required: true
  },
});

postSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('Post', postSchema);
