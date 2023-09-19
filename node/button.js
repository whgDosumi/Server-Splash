const path = require("path");
const fs = require('fs');
const util = require('util');
const fsPromises = require('fs').promises;

// Function to make text into a 'slug' that's safe for filesystem.
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 50); // Limit to 50 characters for file system safety
}

// Define the button
class Button {
    render() {
        return `
            <a class="button" href="${this.link}">
            <div class="button" style="width:500px; height:150px; background-color:${this.backgroundColor};">
              <img src="${this.imageSrc}" alt="Button Image" width="150px" height="150px">
              <span style="color: ${this.text_color};">${this.text}</span>
            </div>
            </a>
            `;
    }

    constructor(text, backgroundColor, imageSrc, link, textcolor) {
        this.width = "500px";
        this.height = "150px";
        this.backgroundColor = backgroundColor;
        this.text = text;
        this.text_color = textcolor;
        this.imageSrc = imageSrc;
        this.imageWidth = "150px";
        this.imageHeight = "150px";
        this.link = link;
        this.rendered = this.render();
    }

    // save the button to disk.
    async save() {
        try {
            let slug = slugify(this.text);
            let file_path = path.join(__dirname, "user_data", "buttons", `${slug}.json`);
            let button_data = {
                text: this.text,
                backgroundColor: this.backgroundColor,
                imageSrc: this.imageSrc,
                link: this.link,
                text_color: this.text_color,
            };
            await fsPromises.writeFile(file_path, JSON.stringify(button_data));
        } catch (err) {
            console.error(`Error saving button data: ${err}`);
        }
    }
    async delete() {
        try {
            let slug = slugify(this.text);
            let file_path = path.join(__dirname, "user_data", "buttons", `${slug}.json`);
            const image_files = fs.readdirSync(path.join(__dirname, "user_data", "button_images"));
            var image_path = ""
            for (const image_file of image_files) {
                const { name, ext } = path.parse(image_file);
                if (name == slug) {
                    var image_path = path.join(__dirname, "user_data", "button_images", image_file);
                }
            }
            if (fs.existsSync(file_path)) {
                fs.unlinkSync(file_path);
                console.log(`Deleted ${file_path}`);
                if (fs.existsSync(image_path)) {
                    fs.unlinkSync(image_path);
                    console.log(`Deleted ${image_path}`);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.log(`Error deleting button: ${err}`)
            return false;
        }
    }
}

// Load buttons from disk, return a table of button objects
function load_buttons() {
    const buttonsDirectory = path.join(__dirname, "user_data", 'buttons');
    const buttons = [];
    try {
        const buttonFiles = fs.readdirSync(buttonsDirectory);
        for (const buttonFile of buttonFiles) {
            if (buttonFile.endsWith('.json')) {
                const filePath = path.join(buttonsDirectory, buttonFile);
                const buttonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const button = new Button(
                    buttonData.text,
                    buttonData.backgroundColor,
                    buttonData.imageSrc,
                    buttonData.link,
                    buttonData.text_color
                );
                buttons.push(button);
            }
        }
    } catch (error) {
        console.error(`Error loading buttons: ${error}`);
    }
    return buttons;
}

// Export module items
module.exports = {
    Button,
    load_buttons,
};