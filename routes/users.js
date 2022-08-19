var mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/pass')

var userSchema = mongoose.Schema({
  username: String,
  password: String,
  profile: {
    type: String,
    default: 'a.jpg'
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }]
})

userSchema.plugin(plm)
module.exports = mongoose.model('user', userSchema);
