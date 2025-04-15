const express = require('express');
const router = express.Router();
const db = require('../db/database.js');

router.get('/', (req, res) => {
    if (!req.session.user){
        return res.redirect('/login');
    }

    db.all(`
        SELECT
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

        if (err) return res.status(500).send('Database error');

        db.all(`
            SELECT DISTINCT tags.tag
            FROM tags
            JOIN notes ON tags.note_id = notes.id
            WHERE notes.user_id = ?;`, [req.session.user.id], (err, tags) => {

            if (err) return res.status(500).send('Database error');

            res.render('dashboard', { notes, tags });
        });
    });
});

router.get('/filter', (req, res) => {
    if (!req.session.user){
        return res.redirect('/login');
    }

    const tag = req.query.tag;

    db.all(`
        SELECT
        notes.id,
        notes.title,
        notes.content,
        notes.important,
        notes.created_at,
        GROUP_CONCAT(tags.tag, ', ') AS tags
        FROM notes
        FULL JOIN tags ON tags.note_id = notes.id
        WHERE notes.user_id = ?
        AND notes.id IN (SELECT note_id FROM tags WHERE tag = ?)
        GROUP BY notes.id`, [req.session.user.id, tag], (err, notes) => {

        if (err) return res.status(500).send('Database error');

        db.all(`
            SELECT DISTINCT tags.tag
            FROM tags
            JOIN notes ON tags.note_id = notes.id
            WHERE notes.user_id = ?;`, [req.session.user.id], (err, tags) => {

            if (err) return res.status(500).send('Database error');

            res.render('dashboard', { notes, tags });
        });
    });
});

module.exports = router;
