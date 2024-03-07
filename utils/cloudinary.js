const cloudinary = require("cloudinary").v2;
          
cloudinary.config({ 
  cloud_name: 'dcj2gzytt', 
  api_key: process.env.CLOUDINARY_PUBLIC_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET_KEY 
});

module.exports = cloudinary;