const express = require('express');
const router = express.Router();
const db = require('../db/database.js');
const crypto = require('crypto');

function hashPassword(password){
  return crypto.createHash('sha256').update(password).digest('hex');
}

router.get('/login', (req, res) => {
    res.render('login', { login_error: null, register_error: null });
});

router.post('/login', (req, res) => {
    const { login_username, login_password } = req.body;
    const hashedPassword = hashPassword(login_password);
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [login_username, hashedPassword], (err, user) => {
        if (err) {
            return res.render('login', { login_error: 'Error while login', register_error: null });
        }
        if (!user) {
            return res.render('login', { login_error: 'Invalid credentials', register_error: null });
        }
        req.session.user = user;
        res.redirect('/dashboard');
    });
});

router.post('/register', (req, res) => {
    const { register_username, register_password, register_repeat_password } = req.body;

    if (register_password != register_repeat_password) {
        return res.render('login', { register_error: 'Passwords do not match', login_error: null });
    }
    const hashedPassword = hashPassword(register_password);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [register_username, hashedPassword], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.render('login', { register_error: 'Username exists already', login_error: null });
            }
            return res.render('login', { register_error: 'Unknown Error', login_error: null });
        }
        db.get('SELECT * FROM users WHERE username = ? AND password = ?', [register_username, hashedPassword], (err, user) => {
            if (err || !user) {
                return res.render('login', { register_error: 'Error while login', login_error: null });
            }
            req.session.user = user;
            res.redirect('/dashboard');
        });
    });
});

module.exports = router;
