const path = require("path");

const multer = require("multer");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(path.dirname(process.mainModule.filename), "./images"));
  },
  filename: (req, file, cb) => {
    cb(null, Math.random().toString() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimtype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const uploads = multer({ storage: fileStorage, fileFilter: fileFilter });

module.exports = uploads;
