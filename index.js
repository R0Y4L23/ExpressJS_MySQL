const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const auth = require("./auth");
var mysql = require('mysql');

//DB Connection
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
});
//DB Connection

const SECRET_KEY = 'thisIsARandom32CharactersLongStringForJWTSecurity'
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/check', auth, (req, res) => {
    res.send('Hello World, ' + req.userinfo.username + '!');
});

app.post('/login', (req, res) => {
    const {
        username,
        password
    } = req.body;
    if (username && password) {
        connection.query('SELECT * FROM users WHERE username = ?', [username], function (error, results, fields) {
            if (error) {
                res.status(500).send({
                    message: "Error connecting to database"
                });
            }
            if (results.length > 0) {
                bcrypt.compare(password, results[0].password, function (err, result) {
                    if (result) {
                        const token = jwt.sign({
                            username: username
                        }, SECRET_KEY);
                        res.send({
                            token: token
                        });
                    } else {
                        res.status(401).send({
                            message: "Invalid Password"
                        });
                    }
                });
            } else {
                res.status(401).send({
                    message: "Invalid Username"
                });
            }
        });
    } else {
        res.status(401).send({
            message: "Invalid Username or Password"
        });
    }
});

app.post('/register', (req, res) => {
    const {
        username,
        password,
        age
    } = req.body;
    if (username && password && age) {

        connection.query('SELECT * FROM users WHERE username = ?', [username], function (error, results, fields) {
            if (error) {
                res.status(500).send({
                    message: "Error connecting to database"
                });
            }
            if (results.length > 0) {
                res.status(401).send({
                    message: "Username already exists"
                });
            } else {
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(password, salt);
                connection.query(`INSERT INTO users VALUES ("${username}","${hash}",${age});`, (err, result) => {
                    if (err) {
                        res.status(500).send({
                            message: 'Error'
                        });
                    }
                    console.log(result);
                    const token = jwt.sign({
                        username
                    }, SECRET_KEY);
                    res.send({
                        token
                    });
                });
            }
        });
    } else {
        res.status(401).send({
            message: 'Invalid Credentials'
        });
    }
});

app.listen(3000, () => {
    console.log('server started on port 3000');
});