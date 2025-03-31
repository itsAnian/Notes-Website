const express = require('express');
const app = express();
const path = require('path');
const db = require('./db/database.js');
const bodyParser = require('body-parser');
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }})
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/', (req, res) => {
    if (!req.session.user){
        res.redirect('/login');
    }
});

app.post('/login', (req, res) => {
    const { login_username, login_password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [login_username, login_password], (err, user) => {
        if (err) return res.send('Error while login');
        if (!user) return res.send('Invalid credentials');
        req.session.user = user;
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
        req.session.user = user;
        res.redirect('/dashboard');
    });
});

app.get('/dashboard', (req, res) => {
    console.log(req.session.user.username);
    if (!req.session.user){
        res.redirect('/login');
    }
    db.all(`SELECT
        notes.title,
        notes.content,
        notes.important,
        notes.created_at,
        GROUP_CONCAT(tags.tag, ', ') AS tags
        FROM notes
        FULL JOIN tags ON tags.note_id = notes.id
        WHERE notes.user_id = ?
        GROUP BY notes.id`, [req.session.user.id], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        rows.forEach(row =>{
            console.log(row);
        });
        res.render('dashboard', { notes: rows });
    });
});

app.get('/note', (req, res) => {
    if (!req.session.user){
        res.redirect('/login');
    }
   res.render('note');
});

app.post('/savenote', (req, res) => {
    if (!req.session.user){
        res.redirect('/login');
    }

    const { title, content, tags, important } = req.body;
    if(important == 'on'){
        boolImportant = true;
    }else{
        boolImportant = false;
    }

    db.run('INSERT INTO notes (user_id, title, content, important) VALUES (?, ?, ?, ?)',
        [req.session.user.id, title, content, boolImportant],
        function (err) {
            if (err) {
                return console.error(err.message);
            }

            const note_id = this.lastID;

            if (tags) {
                const tagList = tags.split(',').map(tag => tag.trim()).slice(0, 5);
                tagList.forEach(tag => {
                    db.run(`INSERT INTO tags (note_id, tag) VALUES (?, ?)`, [note_id, tag]);
                });
            }
        });
    res.redirect('/dashboard');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
