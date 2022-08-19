var express = require('express');
var router = express.Router();

const user = require('./users')
const post = require('./post')
var passport = require('passport');
const ls = require('passport-local');
const { redirect } = require('express/lib/response');
const { estimatedDocumentCount, countDocuments } = require('./users');
const multer = require('multer');


passport.use(new ls(user.authenticate()))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniq = Date.now() + '-' + Math.floor(Math.random() * 100000) + `${file.originalname}`
    cb(null, uniq)
    console.log(file);
  }
})

const fileFilter = function fileFilter(req, file, cb) {

  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }

}
const upload = multer({ storage: storage, fileFilter: fileFilter })


router.post('/upload', isLoggedIn, upload.single('image'), function (req, res) {
  user.findOne({ username: req.session.passport.user })
    .then(function (loggingUser) {
      loggingUser.profile = req.file.filename
      loggingUser.save().then(function () {
        res.redirect(req.headers.referer)
        console.log(req.file);
      })
    })

})

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index');
});

router.get('/profile', isLoggedIn, function (req, res) {
  user.findOne({
    username: req.session.passport.user
  })
    .populate('posts')
    .then(function (data) {
      res.render('profile', { data });
    })
})

router.post('/register', function (req, res, next) {
  var newUser = new user({
    username: req.body.username,
  })


  user.register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile')
      })
    })
    .catch(function (e) {
      res.send(e)
    })
})


router.post('/login', passport.authenticate('local',
  {
    successRedirect: '/profile',
    failureRedirect: '/'
  }), function (req, res) { })


router.get("/logout", function (req, res, next) {
  req.logout();
  res.redirect('/')
})


router.get("/read", function (req, res) {
  user.find({})
    .then(function (users) {
      res.render('read', { users })
    })
})


router.get("/read/:name", isLoggedIn, function (req, res) {
  user.findOne({
    username: req.params.name
  })
    .then(function (user) {
      res.send(user)
    })
})


router.get('/edit/:id', isLoggedIn, function (req, res, next) {
  user.findOne({
    _id: req.params.id
  }).then(function (data) {
    res.render('edit', { data })
  })
})

router.post("/edit/:id", isLoggedIn, function (req, res) {
  user.findOneAndUpdate({ _id: req.params.id }, {
    username: req.body.username
  },
    { new: true })
    .then(function (user) {
      res.send(user)
    })
})


router.post("/newpost", isLoggedIn, function (req, res) {
  user.findOne({ username: req.session.passport.user })
    .then(function (loggedinuser) {
      post.create({
        post: req.body.newpost,
        userid: loggedinuser._id
      }).then(function (createdpost) {
        loggedinuser.posts.push(createdpost._id);
        loggedinuser.save().then(function (savedUser) {
          res.redirect('/profile')
        });
      })
    })
})



router.get("/like/:id", function (req, res) {
  user.findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      post.findOne({
        _id: req.params.id
      })
        .then(function (foundPost) {
          if (foundPost.likes.indexOf(foundUser._id) === -1) {
            foundPost.likes.push(foundUser._id);
          }
          else {
            var kahaprexist = foundPost.likes.indexOf(foundUser._id);
            foundPost.likes.splice(kahaprexist, 1);
          }
          foundPost.save()
            .then(function () {
              res.redirect(req.headers.referer)
            })
        })
    })
})

router.get('/feed', isLoggedIn, function (req, res) {
  post.find({})
    .populate('userid')
    .then(function (posts) {
      console.log(req.headers.referer);
      res.render('feed', { posts })
    })
})


// router.post("/comment/:pid",isLoggedIn,function(req,res){
//   user.findOne({username:req.session.passport.user
//     })
//   .then(function(loggedinuser){
//     post.create({
//       comment:req.body.comment,
//       userid:loggedinuser._id,
//        pid:req.params.pid
//         })
//     .then(function(createdcomment){
//       post.findOne({pid:req.params.pid})
//       .then(function(foundPost){
//         foundPost.comments.push({comment:createdcomment});
//       foundPost.save().then(function(savedUser){
//       res.send(savedUser)
//       })
//       });
//     })
//   })
// })

router.post('/comment/:pid', function (req, res) {
  user.findOne({ username: req.session.passport.user })
    .then(function (loggingUser) {
      post.findOne({ _pid: req.params.pid })
        .then(function (foundPost) {
          foundPost.comments.push({ username: loggingUser._id, comment: req.body.comment })
          foundPost.save()
            .then(function (savedcomment) {

              res.send(savedcomment);
            })
        })
    })
})
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    redirect('/')
  }
}



module.exports = router
