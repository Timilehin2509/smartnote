import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../config/auth.js';

const router = express.Router();

// Search notes with filters
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { query = '', searchNotes = 'true', searchCategories = 'true', searchTags = 'true' } = req.query;
        const results = [];

        if (searchNotes === 'true') {
            const [notes] = await pool.execute(`
                SELECT 'note' as type, n.*, c.name as category_name
                FROM notes n
                LEFT JOIN categories c ON n.category_id = c.id
                WHERE n.user_id = ? AND (
                    n.title LIKE ? OR 
                    n.content LIKE ? OR 
                    n.summary LIKE ?
                )
            `, [req.user.id, `%${query}%`, `%${query}%`, `%${query}%`]);
            results.push(...notes);
        }

        if (searchCategories === 'true') {
            const [categories] = await pool.execute(`
                SELECT 'category' as type, id, name as title
                FROM categories 
                WHERE user_id = ? AND name LIKE ?
            `, [req.user.id, `%${query}%`]);
            results.push(...categories);
        }

        if (searchTags === 'true') {
            const [notes] = await pool.execute(`
                SELECT 'note' as type, id, title, summary 
                FROM notes 
                WHERE user_id = ? AND 
                JSON_SEARCH(tags, 'one', ?) IS NOT NULL
            `, [req.user.id, query]);
            results.push(...notes);
        }

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: "Search failed" });
    }
});

export default router;