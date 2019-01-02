const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true } )

const Schema = mongoose.Schema;

const ExerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});
const UserSchema = new Schema({
  username: String,
  log: [ExerciseSchema],
  count: Number
});

const UserModel = new mongoose.model('User', UserSchema);
const ExerciseModel = new mongoose.model('Exercise', ExerciseSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req, res) => {
  const user = new UserModel({
    username: req.body.username
  });
  
  user.save((err, data) => {
    if (err) console.log(err);
    res.send(data);
  });
  
})

app.get('/api/exercise/users', (req, res) => {
  const user = new UserModel();
  
  UserModel.find({}, (err, docs) => {
    if (err) console.log(err);
    
    res.send(docs);  
  });
  
})

app.post('/api/exercise/add', (req, res) => {
  const exercise = new ExerciseModel(
    req.body
  );
  
  if (!req.body.date) {
    exercise.date = new Date(); 
  }
  
  exercise.save((err, data) => {
    res.send(data);
  })  
});

app.get('/api/exercise/log', (req, res) => {
  
  if (!req.query.userId) {
    res.send({error: 'No user id defined in query string'});
  }
  
  let user = {};
  // load the user
   UserModel.findById(req.query.userId, (err, data) => {
     user = data;
     let query = ExerciseModel.where({userId: req.query.userId});
  
      if (req.query.limit) {
       query = query.limit(+req.query.limit); 
      }
     
      if (req.query.from) {
       query = query.where('date')
         .gte(new Date(req.query.from))
         .lte(new Date(req.query.to)); 
      }

      query.exec((err, docs) => {
        if (err) console.log(err);
        user.log = docs;
        user.count = docs.length;
        res.send(user);
      });
   });
})


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
