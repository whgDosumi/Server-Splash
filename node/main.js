const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { Button, load_buttons } = require("./button");
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, "/uploads") });
// Specify the server port
const server_port = 3000;

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

// Make sure user_data directory exists
if (!fs.existsSync(path.join(__dirname, "/user_data"))) {
    fs.mkdirSync(path.join(__dirname, "/user_data"));
}
// Make sure the buttons directory exists
if (!fs.existsSync(path.join(__dirname, "/user_data", "/buttons"))) {
    fs.mkdirSync(path.join(__dirname, "/user_data", "/buttons"));
}
// Button images as well
if (!fs.existsSync(path.join(__dirname, "/user_data", "/button_images"))) {
    fs.mkdirSync(path.join(__dirname, "/user_data", "/button_images"));
}
// Serve the button images
app.use("/button_images", express.static(path.join(__dirname, "user_data", "button_images")));

// Scan in the buttons
let buttons = load_buttons();

// Handle GET requests
app.get("/", (req, res) => {
    res.render("index", { buttons });
});
app.get("/edit", (req, res) => {
    res.render("edit", { buttons });
});

// Handle POST requests

app.post("/delete_button", upload.single("delete"), (req, res) => {
    let delete_button = req.body.delete;
    for (const button of buttons) {
        if (button.text == delete_button) {
            if (button.delete()) {
                buttons = load_buttons();
                console.log(`Button ${delete_button} deleted successfully`);
                res.send("Button deleted successfully!")
            } else {
                console.error(`Something may have gone wrong with deleting ${delete_button}`);
                res.send("Something may have gone wrong with deleting the button.")
                buttons = load_buttons();
            }

        }
    }
})

app.post("/add_button", upload.single("image"), (req, res) => {
    let text = req.body.text;
    let color = req.body.color;
    let link = req.body.link;
    let text_color = req.body.textcolor;
    let ext = "." + req.file.originalname.split('.').pop();
    let image_path = req.file.path;
    if (!fs.existsSync(path.join(__dirname, "/user_data/button_images/"))) {
        fs.mkdirSync(path.join(__dirname, "/user_data/button_images/"));
    }
    let destination = path.join(__dirname, "/user_data/button_images/") + slugify(text) + ext;
    fs.copyFile(image_path, destination, async (err) => {
        if (err) {
            console.error('Error saving image:', err);
            res.status(500).send('Error saving image');
        } else {
            console.log('Image saved successfully');
            res.send('Button saved successfully');
            new_button = new Button(text, color, path.join("/button_images/" + slugify(text) + ext), link, text_color);
            await new_button.save();
            buttons = load_buttons();
        }
        fs.rm(image_path, async (err) => {
            if (err) {
                console.error('Error deleting temp image:', err);
            } else {
                console.log("Temp image deleted successfully");
            }
        });
    })
})

// Start the webserver on port
app.listen(server_port, () => {
    console.log(`listening on port ${server_port}`)
})
