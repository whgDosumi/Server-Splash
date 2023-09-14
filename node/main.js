const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const { Button, load_buttons } = require("./button");
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, "/uploads") });

if (!fs.existsSync(path.join(__dirname, "/buttons"))) {
    fs.mkdirSync(path.join(__dirname, "/buttons"));
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 50); // Limit to 50 characters for file system safety
}

app.use(express.static(path.join(__dirname, "/public")));
let buttons = load_buttons();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.get("/", (req, res) => {
    res.render("index", { buttons });
});
app.get("/edit", (req, res) => {
    res.render("edit");
})

app.post("/add_button", upload.single("image"), (req, res) => {
    const text = req.body.text;
    const color = req.body.color;
    const link = req.body.link;
    const ext = "." + req.file.originalname.split('.').pop();
    const image_path = req.file.path;
    if (!fs.existsSync(path.join(__dirname, "/public/images/"))) {
        fs.mkdirSync(path.join(__dirname, "/public/images/"));
    }
    const destination = path.join(__dirname, "/public/images/") + slugify(text) + ext;
    fs.rename(image_path, destination, async (err) => {
        if (err) {
            console.error('Error saving image:', err);
            res.status(500).send('Error saving image');
        } else {
            console.log('Image saved successfully');
            res.send('Image uploaded and saved successfully');
            new_button = new Button(text, color, path.join("/images/" + slugify(text) + ext), link);
            new_button.save();
            await new Promise(resolve => setTimeout(resolve, 1000));
            buttons = load_buttons();
        }
    })

})


app.listen(3000, () => {
    console.log("listening on port 3000")
})