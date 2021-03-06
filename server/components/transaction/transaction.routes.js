const express = require('express');
const router = express.Router();
const transaction_ctrl = require('./transaction.ctrl');
const path = require('path');

router.route('/')
    .post(transaction_ctrl.createNew)
    .get((req, res) => {
        if (req.query.hasOwnProperty('tuid') && req.query.tuid !== "") {
            transaction_ctrl.getByTuid(req, res);
        } else if (req.query.hasOwnProperty('wuid') && req.query.wuid !== "") {
            transaction_ctrl.getByWuid(req, res);
        } else {
            res.status(400).send('Bad request!')
        }
    });

exports.router = router;