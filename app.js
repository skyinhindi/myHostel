const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
var path = require('path');
const { render } = require('ejs');

const app = express();

//Middleware
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"rootUser1234",
    database:"hostel",
    multipleStatements:true
});

db.connect((err) => {
    if(err) throw err;
    else console.log("Connected to database...");
});

let Name = null;
let Block = null;
let Room = null;
let RegNo = null;
let message = '';
let admin = false;

//Routes
app.get('/', (req, res) => {
    let message = '';
    res.render('home', {message});
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/query', (req, res) => {
    db.query("SELECT * FROM occupant", (err, rows, fields) => {
        if(err) throw err;
        else res.render('query', {rows});
    })
});


app.post('/', (req,res, next) => {
    let queryString = `SELECT * FROM occupant WHERE RegNo =  ${req.body.regno}`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            if(rows.length < 1){
                console.log('Registration number does not exist...');
                let message = 'Registration Number does not exist';
                res.render('home', {message});
            }
            else if(rows[0].password == req.body.password){
                console.log('Login Successful...');
                Name = rows[0].Name;
                Block = rows[0].Block;
                Room = rows[0].Room;
                RegNo = rows[0].RegNo;
                res.render('logged-in', {Name, Block, Room, RegNo});
            }
            else{
                console.log('Incorrect Password...'); 
                let message = 'Incorrect Password';
                res.render('home', {message});
            }
        }
    }); 
});

app.get('/logged-in', (req,res) => {
    if(RegNo == null){
        let message = '';
        res.render('home', {message});
    }
    else{
        res.render('logged-in', {Name, Block, Room, RegNo});
    }
});

app.get('/create-complaint', (req, res) => {
    let message = 'Register you Request/Complaint';
    res.render('createComplaint', {message, RegNo});
});

app.post('/create-complaint', (req, res) => {
    let queryString = `INSERT INTO requests(RegNo, Type, Description) values(${RegNo}, "${req.body.reqType}", "${req.body.description}")`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            let message = 'Complaint was Registered';
            res.render('createComplaint', {message});
        }
    });
});

app.get('/your-complaints', (req, res) => {
    let queryString =  `SELECT * FROM requests WHERE RegNo = ${RegNo}`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            res.render('yourComplaint', {rows});
        }
    });
});

app.get('/change-password', (req, res) => {
    let message = 'CHANGE PASSWORD'; 
    res.render('changePassword', {message});
});

app.post('/change-password', (req, res) => {
    let queryString = `SELECT password FROM occupant WHERE RegNo = ${RegNo}`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            if(rows[0].password == req.body.oldPass){
                let newPass = req.body.newPass;
                queryString = `UPDATE occupant SET password = "${newPass}" WHERE RegNo = ${RegNo}`;
                db.query(queryString, (err, rows, fields) => {
                    if(err) throw err;
                    else{
                        let message = 'Password was Changed';
                        res.render('home', {message});
                    }
                });
            }
            else{
                let message = 'Old Password is Incorrect';
                res.render('changePassword', {message});
            }
        }
    });
});

app.get('/fees-dues', (req, res) => {
    let queryString =  `SELECT FeesDues.*, occupant.Name FROM FeesDues, occupant WHERE FeesDues.RegNo = ${RegNo} AND occupant.RegNo = ${RegNo}`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            res.render('feesDues', {rows});
        }
    });
});

app.get('/vacate-room', (req, res) => {
    let message = 'VACATE ROOM';
res.render('vacateRoom', {message});
});

app.post('/vacate-room', (req, res) => {
    let queryString = `SELECT password FROM occupant WHERE RegNo = ${RegNo}`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            if(rows[0].password == req.body.pass){
                queryString = `DELETE FROM FeesDues WHERE RegNo = ${RegNo}`;
                db.query(queryString, (err, rows, fields) => {
                    if(err) throw err;
                    else{
                        let message = 'Room has been Vacated';
                        res.render('home', {message});
                    }
                });
                queryString = `DELETE FROM occupant WHERE RegNo = ${RegNo}`;
                db.query(queryString, (err, rows, fields) => {
                    if(err) throw err;
                    else{
                        let message = 'Room has been Vacated';
                        res.render('home', {message});
                    }
                });
            }
            else{
                let message = 'Password is Incorrect';
                res.render('vacateRoom', {message});
            }
        }
    });
});

app.get('/logout', (req, res) => {
    message = '';
    Name = null;
    Block = null;
    Room = null;
    RegNo = null;
    admin = false;
    res.render('home', {message});
});

//admin routes

app.get('/admin', (req, res) => {
    if(admin == false){
        let message = '';
        res.render('adminLogin', {message});
    }
    else{
        res.render('admin');
    }
});

app.get('/admin-login', (req,res) => {
    let message = '';
    res.render('adminLogin', {message});
});

app.post('/admin-login', (req,res) => {
    let queryString = `SELECT * FROM admin WHERE UserID = "${req.body.userID}"`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            if(rows.length < 1){
                let message = 'User ID does not exist';
                res.render('adminLogin', {message});
            }
            else if(rows[0].Password == req.body.adminPass){
                console.log('Admin Login Successful...');
                admin = true;
                res.render('admin');
            }
            else{ 
                let message = 'Incorrect Password';
                res.render('home', {message});
            }
        }
    });
});

app.get('/new-occupant', (req, res) => {
    let message = '';
    res.render('newOccupant', {message});
});

app.post('/new-occupant', (req, res) => {
    let val = req.body;
    let queryString = `SELECT * FROM occupant WHERE RegNo =  ${val.newReg}`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            if(rows.length > 1){
                let message = 'Registration Number Already Exists';
                res.render('newOccupant', {message});
            }
            else{
                queryString = `INSERT INTO occupant values(${val.newReg}, "${val.newName}", ${val.newRoom}, "${val.newBlock}", ${val.newDOB}, "${val.newRoomType}","${val.newPhone}", "${val.newPassword}" )`;
                db.query(queryString, (err, rows, fields) => {
                    if(err) throw err;
                    else{
                        let message = 'Occupant was Registered';
                        res.render('newOccupant', {message});
                    }
                });
            }
        }
    });
});

app.get('/view-records', (req, res) => {
    let queryString = `SELECT * FROM occupant`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else res.render('query', {rows});
    });
});

app.get('/search-records', (req, res) => {
    let message = 'Search Records';
    res.render('searchRecords', {message});
}); 

app.post('/search-records', (req, res) => {
    let queryString = '';
    if(req.body.searchBy == 'RegNo'){
        queryString = `SELECT * FROM occupant WHERE RegNo = ${req.body.searchKey}`;
    }
    if(req.body.searchBy == 'Room'){
        queryString = `SELECT * FROM occupant WHERE Room = ${req.body.searchKey}`;
    }
    else{
        let key = req.body.searchKey;
        queryString = `SELECT * FROM occupant WHERE Name = "${key}"`;
    }
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else res.render('query', {rows});
    });
});

app.get('/view-fees-dues', (req, res) => {
    let queryString =  `SELECT FeesDues.*, occupant.Name FROM FeesDues, occupant WHERE FeesDues.RegNo = occupant.RegNo`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            res.render('adminFeesDues', {rows});
        }
    });
});

app.get('/view-complaints', (req, res) => {
    let queryString =  `SELECT * FROM requests`;
    db.query(queryString, (err, rows, fields) => {
        if(err) throw err;
        else{
            res.render('viewComplaint', {rows});
        }
    });
});

app.use((req, res) => {
    res.status(404).render('404');
  });

app.listen(process.env.PORT || 3000);