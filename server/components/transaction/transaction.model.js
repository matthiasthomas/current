const transactionSchema = {
    "type": "object",
    "properties": {
        "id": { "type": "string", "format": "uuid" },
        "sym": { "type": "string", "minLength": 3, "maxLength": 3 },
        "action": { "type": "string" },
        "amt": { "type": "number" },
        "cuid0": { "type": "string" },
        "cuid1": { "type": "string" },
        "actor": { "type": "string" },
        "source": { "type": "string" },
        "destination": { "type": "string" },
        "note": { "type": "string" },
        "tuid": { "type": "string" },
        "external_id": { "type": "string" },
        "timestamp": { "type": "number" },
        "ref_tuid": { "type": "string" }
    },
    "required": ["id", "sym", "action", "amt", "cuid0", "tuid", "timestamp"]
};

module.exports = transactionSchema;