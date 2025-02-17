import express from 'express';
const router = express.Router();

// Serve login page
router.get('/login', (req, res) => {
    res.render('pages/auth/login', {
        title: 'Login',
        scripts: ['auth.js']
    });
});

router.get('/register', (req, res) => {
    res.render('pages/auth/register', {
        title: 'Register',
        scripts: ['register.js']
    });
});

export default router;