const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
const slugOptions = require('../core/config/slug.config');
mongoose.plugin(slug, slugOptions);
const { Schema } = mongoose;

const UserSchema = new Schema({
    username: {
        type: String,
        minlength: 4,
        maxlength: 200,
        required: true
    },
    password: {
        type: String,
        min: 8,
        max: 200,
        required: true
    },
    role: {
        type: String,
        default: "user",
        required: true
    },
    slug: {
        type: String,
        slug: ['name'],
        unique: true
    },
    name: {
        type: String,
        minlength: 3,
        maxlength: 200,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        minlength: 5,
        maxlength: 15,
        default: null
    },
    avatar: {
        type: Schema.Types.ObjectId,
        ref: "images",
        default: "61abcc02555fbbfc8ff6f75a",
        required: true
    },
    address: {
        type: String,
        default: null
    },
    country: {
        type: String,
        default: null
    },
    created: {
        type: Number,
        default: Date.now(),
        required: true
    },
    updated: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'block'],
        default: 'active',
        required: true
    }
})

module.exports = mongoose.model('users', UserSchema);