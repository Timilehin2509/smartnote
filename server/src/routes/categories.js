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

// Get single category with its notes
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        // Get category details
        const [categories] = await pool.execute(
            'SELECT * FROM categories WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({ error: "Category not found" });
        }

        // Get notes in this category
        const [notes] = await pool.execute(
            `SELECT n.*, c.name as category_name 
             FROM notes n 
             LEFT JOIN categories c ON n.category_id = c.id 
             WHERE n.category_id = ? AND n.user_id = ?`,
            [req.params.id, req.user.id]
        );

        const category = categories[0];
        category.notes = notes;

        res.json(category);
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: "Failed to fetch category" });
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
    let connection;
    try {
        // Get a connection from the pool
        connection = await pool.getConnection();
        
        // Begin transaction
        await connection.beginTransaction();

        // Count affected notes
        const [notes] = await connection.execute(
            'SELECT COUNT(*) as count FROM notes WHERE category_id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        // Update notes to set category_id to NULL
        if (notes[0].count > 0) {
            await connection.execute(
                'UPDATE notes SET category_id = NULL WHERE category_id = ? AND user_id = ?',
                [req.params.id, req.user.id]
            );
        }

        // Delete the category
        const [result] = await connection.execute(
            'DELETE FROM categories WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Category not found" });
        }

        // Commit the transaction
        await connection.commit();

        res.json({ 
            message: "Category deleted successfully", 
            affectedNotes: notes[0].count 
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Delete category error:', error);
        res.status(500).json({ error: "Failed to delete category" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

export default router;

// Update categories.js frontend route
function displayCategories(categories) {
    const categoriesList = document.getElementById('categoriesList');
    if (!categories.length) {
        categoriesList.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No categories yet. Create your first category!</p>
            </div>
        `;
        return;
    }
    
    categoriesList.innerHTML = categories.map(category => `
        <div class="col-md-4 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${category.name}</h5>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="deleteCategory(${category.id})">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}