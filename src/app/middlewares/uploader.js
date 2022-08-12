const moment = require('moment');
const multer = require('multer');
const str = require('shortid-36');

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, `./public/file/${request.body.flag}`);
  },
  filename: (request, file, callback) => {
    const extention = file.mimetype.split('/').pop();
    callback(null, `${str.generate()}-${moment().format('HHmmss')}.${extention}`);
  },
});

const uploader = multer({ storage }).single('file');

module.exports = uploader;
