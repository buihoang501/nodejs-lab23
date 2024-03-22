const express = require("express");
const router = express.Router();
const postController = require("../controllers/post");
const authMidleware = require("../middlewares/auth");
const uploads = require("../uploads/uploads");

const { body } = require("express-validator");
router.post(
  "/feed",
  authMidleware.checkAuthToken,

  uploads.single("image"),

  [
    body("title").notEmpty().withMessage("Title could not be empty"),
    body("image").custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Empty file or not jpg/jpeg/png");
      } else {
        return true;
      }
    }),
    body("content").notEmpty().withMessage("Content could not be empty"),
  ],
  postController.postCreatePost
);

router.get("/feed", authMidleware.checkAuthToken, postController.getPosts);
router.get(
  "/feed/:feedId",
  authMidleware.checkAuthToken,
  postController.getPost
);
router.patch(
  "/feed/:feedId",
  authMidleware.checkAuthToken,
  uploads.single("image"),

  [
    body("title").notEmpty().withMessage("Title could not be empty"),

    body("content").notEmpty().withMessage("Content could not be empty"),
  ],
  postController.patchUpdatePost
);

router.delete(
  "/feed/:feedId",
  authMidleware.checkAuthToken,
  postController.deleteFeed
);

module.exports = router;
