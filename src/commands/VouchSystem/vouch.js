const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Rating = require("../../schemas/vouchSystem");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vouch")
        .setDescription("Provide vouch for a transaction")
        .addUserOption(option =>
            option.setName("seller")
                .setDescription("The seller you want to rate")
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName("buyer")
                .setDescription("The buyer you want to rate")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("rep")
                .setDescription("The rating you want to give")
                .setRequired(true)
                .addChoices(
                    { name: "⭐", value: "1" },
                    { name: "⭐⭐", value: "2" },
                    { name: "⭐⭐⭐", value: "3" },
                    { name: "⭐⭐⭐⭐", value: "4" },
                    { name: "⭐⭐⭐⭐⭐", value: "5" }
                )
        )
        .addStringOption(option =>
            option.setName("comments")
                .setDescription("Comments on the transaction")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const { options, guild } = interaction;
        const seller = options.getUser("seller");
        const buyer = options.getUser("buyer");
        const rep = parseInt(options.getString("rep"), 10);
        const comments = options.getString("comments");

        // Get the rating channel from the database
        const ratingData = await Rating.findOne({ Guild: guild.id });

        if (!ratingData || !ratingData.Channel) {
            return interaction.editReply({
                content: "🚫 No rating channel has been set up yet. Please use `/setuprating` to configure a channel.",
                ephemeral: true,
            });
        }

        const channel = guild.channels.cache.get(ratingData.Channel);

        if (!channel) {
            return interaction.editReply({
                content: "❌ The configured rating channel could not be found. Please set it up again using `/setuprating`.",
                ephemeral: true,
            });
        }

        // Increment Vouch No (assuming it's stored in the database)
        const updatedData = await Rating.findOneAndUpdate(
            { Guild: guild.id },
            { $inc: { VouchNo: 1 } }, // Increment the Vouch No
            { new: true }
        );

        const vouchNumber = updatedData.VouchNo;
        const timestamp = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Submitted Vouch!`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 128 }))
            .setDescription(`${"⭐".repeat(rep)}`)
            .addFields({ name: "Vouch:", value: `\`\`\`${comments}\`\`\``, inline: false })
            .addFields({ name: "Vouch No:", value: `${vouchNumber}`, inline: true })
            .addFields({ name: "Vouched by:", value: `<@${interaction.user.id}>`, inline: true })
            .addFields({ name: "Vouched at:", value: `<t:${timestamp}:F>`, inline: true })
            .setColor("#f1f1f1")
            .setFooter({ text: "Thanks For Vouching Us!", iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("View User Profile")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/users/${interaction.user.id}`)
        );

        await channel.send({ embeds: [embed], components: [row] });

        interaction.editReply({
            content: `Successfully sent the review to ${channel}.`,
            ephemeral: true,
        });
    },
};