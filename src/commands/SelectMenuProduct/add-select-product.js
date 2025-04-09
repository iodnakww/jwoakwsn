const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const selectmenuSchema = require("../../schemas/SelectMenuSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add-select-product")
        .setDescription("Add a custom select menu option for a specific channel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addChannelOption(option => 
            option.setName("channel")
                .setDescription("Select the channel for this product")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("label")
                .setDescription("Label for the select menu option.")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("description")
                .setDescription("Description of the select menu option.")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("emoji")
                .setDescription("Emoji for the select menu option.")
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName("response")
                .setDescription("Response message for the select menu option.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("image_response")
                .setDescription("An image URL for the response (optional).")
                .setRequired(false)
        ),
        
    async execute(interaction) {
        const { options, guildId } = interaction;
        const channel = options.getChannel("channel");
        const label = options.getString("label");
        const description = options.getString("description");
        const emoji = options.getString("emoji");
        const response = options.getString("response");
        const imageResponse = options.getString("image_response");

        try {
            const data = await selectmenuSchema.findOne({ GuildID: guildId });

            const newOption = {
                label: label,
                description: description || "No description provided.",
                emoji: emoji || "",
                response: response,
                imageResponse: imageResponse || null, // Store the image response URL if provided
            };

            if (data) {
                const channelData = data.channels.find(ch => ch.channelID === channel.id);
                if (channelData) {
                    channelData.options.push(newOption);
                } else {
                    data.channels.push({ channelID: channel.id, options: [newOption] });
                }
                await data.save();
            } else {
                await selectmenuSchema.create({
                    GuildID: guildId,
                    channels: [{ channelID: channel.id, options: [newOption] }],
                });
            }

            return interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setDescription(`Added new select menu option for channel **${channel.name}**: **${label}**`)
                    .setColor("Green")
                    .setTimestamp()
                ], 
                ephemeral: true 
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "An error occurred while saving the select menu option.", ephemeral: true });
        }
    },
};
