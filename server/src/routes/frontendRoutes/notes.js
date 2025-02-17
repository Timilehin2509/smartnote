import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.render('pages/notes/index', {
        title: 'My Notes',
        scripts: ['notes.js']
    });
});

router.get('/create', (req, res) => {
    res.render('pages/notes/create', {
        title: 'Create Note',
        scripts: ['create-note.js']
    });
});

router.get('/:id', (req, res) => {
    res.render('pages/notes/view', {
        title: 'View Note',
        noteId: req.params.id,
        scripts: ['view-note.js']
    });
});

export default router;