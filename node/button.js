const path = require("path");
const fs = require('fs');
const util = require('util');

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
    constructor(text, backgroundColor, imageSrc, link) {
        this.width = "500px";
        this.height = "150px";
        this.backgroundColor = backgroundColor;
        this.text = text;
        this.imageSrc = imageSrc;
        this.imageWidth = "150px";
        this.imageHeight = "150px";
        this.link = link;
    }

    // save the button to disk.
    async save() {
        try {
            let write_promise = util.promisify(fs.writeFile);
            let slug = slugify(this.text);
            let file_path = path.join(__dirname, 'buttons', `${slug}.json`);
            let button_data = {
                text: this.text,
                backgroundColor: this.backgroundColor,
                imageSrc: this.imageSrc,
                link: this.link,
            };
            await write_promise(file_path, JSON.stringify(button_data));
            console.log(`Button data saved as ${slug}.json`);
        } catch (err) {
            console.error(`Error saving button data: ${err}`);
        }
    }
}

// Load buttons from disk, return a table of button objects
function load_buttons() {
    const buttonsDirectory = path.join(__dirname, 'buttons');
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
                    buttonData.link
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