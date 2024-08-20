const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "fbpost",
    description: "Create a Facebook post using the provided text and name.",
    usage: "fbpost @mention | text | name or fbpostv2 text | name",
    cooldown: 5,
    accessableby: 0,
    category: "image",
    prefix: true,
    author: "chilli"
  },
  start: async function({ api, event, text, reply }) {
    try {
        if (text.length === 0) {
            return reply("Usage: fbpost @mention | text | name or fbpostv2 text | name");
        }

        const input = text.join(" ").split("|");

        if (input.length < 1) {
            return reply("Please provide at least text and optionally a name, separated by '|'.");
        }

        let mention, fbText, name;
        let mentionId;

        // Check if a mention is provided
        if (input[0].includes('@')) {
            mention = input[0].trim();
            fbText = input[1] ? input[1].trim() : "";
            name = input.length > 2 ? input[2].trim() : mention.replace(/^@/, '');

            // Fetch user ID from mention
            mentionId = Object.keys(event.mentions).find(id => event.mentions[id] === mention);

            if (!mentionId) {
                return reply("Invalid mention. Please mention a valid user.");
            }
        } else {
            fbText = input[0].trim();
            name = input.length > 1 ? input[1].trim() : event.senderID;

            // Use sender's ID if no mention is provided
            mentionId = event.senderID;
        }

        // Inform the user that the fetching process has started
        reply("Creating the Facebook post, please wait...");

        // Fetch the response from the Facebook Post API
        const apiUrl = `${global.deku.ENDPOINT}/canvas/fbpost?uid=${mentionId}&text=${encodeURIComponent(fbText)}&name=${encodeURIComponent(name)}`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const filePath = path.join(__dirname, `${mentionId}.jpg`);

        // Save the image temporarily
        fs.writeFileSync(filePath, buffer);

        // Send the formatted message with the image attachment
        api.sendMessage({
            body: `Here is the Facebook post for ${name}:`,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
            // Delete the temporary image file after sending
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error('Error:', error);
        reply("An error occurred while processing the request.");
    }
  }
};
