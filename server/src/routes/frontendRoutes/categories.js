import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.render('pages/categories/index', {
        title: 'Categories',
        scripts: ['categories.js']
    });
});

export default router;