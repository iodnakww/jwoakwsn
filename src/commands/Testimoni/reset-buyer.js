const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Testimoni = require('../../schemas/testimoni');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset-buyer')
        .setDescription('Reset buyer transaction data.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Hanya dapat digunakan oleh Administrator
        .addUserOption(option =>
            option.setName('buyer')
                .setDescription('The buyer whose data you want to reset.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Choose to reset transactions or delete buyer data.')
                .setRequired(true)
                .addChoices(
                    { name: 'Reset Transactions', value: 'reset' },
                    { name: 'Delete Buyer Data', value: 'delete' }
                )),

    async execute(interaction) {
        const { options, guild } = interaction;

        const buyer = options.getUser('buyer');
        const action = options.getString('action');

        // Cari data pembeli di database
        const buyerData = await Testimoni.findOne({ Guild: guild.id, Buyer: buyer.id });

        if (!buyerData) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`❌ Data untuk pembeli **${buyer.tag}** tidak ditemukan di database.`),
                ],
                ephemeral: true,
            });
        }

        if (action === 'reset') {
            // Reset jumlah transaksi ke 0
            buyerData.Transactions = 0;
            await buyerData.save();

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00FF00')
                        .setDescription(`✅ Jumlah transaksi untuk pembeli **${buyer.tag}** telah direset menjadi **0**.`),
                ],
                ephemeral: true,
            });
        }

        if (action === 'delete') {
            // Hapus data pembeli dari database
            await Testimoni.deleteOne({ Guild: guild.id, Buyer: buyer.id });

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00FF00')
                        .setDescription(`✅ Data untuk pembeli **${buyer.tag}** telah dihapus dari database.`),
                ],
                ephemeral: true,
            });
        }
    },
};