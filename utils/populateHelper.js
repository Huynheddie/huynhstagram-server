const User = require('../models/user');

const populateUser = (jsonObj) => {
  jsonObj
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
  return jsonObj;
};

module.exports = {populateUser};