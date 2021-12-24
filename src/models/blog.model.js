const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
const slugOptions = require('../core/config/slug.config');
mongoose.plugin(slug, slugOptions);
const { Schema } = mongoose;

const BlogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        slug: ['title'],
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: Schema.Types.ObjectId,
        ref: "images",
        default: "61abcc17555fbbfc8ff6f75c",
        required: true
    },
    status: {
        type: String,
        enum: ['public', 'private', 'friend', 'deleted'],
        default: 'private',
        required: true
    },
    created: {
        type: Number,
        required: true
    },
    updated: {
        type: Number,
        default: null
    }
})

module.exports = mongoose.model('blogs', BlogSchema);
