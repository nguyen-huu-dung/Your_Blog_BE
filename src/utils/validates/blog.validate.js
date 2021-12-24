const joi = require('joi');

const createBlogValidate = (data) => {
    const Schema = joi.object({
        title: joi.string().min(4).max(200).required('Title is required'),
        description: joi.string().min(20).required('Description is required'),
        status: joi.string().valid('public', 'friend', 'private').required('Status blog is required')
    })
    return Schema.validate(data);
}

const updateBlogValidate = (data) => {
    const Schema = joi.object({
        title: joi.string().min(4).max(200),
        description: joi.string().min(20),
        status: joi.string().valid('public', 'friend', 'private')
    })
    return Schema.validate(data);
}

const createForumBlogValidate = (data) => {
    const Schema = joi.object({
        title: joi.string().min(4).max(200).required('Title is required'),
        description: joi.string().min(20).required('Description is required')
    })
    return Schema.validate(data);
}

const updateForumBlogValidate = (data) => {
    const Schema = joi.object({
        title: joi.string().min(4).max(200),
        description: joi.string().min(20)
    })
    return Schema.validate(data);
}

module.exports = { createBlogValidate, updateBlogValidate, createForumBlogValidate, updateForumBlogValidate };