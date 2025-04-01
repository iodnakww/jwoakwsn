const selectmenuSchema = require("../../schemas/SelectMenuSchema");
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    premiumOnly: false,
    data: new SlashCommandBuilder()
        .setName("add-select-product")
        .setDescription("Add a custom select menu option.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
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
        ),
    async execute(interaction) {
        const { options, guildId } = interaction;

        const label = options.getString("label");
        const description = options.getString("description");
        const emoji = options.getString("emoji");
        const response = options.getString("response");

        try {
            const data = await selectmenuSchema.findOne({ GuildID: guildId });

            const newOption = {
                label: label,
                description: description || "No description provided.",
                emoji: emoji || "",
                response: response,
            };

            if (data) {
                const optionExists = data.options.find((x) => x.label === label);

                if (optionExists) {
                    return interaction.reply({ content: `Option with label \`${label}\` already exists.`, ephemeral: true });
                } else {
                    data.options = [...data.options, newOption];
                }

                await data.save();
            } else {
                await selectmenuSchema.create({
                    GuildID: guildId,
                    options: [newOption],
                });
            }

            return interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setDescription(`Added new select menu option Product: **${label}**`)
                    .setColor("Green")
                    .setTimestamp()
                ], 
                ephemeral: true 
            });
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "An error occurred while saving the select menu option.", ephemeral: true });
        }
    }
};