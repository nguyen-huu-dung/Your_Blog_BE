const joi = require('joi');

const loginValidate = (data) => {
    const Schema = joi.object({
        username: joi.required(),
        password: joi.required()
    })
    return Schema.validate(data);
}

module.exports = { loginValidate };