const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
const slugOptions = require('../core/config/slug.config');
mongoose.plugin(slug, slugOptions);
const { Schema } = mongoose;

const ForumBlogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['public', 'deleted'],
        default: 'public',
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

module.exports = mongoose.model('forum-blogs', ForumBlogSchema);
