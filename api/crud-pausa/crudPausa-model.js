const mongoose = require('mongoose');

const crudPausaSchema = mongoose.Schema({
    pausa: {
        type: String
    },

    description: {
        type: String
    },
});

const crudPausa = mongoose.model('crudPausa', crudPausaSchema);

module.exports = crudPausa;