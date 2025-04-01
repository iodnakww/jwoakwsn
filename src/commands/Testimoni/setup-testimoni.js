const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Testimoni = require('../../schemas/testimoni');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-testimoni')
        .setDescription('Setup the testimonial channel and seller role.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Hanya dapat digunakan oleh Administrator
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the channel for testimonials.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)) // Hanya channel teks
        .addRoleOption(option =>
            option.setName('seller-role')
                .setDescription('Select the role for sellers.')
                .setRequired(true)),

    async execute(interaction) {
        const { options, guild } = interaction;

        // Ambil channel dan role dari input
        const channel = options.getChannel('channel');
        const sellerRole = options.getRole('seller-role');

        try {
            // Cek apakah server sudah ada di database
            const data = await Testimoni.findOne({ Guild: guild.id });

            if (data) {
                // Update channel dan seller role yang sudah ada
                data.Channel = channel.id;
                data.SellerRole = sellerRole.id;
                await data.save();

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#00FF00')
                            .setDescription(`✅ Testimoni channel berhasil diperbarui ke ${channel} dan seller role ke ${sellerRole}`),
                    ],
                    ephemeral: true,
                });
            } else {
                // Tambahkan entri baru untuk server
                await Testimoni.create({
                    Guild: guild.id,
                    Channel: channel.id,
                    SellerRole: sellerRole.id,
                });

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#00FF00')
                            .setDescription(`✅ Testimoni channel berhasil diatur ke ${channel} dan seller role ke ${sellerRole}`),
                    ],
                    ephemeral: true,
                });
            }
        } catch (err) {
            console.error(err);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Terjadi kesalahan saat mengatur testimoni channel atau seller role.'),
                ],
                ephemeral: true,
            });
        }
    },
};