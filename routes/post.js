var mongoose = require('mongoose');
const { post } = require('.');


var postSchema = mongoose.Schema({
  post:String,
  likes:
  [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
    }],
  userid:
  {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'user'
  },
  comments: [
    {type: mongoose.Schema.Types.Mixed,
    ref:"user"}
  ]
});

module.exports = mongoose.model('post',postSchema);