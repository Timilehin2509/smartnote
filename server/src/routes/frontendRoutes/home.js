import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.render('pages/home', {
        title: 'Welcome to SmartNote'
    });
});

export default router;