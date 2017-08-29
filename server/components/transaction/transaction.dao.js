const transactionSchema = require('./transaction.model');
const _ = require('lodash');

const db = require('../../config/db.conf');

const Ajv = require('ajv');
const ajv = new Ajv({ coerceTypes: true });
const validateTransaction = ajv.compile(transactionSchema);

const transactionDAO = {};

transactionDAO.createNew = (transaction, extension) => {
    return new Promise((resolve, reject) => {
        const valid = validateTransaction(transaction);
        if (!_.isObject(transaction) || !valid) {
            // Implement real logger for real life app
            console.log(validateTransaction.errors);
            return reject({
                status: 400,
                message: 'Transaction object is invalid.'
            });
        }

        const query = `INSERT INTO trx 
            (sym, action, amt, cuid0, cuid1, actor, source, 
            destination, note, tuid, external_id, 
            timestamp, ref_tuid) 
            VALUES 
            (:sym, :action, :amt, :cuid0, :cuid1, :actor, :source, 
            :destination, :note, :tuid, :external_id, 
            :timestamp, :ref_tuid)
            IF NOT EXISTS`;
        // Parameters by marker name
        db.client.execute(query, transaction, { prepare: true })
            .then(result => {
                // Cassandra doesn't read before executing a write 
                // So two inserts on the same primary key will actually update the row
                // And return a success
                console.log(result);
                return resolve({
                    status: 201,
                    message: transaction
                });
            })
            .catch(err => {
                return reject({
                    status: 500,
                    message: err
                });
            });
    });
}

transactionDAO.getByTuid = (tuid) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM trx WHERE tuid=?`;
        db.client.execute(query, [tuid], { prepare: true })
            .then(result => {
                return resolve({
                    status: 200,
                    message: result.rows
                })
            })
            .catch(err => {
                return reject({
                    status: 500,
                    message: err
                });
            });
    });
}

transactionDAO.getByWuid = (wuid) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM trx WHERE wuid=?`;
        db.client.execute(query, [wuid], { prepare: true })
            .then(result => {
                return resolve({
                    status: 200,
                    message: result.rows
                })
            })
            .catch(err => {
                return reject({
                    status: 500,
                    message: err
                });
            });
    });
}

module.exports = transactionDAO;