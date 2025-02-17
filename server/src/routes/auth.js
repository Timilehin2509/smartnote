import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Trim whitespace from inputs
        const trimmedUsername = username?.trim();
        const trimmedEmail = email?.trim().toLowerCase();
        
        // Enhanced validation
        if (!trimmedUsername || !trimmedEmail || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Basic password strength check
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Check if email already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [trimmedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        await pool.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [trimmedUsername, trimmedEmail, hashedPassword]
        );

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Get user
        const [users] = await pool.execute(
            'SELECT id, email, password FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Create token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            message: "Login successful",
            token 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: "Login failed" });
    }
});

export default router;