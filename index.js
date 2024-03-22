const express = require("express");
const cors = require("cors");
const connectDB = require("./database/db");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/post");
const path = require("path");

require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json());
app.use("/images", express.static(path.join(__dirname, "images")));
console.log(path.join(__dirname, "/images"));
app.use("/auth", authRoute);
app.use("/", postRoute);

app.use((err, req, res, next) => {
  res.status(err.httpStatus).json({ message: err.message });
});

const PORT = 5000;

connectDB()
  .then((result) => {
    console.log("DB Connected!");
    const server = app.listen(PORT, () => {
      console.log(`Server is starting at PORT - ${PORT}`);
    });
    const io = require("./socket-io").init(server, {
      cors: {
        origin: "http://localhost:3000",
      },
    });
    io.once("connection", (socket) => {
      console.log("Client connected!");
    });
  })

  .catch((err) => console.log(err));
