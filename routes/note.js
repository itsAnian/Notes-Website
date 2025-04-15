const express = require('express');
const router = express.Router();
const db = require('../db/database.js');

router.get('/addnote', (req, res) => {
    if (!req.session.user){
        return res.redirect('/login');
    }
    res.render('addnote');
});

router.get('/editnote', (req, res) => {
    if (!req.session.user){
        return res.redirect('/login');
    }
    const note_id = req.query.id;

    db.get(`SELECT * FROM notes WHERE id = ? AND user_id = ?`, [note_id, req.session.user.id], (err, note) => {
        if (err || !note) return res.status(404).send('note not found');

        db.all(`SELECT tag FROM tags WHERE note_id = ?`, [note_id], (err, tags) => {
            if (err || !tags) return res.status(404).send('tag(s) not found');
            res.render('editnote', { note, tags });
        });
    });
});

router.get('/deletenote', (req, res) => {
    if (!req.session.user){
        return res.redirect('/login');
    }

    const note_id = req.query.id;
    db.run(`DELETE FROM notes WHERE id IS ?`, [note_id]);
    res.redirect('/dashboard');
});

router.post('/savenote', (req, res) => {
    if (!req.session.user){
        return res.redirect('/login');
    }

    const { id, title, content, tags, important } = req.body;
    const boolImportant = (important === 'on');

    if (id){
        db.run('UPDATE notes SET title = ?, content = ?, important = ? WHERE id IS ?',
            [title, content, boolImportant, id],
            function (err) {
                if (err) return console.error(err.message);

                if (tags) {
                    db.run(`DELETE FROM tags WHERE note_id IS ?`, [id]);
                    const tagList = tags.split(',').map(tag => tag.trim()).slice(0, 5);
                    tagList.forEach(tag => {
                        db.run(`INSERT INTO tags (note_id, tag) VALUES (?, ?)`, [id, tag]);
                    });
                }
            });
    } else {
        db.run('INSERT INTO notes (user_id, title, content, important) VALUES (?, ?, ?, ?)',
            [req.session.user.id, title, content, boolImportant],
            function (err) {
                if (err) return console.error(err.message);

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

module.exports = router;
