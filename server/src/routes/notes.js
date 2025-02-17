import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../config/auth.js';

const router = express.Router();

// Get all notes for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [notes] = await pool.execute(
            'SELECT * FROM notes WHERE user_id = ?',
            [req.user.id]
        );
        res.json(notes);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});

// Get single note by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [notes] = await pool.execute(
            'SELECT * FROM notes WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (notes.length === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        res.json(notes[0]);
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ error: "Failed to fetch note" });
    }
});

// Create note
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, content, cue_column, summary, category_id, tags } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ error: "Title is required" });
        }

        const [result] = await pool.execute(
            `INSERT INTO notes (
                user_id, title, content, cue_column, summary, category_id, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, title.trim(), content, cue_column, summary, category_id, JSON.stringify(tags)]
        );

        res.status(201).json({
            message: "Note created successfully",
            noteId: result.insertId
        });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: "Failed to create note" });
    }
});

// Update note
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, content, cue_column, summary, category_id, tags } = req.body;
        const noteId = req.params.id;

        if (!title?.trim()) {
            return res.status(400).json({ error: "Title is required" });
        }

        // Log the update attempt
        console.log('Update attempt:', {
            noteId,
            userId: req.user.id,
            title,
            category_id,
            tags
        });

        const [result] = await pool.execute(
            `UPDATE notes SET 
                title = ?, content = ?, cue_column = ?, summary = ?, 
                category_id = ?, tags = ? 
            WHERE id = ? AND user_id = ?`,
            [title.trim(), content, cue_column, summary, category_id, 
             Array.isArray(tags) ? JSON.stringify(tags) : null, 
             noteId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        res.json({ message: "Note updated successfully" });
    } catch (error) {
        // Enhanced error logging
        console.error('Update note error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({ error: "Failed to update note" });
    }
});

// Delete note with link cleanup
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Delete note links first
        await pool.execute(
            'DELETE FROM note_links WHERE source_id = ? OR target_id = ?',
            [req.params.id, req.params.id]
        );

        const [result] = await pool.execute(
            'DELETE FROM notes WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: "Failed to delete note" });
    }
});

// Link notes
router.post('/:id/link', authMiddleware, async (req, res) => {
    try {
        const { linkedNoteIds } = req.body;
        const noteId = req.params.id;

        // Verify all notes belong to user
        const [userNotes] = await pool.execute(
            'SELECT id FROM notes WHERE id IN (?) AND user_id = ?',
            [linkedNoteIds, req.user.id]
        );

        if (userNotes.length !== linkedNoteIds.length) {
            return res.status(400).json({ error: "Invalid note IDs" });
        }

        await pool.execute(
            'DELETE FROM note_links WHERE source_id = ?',
            [noteId]
        );

        const linkPromises = linkedNoteIds.map(linkedId => 
            pool.execute(
                'INSERT INTO note_links (source_id, target_id) VALUES (?, ?)',
                [noteId, linkedId]
            )
        );

        await Promise.all(linkPromises);
        res.status(201).json({ message: "Notes linked successfully" });
    } catch (error) {
        console.error('Link notes error:', error);
        res.status(500).json({ error: "Failed to link notes" });
    }
});

export default router;