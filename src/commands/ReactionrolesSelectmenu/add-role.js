const rrSchema = require("../../schemas/ReactionRoles");
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    premiumOnly: false,
    data: new SlashCommandBuilder()
        .setName("addrole-panel")
        .setDescription("Add custom reaction role.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addRoleOption(option =>
            option.setName("role")
                .setDescription("Role to be assigned")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("description")
                .setDescription("Description of the role.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("emoji")
                .setDescription("Emoji for the role.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const { options, guildId, member } = interaction;

        const role = options.getRole("role");
        const description = options.getString("description") || "No description.";
        const emoji = options.getString("emoji") || "";

        try {
            if (role.position >= member.roles.highest.position) {
                return interaction.reply({ content: "I don't have permissions for that.", ephemeral: true });
            }

            const data = await rrSchema.findOne({ GuildID: guildId });

            const newRole = {
                roleId: role.id,
                roleDescription: description,
                roleEmoji: emoji,
            };

            if (data) {
                let roleData = data.roles.find((x) => x.roleId === role.id);

                if (roleData) {
                    roleData.roleId = newRole.roleId;
                    roleData.roleDescription = newRole.roleDescription;
                    roleData.roleEmoji = newRole.roleEmoji;
                } else {
                    data.roles.push(newRole);
                }

                await data.save();
            } else {
                await rrSchema.create({
                    GuildID: guildId,
                    roles: [newRole],
                });
            }

            return interaction.reply({ 
                embeds: [new EmbedBuilder()
                    .setDescription(`Created new role ${role.name}`)
                    .setColor("Green")
                    .setTimestamp()], 
                ephemeral: true 
            });

        } catch (err) {
            console.error(err);
            return interaction.reply({ content: "An error occurred while processing the request.", ephemeral: true });
        }
    }
};