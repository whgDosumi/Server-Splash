const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { Button, load_buttons } = require("./button");
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, "/uploads") });

// Define static content like images and stylesheets
app.use(express.static(path.join(__dirname, "/public")));
// Set our view engine to ejs, and configure where views are located
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Function to make text into a 'slug' that's safe for filesystem.
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 50); // Limit to 50
}

// Make sure the buttons directory exists
if (!fs.existsSync(path.join(__dirname, "/buttons"))) {
    fs.mkdirSync(path.join(__dirname, "/buttons"));
}

// Handle GET requests
app.get("/", (req, res) => {
    // Load and pass the buttons to the webpage.
    let buttons = load_buttons();
    res.render("index", { buttons });
});
app.get("/edit", (req, res) => {
    res.render("edit");
});

// Handle POST requests
app.post("/add_button", upload.single("image"), (req, res) => {
    let text = req.body.text;
    let color = req.body.color;
    let link = req.body.link;
    let text_color = req.body.textcolor;
    let ext = "." + req.file.originalname.split('.').pop();
    let image_path = req.file.path;
    if (!fs.existsSync(path.join(__dirname, "/public/images/"))) {
        fs.mkdirSync(path.join(__dirname, "/public/images/"));
    }
    let destination = path.join(__dirname, "/public/images/") + slugify(text) + ext;
    fs.rename(image_path, destination, async (err) => {
        if (err) {
            console.error('Error saving image:', err);
            res.status(500).send('Error saving image');
        } else {
            console.log('Image saved successfully');
            res.send('Image uploaded and saved successfully');
            new_button = new Button(text, color, path.join("/images/" + slugify(text) + ext), link, text_color);
            await new_button.save();
            buttons = load_buttons();
        }
    })
})

// Start the webserver on port 3000
app.listen(3000, () => {
    console.log("listening on port 3000")
})
