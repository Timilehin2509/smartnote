import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../config/auth.js';

const router = express.Router();

// Get all categories for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT * FROM categories WHERE user_id = ?',
            [req.user.id]
        );
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// Create category
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name?.trim()) {
            return res.status(400).json({ error: "Category name is required" });
        }

        // Check if category exists for this user
        const [existing] = await pool.execute(
            'SELECT id FROM categories WHERE user_id = ? AND name = ?',
            [req.user.id, name.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Category name already exists" });
        }

        const [result] = await pool.execute(
            'INSERT INTO categories (user_id, name) VALUES (?, ?)',
            [req.user.id, name.trim()]
        );

        res.status(201).json({
            message: "Category created successfully",
            categoryId: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Category name already exists" });
        }
        console.error('Create category error:', error);
        res.status(500).json({ error: "Failed to create category" });
    }
});

// Update category
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const categoryId = req.params.id;

        if (!name?.trim()) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const [result] = await pool.execute(
            'UPDATE categories SET name = ? WHERE id = ? AND user_id = ?',
            [name.trim(), categoryId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json({ message: "Category updated successfully" });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: "Failed to update category" });
    }
});

// Delete category
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Begin transaction
        await pool.execute('START TRANSACTION');

        // Count affected notes
        const [notes] = await pool.execute(
            'SELECT COUNT(*) as count FROM notes WHERE category_id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        // Delete category
        const [result] = await pool.execute(
            'DELETE FROM categories WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            await pool.execute('ROLLBACK');
            return res.status(404).json({ error: "Category not found" });
        }

        // Complete transaction
        await pool.execute('COMMIT');

        res.json({ 
            message: "Category deleted successfully", 
            affectedNotes: notes[0].count 
        });
    } catch (error) {
        await pool.execute('ROLLBACK');
        console.error('Delete category error:', error);
        res.status(500).json({ error: "Failed to delete category" });
    }
});

export default router;