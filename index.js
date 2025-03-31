const express = require('express');
const app = express();
const path = require('path');
const db = require('./db/database.js');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { login_username, login_password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [login_username, login_password], (err, user) => {
        if (err) return res.send('Error while login');
        if (!user) return res.send('Invalid credentials');
        res.redirect('/dashboard');
    });
});

app.post('/register', (req, res) => {
    const { register_username, register_password, register_repeat_password } = req.body;

    if (register_password != register_repeat_password) {
        return res.send('Passwords do not match' + register_password + register_repeat_password);
    }

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [register_username, register_password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.send('Username exists already');
            }
            return res.send('Error while registering');
        }
        res.redirect('/dashboard');
    });
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
