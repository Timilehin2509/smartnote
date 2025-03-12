import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import authMiddleware from '../config/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// Update the stats route
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const [notesCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM notes WHERE user_id = ?',
            [req.user.id]
        );

        const [categoriesCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM categories WHERE user_id = ?',
            [req.user.id]
        );

        const [tagsResult] = await pool.execute(
            'SELECT COUNT(DISTINCT JSON_EXTRACT(tags, "$[*]")) as count FROM notes WHERE user_id = ? AND tags IS NOT NULL',
            [req.user.id]
        );

        // Add linked notes count
        const [linkedNotesCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM note_links nl 
             INNER JOIN notes n ON (nl.source_id = n.id OR nl.target_id = n.id) 
             WHERE n.user_id = ?`,
            [req.user.id]
        );

        res.json({
            notes: notesCount[0].count,
            categories: categoriesCount[0].count,
            tags: tagsResult[0].count,
            linkedNotes: linkedNotesCount[0].count
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: "Failed to fetch user stats" });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;

        if (!username?.trim()) {
            return res.status(400).json({ error: "Username is required" });
        }

        // If changing password, verify current password
        if (currentPassword && newPassword) {
            const [users] = await pool.execute(
                'SELECT password FROM users WHERE id = ?',
                [req.user.id]
            );

            const validPassword = await bcrypt.compare(currentPassword, users[0].password);
            if (!validPassword) {
                return res.status(401).json({ error: "Current password is incorrect" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: "New password must be at least 6 characters" });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.execute(
                'UPDATE users SET username = ?, password = ? WHERE id = ?',
                [username.trim(), hashedPassword, req.user.id]
            );
        } else {
            await pool.execute(
                'UPDATE users SET username = ? WHERE id = ?',
                [username.trim(), req.user.id]
            );
        }

        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// Delete user account
router.delete('/profile', authMiddleware, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Delete user's data in order
        await connection.execute('DELETE FROM note_links WHERE source_id IN (SELECT id FROM notes WHERE user_id = ?)', [req.user.id]);
        await connection.execute('DELETE FROM notes WHERE user_id = ?', [req.user.id]);
        await connection.execute('DELETE FROM categories WHERE user_id = ?', [req.user.id]);
        await connection.execute('DELETE FROM users WHERE id = ?', [req.user.id]);

        await connection.commit();
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Delete account error:', error);
        res.status(500).json({ error: "Failed to delete account" });
    } finally {
        if (connection) connection.release();
    }
});

// Get user preferences/settings
router.get('/preferences', authMiddleware, async (req, res) => {
    try {
        const [preferences] = await pool.execute(
            'SELECT default_theme, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        res.json(preferences[0]);
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: "Failed to fetch user preferences" });
    }
});

// Get user activity
router.get('/activity', authMiddleware, async (req, res) => {
    try {
        const [activities] = await pool.execute(`
            SELECT 'note' as type, title, 'created' as action, created_at as date
            FROM notes 
            WHERE user_id = ?
            UNION ALL
            SELECT 'note' as type, title, 'updated' as action, updated_at as date
            FROM notes 
            WHERE user_id = ? AND updated_at != created_at
            ORDER BY date DESC
            LIMIT 10
        `, [req.user.id, req.user.id]);

        res.json(activities);
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ error: "Failed to fetch user activity" });
    }
});

// Get linked notes count
router.get('/linked-notes', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.execute(
            'SELECT COUNT(*) as count FROM note_links WHERE source_id IN (SELECT id FROM notes WHERE user_id = ?)',
            [req.user.id]
        );
        res.json({ linkedNotes: result[0].count });
    } catch (error) {
        console.error('Get linked notes error:', error);
        res.status(500).json({ error: "Failed to fetch linked notes count" });
    }
});

export default router;