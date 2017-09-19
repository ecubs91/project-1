var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var stylus = require('stylus');

var crypto = require('crypto'); // cryptography package for password encryption

var mysql = require('mysql'); // variable for DB connection. 
//var session = require('express-session'); // SESSION
var session = require('client-sessions');

// connect to DB
var connection = mysql.createConnection({
    host     : 'summer2017.cvpelrurjwzj.us-east-1.rds.amazonaws.com',
    user     : 'project_cnj',
    password : '123456cnj',
    database : 'cnjdatabase'
});


//var index = require('./routes/index');
//var users = require('./routes/users');

var app = express(); // app 세팅 시작. 

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  cookieName: 'session',
  secret: 'ZECTAISAWESOMEsummer',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));


//app.use('/', index);
//app.use('/users', users);

app.use(function(req,res,next){
  req.user_id = req.session.user_id || null; //'because_im_happy'; 
  req.email = req.session.email || null; //'something@gonewrong.com' ;
  res.locals.email = req.session.email || null; //'default@sample.com';
  res.locals.user_id= req.session.user_id || null; //'default_userid';
  next();
});


// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});*/

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};


/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
var sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};

function saltHashPassword(userpassword) {
    var salt = genRandomString(16); /** Gives us salt of length 16 */
    var passwordData = sha512(userpassword, salt);
    console.log('UserPassword = '+userpassword);
    console.log('Passwordhash = '+passwordData.passwordHash);
    console.log('nSalt = '+passwordData.salt);
    //return passwordData.passwordHash;
}

function requireLogin (req, res, next) {
  console.log('requirelogin is called: ');
  if (!req.email) {
    res.redirect('/login');
  } else {
    console.log('hey this is req.email captured by requireLogin: ' + req.email);
    next();
  }
};

/* GET home page. */
app.get('/', function(req, res, next) {
  //console.log('router get index ==='+req.session.email);
  res.render('index', { title: 'Welcome to ZECTA' , useremail: req.session.email});
});

app.get('/welcome', function(req, res, next) {
  //console.log('router get index ==='+req.session.email);
  res.render('welcome', { title: 'Welcome to ZECTA' , useremail: req.session.email});
});

app.get('/register', function(req, res, next) {
  //console.log('register print session ===' + req.session);
  res.render('register', { title: 'Register for ZECTA' });
});

app.get('/login', function(req,res,next){
  //console.log('login print session ===' + req.session);
  //console.log(req.session.email);
  res.render('login', {title: 'log in '});
});

app.get('/myprofile', function(req,res,next){

  res.render('myprofile', {user:"results"});
})

app.get('/contribute', requireLogin, function(req,res,next){
  //console.log('contribute print session ===' + req.session + ' email: ' + req.session.email );
  res.render('contribute', { title: 'crowd-source knowledge'});
});

// Logout endpoint
app.get('/logout', function (req, res) {
  //req.session.destroy();
  req.session.reset();
  //res.render('fkdlshfkdslfjkldsjfk!!!!');
  res.redirect('/');
});

app.get('/posting', function(req,res){
  var postingid = req.query.pid.toString();
  connection.query('SELECT * FROM resources WHERE id=\''+postingid+'\';', function(error, results){
    if (error){
      throw error;
    } else {
      console.log(results);
      res.render('posting', { data: results });
    }
  });
})

app.post('/changepassword', function(req,res){
  var currpw = req.body.currpw;
  var newpw = req.body.newpw;
  var email = req.session.email;

  var usersalt = genRandomString(16);
  var passwordData = sha512(newpw, usersalt);
  var hashed_pw = passwordData.passwordHash;

  connection.query('UPDATE users SET password=\''+hashed_pw +'\', salt=\''+usersalt+'\' WHERE email=\''+email+'\';', function(error, results){
    if (error){
      console.log('changepassword error');
      throw error;
    } else {
      res.render('myprofile', {message:"success"})
      /*
      if (results.length>0){
        res.redirect('/');
      } else {
        console.log('huh');
      }*/
    }
  })
})

