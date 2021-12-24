const mongoose = require('mongoose');
const  { Schema } = mongoose;

const ImageModel = new Schema({
    filename: {
        type: String,
        required: true
    },
    fieldname: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number
    },
    originalname: {
        type: String,
        required: true,
    },
    mimetype: {
        type: String,
        required: true,
    },
    type_image: {
        type: String,
        enum: ['default', 'owner', 'global'],
        default: 'default',
        required: true
    },
    created: {
        type: Number,
        default: Date.now(),
        required: true
    },
    updated: {
        type: Number,
        default: null
    }
});

module.exports = mongoose.model('images', ImageModel);