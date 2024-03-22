const { validationResult } = require("express-validator");
const io = require("../socket-io");
const Post = require("../models/Post");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

exports.postCreatePost = async (req, res, next) => {
  const title = req.body.title;

  const image = req.file;
  const imageUrl =
    image?.path && image.path.replace(/^.*?images(\/|\\)/, "images/");
  console.log(imageUrl);
  const content = req.body.content;

  const errors = validationResult(req);

  if (!content || (!title && image && imageUrl)) {
    if (image?.path) {
      fs.unlink(image?.path, (err) => {
        if (err) {
          throw new Error(err);
        }
      });
    }
  }

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  try {
    const user = await User.findById(req.user);
    const post = new Post({ title, imageUrl, content, userId: user._id });

    const newPost = {
      ...post._doc,
      userId: { _id: user._id, username: user.username, email: user.email },
      createdAt: Date.now(),
    };
    io.getIO().emit("posts", {
      action: "CREATE",
      post: newPost,
    });
    await post.save();

    res.status(201).json({ message: "Create post successfully!" });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

exports.getPosts = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = 2;
  let skip = (page - 1) * limit;

  try {
    const pageNumber = await Post.find().countDocuments();
    const pageSize = Math.ceil(pageNumber / limit);
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "-password",
      });

    if (posts.length === 0) {
      return res.status(204).json({ message: "No Posts Found!" });
    }

    res.status(200).json({ posts, pageSize });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.feedId;
  try {
    const post = await Post.findById(postId);

    res.status(200).json({ post });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

exports.patchUpdatePost = async (req, res, next) => {
  const title = req.body.title;
  const postId = req.params.feedId;

  const image = req.file;
  const imageUrl =
    image?.path && image.path.replace(/^.*?images(\/|\\)/, "images/");
  const content = req.body.content;

  const errors = validationResult(req);

  if (!content || (!title && image && imageUrl)) {
    if (image?.path) {
      fs.unlink(image?.path, (err) => {
        if (err) {
          return;
        }
        return;
      });
    }
  }

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user);
    const post = await Post.findById(postId).populate({
      path: "userId",
      select: "-password",
    });

    if (req.user !== post.userId._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.title = title;
    post.content = content;
    if (post.imageUrl && imageUrl) {
      fs.unlink(
        path.join(
          path.dirname(process.mainModule.filename),
          `../frontend/public/${post.imageUrl}`
        ),
        (err) => {
          if (err) {
            return;
          }
          return;
        }
      );
    }
    if (imageUrl) {
      post.imageUrl = imageUrl;
    }

    io.getIO().emit("posts", {
      action: "UPDATE",
      post: post,
    });

    await post.save();
    res.status(201).json({ message: "Edited post successfully!" });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};

exports.deleteFeed = async (req, res, next) => {
  const feedId = req.params.feedId;
  try {
    const post = await Post.findById(feedId);

    if (req.user !== post.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (post && post?.imageUrl) {
      fs.unlink(
        path.join(
          path.dirname(process.mainModule.filename),
          `../frontend/public/${post.imageUrl}`
        ),
        (err) => {
          if (err) {
            return;
          }
          return;
        }
      );
    }

    io.getIO().emit("posts", { action: "DELETE", id: post._id });

    await Post.findByIdAndDelete(feedId);
    res.status(200).json({ message: "Deleted post successfully!" });
  } catch (error) {
    const err = new Error(error);
    err.httpStatus = 500;
    next(err);
  }
};
