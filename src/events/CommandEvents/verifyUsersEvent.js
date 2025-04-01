const { Events, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { createCanvas } = require('canvas');
const capschema = require('../../schemas/verifySystem');
const verifyusers = require('../../schemas/verifyUsersSystem');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.customId === 'verify') {
            const verifydata = await capschema.findOne({ Guild: interaction.guild.id });
            const verifyusersdata = await verifyusers.findOne({ Guild: interaction.guild.id, User: interaction.user.id });

            if (!verifydata) 
                return await interaction.reply({ content: `The **verification system** has been disabled in this server!`, ephemeral: true });
            if (verifydata.Verified.includes(interaction.user.id)) 
                return await interaction.reply({ content: 'You have **already** been verified!', ephemeral: true });

            const captchaText = generateCaptcha(5);
            const buffer = await generateCaptchaImage(captchaText);

            const attachment = new AttachmentBuilder(buffer, { name: `captcha.png` });
            const verifyEmbed = new EmbedBuilder()
                .setColor(client.config.embedVerify)
                .setTitle('Verification Step: Captcha')
                .setDescription(`Please use the button below to submit your captcha.`)
                .setImage('attachment://captcha.png');

            const verifyButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Enter Captcha')
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('captchaenter')
                );

            await interaction.reply({ embeds: [verifyEmbed], components: [verifyButton], files: [attachment], ephemeral: true });

            await verifyusers.updateOne(
                { Guild: interaction.guild.id, User: interaction.user.id },
                { $set: { Key: captchaText } },
                { upsert: true }
            );
        } else if (interaction.customId === 'captchaenter') {
            const modal = new ModalBuilder()
                .setCustomId('vermodal')
                .setTitle('Verification');

            const input = new TextInputBuilder()
                .setCustomId('answer')
                .setLabel('Enter the captcha code')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(input);
            modal.addComponents(actionRow);

            await interaction.showModal(modal);
        } else if (interaction.customId === 'vermodal') {
            const userData = await verifyusers.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
            const modalAnswer = interaction.fields.getTextInputValue('answer');

            if (modalAnswer === userData.Key) {
                const verifydata = await capschema.findOne({ Guild: interaction.guild.id });
                const role = interaction.guild.roles.cache.get(verifydata.Role);

                await interaction.member.roles.add(role);
                await capschema.updateOne({ Guild: interaction.guild.id }, { $push: { Verified: interaction.user.id } });

                await interaction.reply({ content: 'You have been verified!', ephemeral: true });

                if (verifydata.LogChannel) {
                    const logChannel = interaction.guild.channels.cache.get(verifydata.LogChannel);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('Green')
                            .setTitle('Verification Log')
                            .setDescription(`${interaction.user.tag} has been verified.\n\nRole: <@&${role.id}>\nVerified By: ${interaction.user.tag}\nVerified In: <#${interaction.channel.id}>\nVerified At: <t:${Math.floor(Date.now() / 1000)}:t> (<t:${Math.floor(Date.now() / 1000)}:R>)\n\nCaptcha Code: ||__${userData.Key}__||`)
                            .setTimestamp();

                        logChannel.send({ content: `Succesfully verified <@${interaction.user.id}>`, embeds: [logEmbed] });
                    }
                }
            } else {
                await interaction.reply({ content: 'Incorrect captcha code.', ephemeral: true });

                // **LOGGING KESALAHAN CAPTCHA**
                const verifydata = await capschema.findOne({ Guild: interaction.guild.id });
                if (verifydata.LogChannel) {
                    const logChannel = interaction.guild.channels.cache.get(verifydata.LogChannel);
                    if (logChannel) {
                        const failEmbed = new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Failed Verification Attempt')
                            .setDescription(`${interaction.user.tag} entered the wrong captcha.\n\nExpected: ||__${userData.Key}__||\nEntered: ||__${modalAnswer}__||\n\nAttempted In: <#${interaction.channel.id}>\nTime: <t:${Math.floor(Date.now() / 1000)}:t> (<t:${Math.floor(Date.now() / 1000)}:R>)`)
                            .setTimestamp();

                        logChannel.send({ content: `Failed verification attempt by <@${interaction.user.id}>`, embeds: [failEmbed] });
                    }
                }
            }
        }
    }
};

function generateCaptcha(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

async function generateCaptchaImage(text) {
    const canvas = createCanvas(450, 150);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'red';
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toBuffer();
}