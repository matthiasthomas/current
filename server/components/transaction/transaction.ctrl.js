const transactionDAO = require('./transaction.dao');
const fs = require('fs-extra');
const path = require('path');

module.exports = class transactionController {
    static createNew(req, res) {
        let _transaction = req.body;

        transactionDAO
            .createNew(_transaction)
            .then(result => res.status(result.status).send(result.message))
            .catch(err => res.status(err.status).send(err.message));
    }

    static getByTuid(req, res) {
        let _tuid = req.query.tuid;
        transactionDAO
            .getByTuid(_tuid)
            .then(result => res.status(result.status).send(result.message))
            .catch(err => res.status(err.status).send(err.message));
    }

    static getByWuid(req, res) {
        let _wuid = req.query.wuid;
        transactionDAO
            .getByWuid(_wuid)
            .then(result => res.status(result.status).send(result.message))
            .catch(err => res.status(err.status).send(err.message));
    }
}