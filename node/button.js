const path = require("path");
const fs = require('fs');

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 50); // Limit to 50 characters for file system safety
}

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

    // Generate a slug from the button's text and save data to a JSON file
    save() {
        let slug = slugify(this.text);
        let filePath = path.join(__dirname, 'buttons', `${slug}.json`);
        let buttonData = {
            text: this.text,
            backgroundColor: this.backgroundColor,
            imageSrc: this.imageSrc,
            link: this.link,
        };

        fs.writeFile(filePath, JSON.stringify(buttonData), (err) => {
            if (err) {
                console.error(`Error saving button data: ${err}`);
            } else {
                console.log(`Button data saved as ${slug}.json`);
            }
        });
    }
}

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

module.exports = {
    Button,
    load_buttons,
};