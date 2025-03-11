import express from 'express';
const router = express.Router();

router.get('/profile', (req, res) => {
    res.render('pages/user/profile', {
        title: 'Profile',
        scripts: ['profile.js']
    });
});

export default router;