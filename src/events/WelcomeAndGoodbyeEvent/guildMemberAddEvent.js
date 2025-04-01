const { Events, AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");
const WelcomeMessage = require("../../schemas/welcomeSystem");
const config = require('../../config');
const { addSuffix } = require("../../lib/addSuffix");

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (!member.guild) return;

        const guildData = await WelcomeMessage.findOne({ guildId: member.guild.id });
        if (!guildData) return;

        const canvas = Canvas.createCanvas(1024, 500);
        const context = canvas.getContext("2d");

        // Load background
        const background = await Canvas.loadImage("https://i.postimg.cc/DwNqcd3K/Testi-9.png");
        context.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Add circle behind avatar
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.arc(512, 166, 134, 0, Math.PI * 2, true);
        context.fill();

        // Draw user avatar
        const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: "png", size: 1024 }));
        context.save();
        context.beginPath();
        context.arc(512, 166, 128, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();
        context.drawImage(avatar, 384, 38, 256, 256);
        context.restore();

        // Draw text
        context.font = "72px sans-serif";
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.fillText("WELCOME", 512, 360);

        context.font = "42px sans-serif";
        context.fillText(member.user.username.toUpperCase(), 512, 410);

        context.font = "32px sans-serif";
        context.fillText(`You are the ${addSuffix(member.guild.memberCount)} member`, 512, 455);

        // Create attachment
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `welcome-${member.id}.png` });

        // Process message placeholders
        let messageContent = guildData.message
            .replace("{user}", member.user.toString())
            .replace("{serverName}", member.guild.name)
            .replace("{memberCount}", member.guild.memberCount.toString())
            .replace("{userTag}", member.user.tag)
            .replace("{userId}", member.id)
            .replace("{userCreatedAt}", `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
            .replace("{guildId}", member.guild.id)
            .replace("{guildOwner}", `<@${member.guild.ownerId}>`);

        // Send welcome message with image
        const channel = member.guild.channels.cache.get(guildData.channelId);
        if (channel) {
            channel.send({ content: messageContent, files: [attachment] });
        }
    },
};