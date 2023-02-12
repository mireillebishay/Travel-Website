var express = require('express');
var path = require('path');
var fs = require("fs");
var app = express();
var session = require('express-session');
var alert = require('alert');
const PORT = process.env.PORT || 3030;



let db = null;
const MongoClient = require('mongodb').MongoClient;
const dbName = 'myDB';
const client = new MongoClient('mongodb://0.0.0.0:27017');
client.connect(function (err) {
  if (err) throw err;
  console.log('Connected successfully to server!');
  db = client.db(dbName);
});

var MongoDBSession = require('connect-mongodb-session')(session);
var mongoURI = "mongodb://localhost:27017/myDB";

var store = new MongoDBSession({
  uri: mongoURI,
  collection: 'myCollection'
});

app.use(session({
  secret: 'secret', // a secret key to sign the session ID cookie
  resave: false, // don't save the session if it was not modified
  saveUninitialized: false, // don't create a session if there is no activity
  store
}));

const sessions = (req, res, next) => {
  if (session.username) {
    next();
  } else {
    res.redirect('/');
  }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/annapurna', sessions, (req, res) => {
  res.render('annapurna')
});

app.get('/bali', sessions, (req, res) => {
  res.render('bali')
});

app.get('/cities', sessions, (req, res) => {
  res.render('cities')
});

app.get('/hiking', sessions, (req, res) => {
  res.render('hiking')
});

app.get('/home', sessions, (req, res) => {
  res.render('home')
});

app.get('/inca', sessions, (req, res) => {
  res.render('inca')
});

app.get('/index', sessions, (req, res) => {
  res.render('index')
});

app.get('/islands', sessions, (req, res) => {
  res.render('islands')
});

app.get('/addCountry', sessions, async (req, res) => {
  var country = req.url.split("?").pop();
  var user = await db.collection("myCollection").findOne({ username: req.session.username });
  var countries = user.wantToGo;
  if (countries.includes(country)) {
    alert("One time is enough!");
  }
  else {
    db.collection("myCollection").updateOne({ username: req.session.username }, { $push: { wantToGo: country } });
    alert("We hope you end up going!");
  }

  res.redirect(country);

});

app.get('/', function (req, res) {
  session = req.session;
  if (session.username) {
    res.render('home');
  } else {
    res.render('login')
  }
});

app.get('/paris', sessions, (req, res) => {
  res.render('paris')
});

app.get('/registration', function (req, res) {
  session = req.session;
  if (session.username) {
    res.render('home');
  } else {
    res.render('registration')
  }
});

app.get('/rome', sessions, (req, res) => {
  res.render('rome')
});

app.get('/santorini', sessions, (req, res) => {
  res.render('santorini')
});

app.get('/searchresults', sessions, (req, res) => {
  res.render('searchresults')
});

app.post('/search', sessions, (req, res) => {
  const countries = ["Bali Island", "Annapurna Circuit", "Inca Trail to Machu Picchu", "paris", "rome", "Santorini Island"];
  const searchKey = req.body.Search;
  if (searchKey.length == 0) {
    const results = ["The search bar is Empty , please write smth to search for"];
    res.render('searchresults', { results });
  }
  else {
    const results = countries.filter((element) => element.toLowerCase().includes(searchKey.toLowerCase()));
    for (let i = 0; i < results.length; i++) {
      if (results[i] == "Bali Island")
        results[i] = "bali";
      else if (results[i] == "Annapurna Circuit")
        results[i] = "annapurna";
      else if (results[i] == "Inca Trail to Machu Picchu")
        results[i] = "inca";
      else if (results[i] == "Santorini Island")
        results[i] = "santorini"
    }
    res.render('searchresults', { results });
  }
});

app.get('/wanttogo', sessions, async (req, res) => {
  var user = await db.collection("myCollection").findOne({ username: req.session.username });
  var List = user.wantToGo
  res.render('wanttogo', { List })

});


app.post('/', async function (req, res) {
  var user = req.body.username;
  var pass = req.body.password;
  if (user == "admin") {
    if (pass == "admin") {
      session = req.session;
      session.username = user;
      alert("You are Logged in !!")
      res.render('home');
    }
    else {
      alert("Wrong Password");
      res.redirect('/');
    }
  }

  else {

    if (user.length == 0 || pass.length == 0) {
      res.redirect('/');
      alert('Who are you?');
    }
    else {
      db.collection('myCollection').find({ username: user, password: pass }).toArray(function (err, doc) {
        if (doc[0] && doc[0].username == user && doc[0].password == pass) {
          session = req.session;
          session.username = req.body.username;
          alert("You are Logged in")
          res.redirect('home');
        }
        else {
          res.redirect('/');
          alert('Did you forget who you were?');
        }
      });
    }
  }
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/');
});





app.post('/register', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (username.length == 0 && password.length == 0) {
    res.redirect('registration');
  } else {
    db.collection("myCollection").countDocuments({ username }, (err, count) => {
      if (count > 0) {
        alert('Someone beat you to it! :P');
        res.redirect('registration');
      } else {
        db.collection("myCollection").insertOne({ username, password, wantToGo: [] });
        alert(" Account has been Successfully registered")
        res.redirect('/');
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});

app.listen(3000);
