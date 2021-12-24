const express = require('express');
const ImageRouter = express.Router({caseSensitive: true});
const imageController = require('../controllers/image.controller');

// ImageRouter.get('/image/:image_name', imageController.getImage);
ImageRouter.post('/', imageController.uploadImageGlobal);

module.exports = ImageRouter;