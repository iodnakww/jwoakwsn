const { Events, EmbedBuilder } = require("discord.js");
const selectmenuSchema = require("../../schemas/SelectMenuSchema");

module.exports = {
    name: Events.InteractionCreate, // Listen to interaction creation events
    async execute(interaction) {
        if (!interaction.isStringSelectMenu()) return; // Ensure this is a select menu interaction

        const { customId, values, guildId, channelId, user } = interaction;

        // Ensure the interaction is for the correct select menu
        if (customId !== 'selectmenu-product') return;

        try {
            // Fetch the data for the server
            const data = await selectmenuSchema.findOne({ GuildID: guildId });
            if (!data) {
                // If no configuration is found for the server, notify the user
                return interaction.reply({ content: "No product data configured for this server.", ephemeral: true });
            }

            // Fetch the channel data to get the specific product options for this channel
            const channelData = data.channels.find(ch => ch.channelID === channelId);
            if (!channelData) {
                // If no configuration exists for the current channel
                return interaction.reply({ content: `No products are configured for this channel.`, ephemeral: true });
            }

            // Find the selected option based on the value chosen by the user
            const selectedOption = channelData.options.find(option => option.label === values[0]);

            if (!selectedOption) {
                // If the selected option is invalid, notify the user
                return interaction.reply({ content: "Invalid product selected. Please try again.", ephemeral: true });
            }

            // First Embed (Text Response)
            const responseEmbed = new EmbedBuilder()
                .setTitle(selectedOption.label) // Set title based on the product label
                .setDescription(selectedOption.response) // Set description from the response data
                .setColor("#00FF00") // Set a color for the embed (you can adjust this)
                .setTimestamp(); // Add a timestamp to the embed

            // Initialize the array of embeds
            const embeds = [responseEmbed];

            // Check if an image response URL exists and send as a separate embed
            if (selectedOption.imageResponse) {
                const imageEmbed = new EmbedBuilder()
                    .setImage(selectedOption.imageResponse) // Set the image in this embed
                    .setColor("#FF5733") // You can choose a different color for the image embed
                    .setTimestamp(); // Optional: Add timestamp for image embed
                embeds.push(imageEmbed);
            }

            // Respond to the user with the text embed and the image embed (if provided)
            return interaction.reply({ embeds, ephemeral: true });

        } catch (err) {
            console.error(`[SELECT_MENU] Error handling interaction:`, err);

            // If there's an error, send an error response to the user
            const errorEmbed = new EmbedBuilder()
                .setTitle("Error")
                .setDescription("An error occurred while processing your selection. Please try again later.")
                .setColor("Red");

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