app.post('/login', function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  console.log('password typed: '+ password);

  connection.query('SELECT salt FROM users WHERE email=\''+email+'\';', function(err, result){
    if (err){
      console.log('no salt for given user email');
      throw err;
    } else {
      if (result.length>0){
        var usersalt = result[0].salt;
        var passwordData = sha512(password, usersalt);
        var hashed_pw = passwordData.passwordHash;
        connection.query('SELECT * FROM users WHERE email=\''+email+'\' AND password=\''+hashed_pw+'\';', function(error, results){
          if (error){
            console.log('error');
            throw error;
          } else {
            if (results.length>0){
              req.session.email=email;
              req.email = email;
              req.user_id = results[0].user_id;
              req.session.user_id=results[0].user_id;
              res.locals.email = email;
              res.redirect('/');
            } else {
              res.render('login', {message:'invalid'})
              //throw error;
            }
          }
        });
      } else {
        res.render('login', {message:'invalid'})
      }
    }
  });
});

app.get('/resources', function(req,res,next) {
  var category = req.query.category;
  var keyword = req.query.keyword;
  console.log('param category received : ' + category);
  console.log('param keyword received : ' + keyword);
  
  if (keyword){
    connection.query('SELECT * from resources WHERE title LIKE \'%'+ keyword+ '%\' OR content LIKE \'%'+keyword+'%\';', function(err, results){
      console.log('selected everything WHERE LIKE : ' + results);
      res.render('resources', {result_arr:results});
    });
  }
  if (category=='0'){
    connection.query('SELECT * from resources;', function(err, results) {
          if (err) {
              console.log('error: ', err);
              throw err;
          }
          res.render('resources', {result_arr: results});
      });
  } else {
    connection.query('SELECT * from resources WHERE category='+JSON.stringify(category)+';', function(err, results) {
          if (err) {
              console.log('error: ', err);
              throw err;
          }
          res.render('resources', {result_arr: results});
      });
  } 
});

app.post('/register', function(req, res){
  var email = req.body.email;
  var password = req.body.password;
  var user_id = JSON.stringify(req.body.username);

  // security: Instead of saving raw password like '1234568pw', which is vulnerable to brute-force dictionary attacks, 
  //           generate a random 16-letters salt, hash the password with the salt, and then save both the hashed password and the
  //           user-specific salt to the 'users' database
  var usersalt = genRandomString(16);
  var passwordData = sha512(password, usersalt);
  var hashed_pw = passwordData.passwordHash;

  
  connection.query('SELECT * FROM users WHERE email=\''+email+'\';', function(error, result){
    if (error){
      throw error;
    } else {
      if (result.length>0){
        console.log('already EXISTS!!!');
        res.render('register', {message: "exists"});
      } else {
        console.log('not registered YET');
        connection.query('INSERT INTO users (user_id, password, email, salt) VALUES ('+user_id+','+JSON.stringify(hashed_pw)+',\''+email+'\','+JSON.stringify(usersalt)+');', function(err, results) {
          if (err) {
            throw err;
          }
          else {
            req.session.email=email;
            req.email = email;
            req.user_id = user_id;
            req.session.user_id=user_id;
            res.locals.email = email;
            res.render('welcome', { username: user_id });
          }
        });
      }
    }
  });
  
});

app.post('/contribute', function(req,res){
  var datetime = new Date().toLocaleDateString();
  var category = req.body.category;
  var categorynumber =0;
  if (category==='Mathematics'){
    categorynumber = 1;
  } else if (category==='Sciences'){
    categorynumber = 2;
  } else if (category==='Languages'){
    categorynumber = 3;
  } else if (category==='Humanities'){
    categorynumber = 4;
  }
  var title = JSON.stringify(req.body.title);
  var contents = JSON.stringify(req.body.contents);
  var userid=0;

  connection.query('SELECT * FROM users WHERE email=\''+req.session.email+'\';', function(err, results) {
        if (err) {
            console.log('error: ', err);
            throw err;
        } else {
          console.log('>>> numeric id for this user : '+results[0].id+' <<<');
          userid = results[0].id;
          username = results[0].user_id;
          connection.query('INSERT INTO resources (title, content, category, dateposted, user_id, poster_name) VALUES ('+title+','+contents+','+categorynumber+','+JSON.stringify(datetime)+','+userid+','+JSON.stringify(username)+');',function(err,results){
            if (err) throw err;
          });
        }
    });
  res.redirect('/resources?category=0');
});

app.post('/search', function(req,res){
  var keyword = req.body.keyword;
  console.log('keyword received: search: '+ keyword);
  res.redirect('/resources?category=0&keyword='+keyword); 
});

module.exports = app;
