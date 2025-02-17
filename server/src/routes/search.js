import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../config/auth.js';

const router = express.Router();

// Search notes with filters
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { query, category_id, tags } = req.query;
        let sql = `
            SELECT n.*, 
                   GROUP_CONCAT(DISTINCT l.target_id) as linked_notes
            FROM notes n
            LEFT JOIN note_links l ON n.id = l.source_id
            WHERE n.user_id = ?
        `;
        const params = [req.user.id];

        // Add search conditions
        if (query) {
            sql += ' AND (title LIKE ? OR content LIKE ? OR summary LIKE ?)';
            const searchTerm = `%${query}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (category_id) {
            sql += ' AND category_id = ?';
            params.push(category_id);
        }

        if (tags) {
            const searchTags = JSON.parse(tags);
            if (Array.isArray(searchTags) && searchTags.length > 0) {
                sql += ' AND JSON_CONTAINS(tags, ?)';
                params.push(JSON.stringify(searchTags));
            }
        }

        sql += ' GROUP BY n.id ORDER BY n.created_at DESC';

        const [notes] = await pool.execute(sql, params);
        
        // Parse linked_notes string to array
        notes.forEach(note => {
            note.linked_notes = note.linked_notes 
                ? note.linked_notes.split(',').map(Number)
                : [];
        });

        res.json(notes);
    } catch (error) {
        console.error('Search notes error:', error);
        res.status(500).json({ error: "Failed to search notes" });
    }
});

export default router;