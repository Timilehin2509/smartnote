import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import noteRoutes from './routes/notes.js';
import searchRoutes from './routes/search.js';

// Initialize Express app
const app = express();
dotenv.config();

// Get directory name (required for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(join(__dirname, '../../public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', join(__dirname, '../../views'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/search', searchRoutes);

// Basic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});