const express = require('express');
const app = express();
const path = require('path');
const db = require('./db/database.js');
const bodyParser = require('body-parser');
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'secret',
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
        db.get('SELECT * FROM users WHERE username = ? AND password = ?', [register_username, register_password], (err, user) => {
            if (err) return res.send('Error while login');
            if (!user) return res.send('Invalid credentials');
            req.session.user = user;
            res.redirect('/dashboard');
        });
    });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user){
        res.redirect('/login');
    }

    db.all(`SELECT
        notes.id,
        notes.title,
        notes.content,
        notes.important,
        notes.created_at,
        GROUP_CONCAT(tags.tag, ', ') AS tags
        FROM notes
        FULL JOIN tags ON tags.note_id = notes.id
        WHERE notes.user_id = ?
        GROUP BY notes.id`, [req.session.user.id], (err, notes) => {
            if (err) {
                return res.status(500).send('Database error');
            }

            db.all(`
        SELECT DISTINCT tags.tag
        FROM tags
        JOIN notes ON tags.note_id = notes.id
        WHERE notes.user_id = ?;`, [req.session.user.id], (err, tags) => {
            if (err) {
                return res.status(500).send('Database error');
            }
            res.render('dashboard', { notes, tags });
        });
    });
});

app.get('/filter', (req, res) => {
    const tag = req.query.tag;

    db.all(`SELECT
        notes.id,
        notes.title,
        notes.content,
        notes.important,
        notes.created_at,
        GROUP_CONCAT(tags.tag, ', ') AS tags
        FROM notes
        FULL JOIN tags ON tags.note_id = notes.id
        WHERE notes.user_id = ?
        AND notes.id IN (
        SELECT note_id FROM tags WHERE tag = ?
        )
        GROUP BY notes.id`, [req.session.user.id, tag], (err, notes) => {
            if (err) {
                return res.status(500).send('Database error');
            }
        db.all(`
        SELECT DISTINCT tags.tag
        FROM tags
        JOIN notes ON tags.note_id = notes.id
        WHERE notes.user_id = ?;`, [req.session.user.id], (err, tags) => {
            if (err) {
                return res.status(500).send('Database error');
            }
            res.render('dashboard', { notes, tags });
        });
    });
});

app.get('/addnote', (req, res) => {
    if (!req.session.user){
        res.redirect('/login');
    }
    res.render('addnote');
});

app.get('/editnote', (req, res) => {
    const note_id = req.query.id;
    if (!req.session.user){
        res.redirect('/login');
    }
    db.get(`SELECT * FROM notes WHERE id = ? AND user_id = ?`, [note_id, req.session.user.id], (err, note) => {
        if (err || !note) {
            return res.status(404).send('note not found');
        }
        db.all(`SELECT tag FROM tags WHERE note_id = ?`, [note_id], (err, tags) => {
            if (err || !tags) {
                return res.status(404).send('tag(s) not found');
            }

            res.render('editnote', { note, tags });
        });
    });
});

app.get('/deletenote', (req, res) => {
    const note_id = req.query.id;
    if (!req.session.user){
        res.redirect('/login');
    }

    db.run(`DELETE FROM notes WHERE id IS ?`, [note_id]);

    res.redirect('/dashboard');
});

app.post('/savenote', (req, res) => {
    if (!req.session.user){
        res.redirect('/login');
    }

    const { id, title, content, tags, important } = req.body;
    if(important == 'on'){
        boolImportant = true;
    }else{
        boolImportant = false;
    }

    if (id){
        db.run('UPDATE notes SET title = ?, content = ?, important = ? WHERE id IS ?',
            [title, content, boolImportant, id],
            function (err) {
                if (err) {
                    return console.error(err.message);
                }

                if (tags) {
                    db.run(`DELETE FROM tags WHERE note_id IS ?`, [id]);
                    const tagList = tags.split(',').map(tag => tag.trim()).slice(0, 5);
                    tagList.forEach(tag => {
                        db.run(`INSERT INTO tags (note_id, tag) VALUES (?, ?)`, [id, tag]);
                    });
                }
            });
    }else{
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
    }
    res.redirect('/dashboard');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
