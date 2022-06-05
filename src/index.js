import express from "express";
import path from "path";
import ejs from "ejs";
import multer from "./multer.js";
const PORT = process.env.PORT || 5000;

//App
const app = express();
app.enable("trust proxy");

// Statics
app.use(express.static(path.join(path.resolve(), "assets")));

// Uploads
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// Views
app.engine(".html", ejs.__express);
app.set("views", path.join(path.resolve(), "src", "views"));
app.set("view engine", "html");

// Upload Route
app.post("/upload", multer.array("images"), (req, res) => {
  const savedFiles = req.files;

  // Return path array to be appended in the TinyMCE original output
  // TODO: Should return an absolute path?

  res.json(savedFiles.map((file) => file.path));
});

// Catch all route = home
app.get("*", async (req, res) => {
  try {
    // Render HTML
    res.render("index");
  } catch (error) {
    res.send("ERROR!");
  }
});

app.listen(PORT, () => console.log(`RUNNING ON ${PORT}`));
