const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    return res.json({
        success: true,
        message: 'API is alive!'
    });
});

const transaction_routes = require('./components/transaction/transaction.routes').router;
router.use('/history', transaction_routes);

exports.router = router;