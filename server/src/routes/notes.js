import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../config/auth.js';

const router = express.Router();

// Get single note - update this route
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        // First get the note details
        const [notes] = await pool.execute(
            `SELECT n.*, c.name as category_name 
             FROM notes n 
             LEFT JOIN categories c ON n.category_id = c.id 
             WHERE n.id = ? AND n.user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (notes.length === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        // Then get linked notes
        const [linkedNotes] = await pool.execute(
            `SELECT n.*, c.name as category_name,
                    CASE 
                        WHEN nl1.source_id = ? THEN 'outgoing'
                        WHEN nl2.target_id = ? THEN 'incoming'
                    END as link_type
             FROM notes n
             LEFT JOIN categories c ON n.category_id = c.id 
             LEFT JOIN note_links nl1 ON (n.id = nl1.target_id AND nl1.source_id = ?)
             LEFT JOIN note_links nl2 ON (n.id = nl2.source_id AND nl2.target_id = ?)
             WHERE ((nl1.source_id = ? OR nl2.target_id = ?))
             AND n.user_id = ?`,
            [req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.params.id, req.user.id]
        );

        // Combine note with its links
        const note = notes[0];
        note.linkedNotes = linkedNotes;
        res.json(note);
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ error: "Failed to fetch note" });
    }
});

// Get all notes
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [notes] = await pool.execute(
            `SELECT n.*, c.name as category_name 
             FROM notes n 
             LEFT JOIN categories c ON n.category_id = c.id 
             WHERE n.user_id = ?`,
            [req.user.id]
        );
        res.json(notes);
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: "Failed to fetch notes" });
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

        // Get existing note
        const [notes] = await pool.execute(
            'SELECT * FROM notes WHERE id = ? AND user_id = ?',
            [noteId, req.user.id]
        );

        if (notes.length === 0) {
            return res.status(404).json({ error: "Note not found" });
        }

        const currentNote = notes[0];

        // Update only provided fields
        const updatedNote = {
            title: title?.trim() || currentNote.title,
            content: content !== undefined ? content : currentNote.content,
            cue_column: cue_column !== undefined ? cue_column : currentNote.cue_column,
            summary: summary !== undefined ? summary : currentNote.summary,
            category_id: category_id !== undefined ? category_id : currentNote.category_id,
            tags: tags !== undefined ? JSON.stringify(tags) : currentNote.tags
        };

        const [result] = await pool.execute(
            `UPDATE notes SET 
                title = ?, content = ?, cue_column = ?, 
                summary = ?, category_id = ?, tags = ?
            WHERE id = ? AND user_id = ?`,
            [
                updatedNote.title,
                updatedNote.content,
                updatedNote.cue_column,
                updatedNote.summary,
                updatedNote.category_id,
                updatedNote.tags,
                noteId,
                req.user.id
            ]
        );

        res.json({ message: "Note updated successfully" });
    } catch (error) {
        console.error('Update note error:', error);
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

// Update the link endpoint to match
router.post('/:id/links', authMiddleware, async (req, res) => {
    let connection;
    try {
        const { linkedNoteIds } = req.body;
        const noteId = req.params.id;

        if (!Array.isArray(linkedNoteIds)) {
            return res.status(400).json({ error: "linkedNoteIds must be an array" });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Delete existing links
        await connection.execute(
            'DELETE FROM note_links WHERE source_id = ?',
            [noteId]
        );

        // Add new links if any exist
        if (linkedNoteIds.length > 0) {
            const placeholders = linkedNoteIds.map(() => '(?, ?)').join(',');
            const values = linkedNoteIds.flatMap(id => [noteId, parseInt(id)]);
            
            await connection.execute(
                `INSERT INTO note_links (source_id, target_id) VALUES ${placeholders}`,
                values
            );
        }

        await connection.commit();

        // Get updated linked notes
        const [linkedNotes] = await connection.execute(
            `SELECT n.*, c.name as category_name,
                    CASE 
                        WHEN nl1.source_id = ? THEN 'outgoing'
                        WHEN nl2.target_id = ? THEN 'incoming'
                    END as link_type
             FROM notes n
             LEFT JOIN categories c ON n.category_id = c.id 
             LEFT JOIN note_links nl1 ON (n.id = nl1.target_id AND nl1.source_id = ?)
             LEFT JOIN note_links nl2 ON (n.id = nl2.source_id AND nl2.target_id = ?)
             WHERE ((nl1.source_id = ? OR nl2.target_id = ?))
             AND n.user_id = ?`,
            [noteId, noteId, noteId, noteId, noteId, noteId, req.user.id]
        );

        res.json({
            message: "Links updated successfully",
            linkedNotes
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Link notes error:', error);
        res.status(500).json({ error: "Failed to update links" });
    } finally {
        if (connection) connection.release();
    }
});

export default router;