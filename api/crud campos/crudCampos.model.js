const mongoose = require('mongoose');

const inputTextSchema = mongoose.Schema({
    label: {
        type: String
    },
    description: {
        type: String
    },
}, { _id: false });

const textAreaSchema = mongoose.Schema({
    label: {
        type: String
    },
    description: {
        type: String
    },
    length: {
        type: Number
    },
}, { _id: false });

const selectOptionSchema = mongoose.Schema({
    label: {
        type: String
    },
    description: {
        type: String
    },
    values: {
        type: Array
    },
}, { _id: false });

const selectBoxSchema = mongoose.Schema({
    label: {
        type: String
    },
    description: {
        type: String
    },
}, { _id: false });

const relationSchema = mongoose.Schema({
    
});

const crudCamposSchema = mongoose.Schema({

    name: {
        type: String
    },

    description: {
        type: String
    },

    listInputText: [inputTextSchema],

    listTextArea: [textAreaSchema],

    listSelectOption: [selectOptionSchema],

    listSelectBox: [selectBoxSchema]

    //
    //relation:[]

});

const crudCampos = mongoose.model('crudCampos', crudCamposSchema);

module.exports = crudCampos;