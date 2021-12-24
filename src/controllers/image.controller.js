const multer = require('multer');
const { uploadCloud } = require('../core/config/upload_image.config');
const ImageModel = require('../models/image.model');

class ImageController {
    
    /*
        Get all images (files)
        [GET] images
    */
    getAllImages(req, res) {}
    /*
        Get image (file)
        [GET] images/:image_id
    */
    getImageFile(req, res) {}
    /*
        Get image
        [GET] images/image/:image_name
    */
    getImage(req, res) {
    }

    /*
        Upload image global
        [POST] images
    */
    uploadImageGlobal(req, res) {
        uploadCloud(req, res, async err => {
            if(err instanceof multer.MulterError) return res.status(401).json({error: { message: err.field}, success: false});
            if(err) return res.status(400).json({data: {}, message: "Only .png, .jpg and .jpeg format allowed!", success: false});
            if(!req.file) return res.status(400).json({data: {}, message: "Image is required", success: false});
            // create new image model
            const newImage = new ImageModel(req.file);
            newImage.created = Date.now();
            if(req.body.ckCsrfToken) newImage.type_image = 'global';

            // save database
            try {
                const saveImage = await newImage.save();
                res.status(200).json({
                    uploaded: true,
                    url: saveImage.path
                });
            }
            catch {
                res.status(500).json({data: {}, message: "An error occurred when uploading image", success: false});
            }
        }) 
    }

    /*
        Update image
        [PUT] images/:image_id
    */
    updateImage(req, res) {}
    
    deleteImage(req, res) {}
}

module.exports = new ImageController;