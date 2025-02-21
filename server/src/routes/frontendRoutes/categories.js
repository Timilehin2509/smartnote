import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.render('pages/categories/index', {
        title: 'Categories',
        scripts: ['categories.js']
    });
});

router.get('/:id', (req, res) => {
    res.render('pages/categories/view', {
        title: 'View Category',
        categoryId: req.params.id,
        scripts: ['view-category.js']
    });
});

export default router;