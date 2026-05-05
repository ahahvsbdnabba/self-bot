const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// ============================
// CONFIGURATION - EDIT THESE
// ============================
const BOT_TOKEN = process.env.BOT_TOKEN || 'MTUwMTI3NTE2NDc2MTkxOTU4OQ.GrKF0l.zB5WxeQFGeNfk8K692AecU9g8TErDVnaNO8t3Q'; // Use env var for Railway
const ALLOWED_USER_ID = '1350293413915918367'; // User who can always run command
const LOG_CHANNEL_ID = '1482790191407173733'; // Channel for role assignment logs
const BLACKLIST_LOG_CHANNEL_ID = '1482790260432961650'; // Channel for blacklist logs
const STRIKE_LOG_CHANNEL_ID = '1482790224357490904'; // Channel for strike logs
const TEBEX_LOG_CHANNEL_ID = '1482790268926296168'; // Channel for Tebex purchase logs
const REQUIRED_ROLE_ID = '1479345511067554002'; // "Role Perms" role ID
const BLACKLIST_ROLE_ID = '1479345579669848134'; // Blacklist role ID
const STRIKE_1_ROLE_ID = '1501054755089154179'; // Strike 1 role
const STRIKE_2_ROLE_ID = '1479345540532539443'; // Strike 2 role
const SUPPORT_TEAM_ROLE_ID = '1500879485984182483'; // Support team role ID

// Tebex Configuration
const TEBEX_SECRET = process.env.TEBEX_SECRET || '1778925510a062bd75be45cdff6495fb02a3c378';
const TEBEX_STORE_ID = process.env.TEBEX_STORE_ID || '';
const CLAIM_ROLE_ID = process.env.CLAIM_ROLE_ID || '1484401977684398191'; // Optional: Role to give after claiming

// ============================
// ROLE HIERARCHY CONFIGURATION
// ============================
// This is the EXACT hierarchy from your list, in order from top to bottom
// Roles in [] are auto-assigned based on position in hierarchy
const ROLE_HIERARCHY = [
    // Top roles (non-staff)
    { name: '+_+', id: '1500238161668870164', isStaff: false, isAuto: false },
    { name: 'BOTS', id: '1480327888858513678', isStaff: false, isAuto: false },
    { name: 'FOUNDER (PAY)', id: '1469853355756228759', isStaff: true, isAuto: false },
    { name: 'DANGER (ABOVE ALL)', id: '1500394491075498074', isStaff: false, isAuto: false },
    { name: 'Owner', id: '1491333172439420968', isStaff: true, isAuto: false },
    { name: 'Co Owner', id: '1479345499441074206', isStaff: true, isAuto: false },
    { name: 'CEO', id: '1500931584243531858', isStaff: true, isAuto: false },
    { name: 'Network', id: '1500079403739381891', isStaff: false, isAuto: false },
    { name: 'CLOTHING DEVELOPER', id: '1485362267297026140', isStaff: false, isAuto: false },
    { name: 'Superior', id: '1479345508928721074', isStaff: true, isAuto: false },
    { name: 'Server Director', id: '1479345512606863380', isStaff: true, isAuto: false },
    { name: 'Staff Director', id: '1479345513244659752', isStaff: true, isAuto: false },
    
    // Auto roles (square brackets) - these get assigned based on hierarchy
    { name: '[Key & Coin Access]', id: '1479345519586316489', isStaff: false, isAuto: true },
    { name: '[Ban Perms]', id: '1479369071974940769', isStaff: false, isAuto: true },
    { name: '[Scale Menu]', id: '1485133595009089626', isStaff: false, isAuto: true },
    { name: '[Sale & 2x Access]', id: '1479345519024144416', isStaff: false, isAuto: true },
    { name: '[AntiCheat Access]', id: '1479345520194486325', isStaff: false, isAuto: true },
    { name: '[AirDrop Perms]', id: '1477571643692810262', isStaff: false, isAuto: true },
    
    // Staff roles
    { name: 'Supervisor', id: '1500084210172428459', isStaff: true, isAuto: false },
    { name: 'Operations', id: '1479345516100980877', isStaff: true, isAuto: false },
    { name: 'Executive', id: '1479345516814008411', isStaff: true, isAuto: false },
    { name: 'Overseer', id: '1479345520874094752', isStaff: true, isAuto: false },
    
    // More auto roles
    { name: '[Role Perms]', id: '1479345511067554002', isStaff: false, isAuto: true },
    { name: '[Executive Team]', id: '1493678098514968576', isStaff: false, isAuto: true },
    
    // Management roles
    { name: 'Server Management', id: '1479345521649909760', isStaff: true, isAuto: false },
    { name: 'Head Management', id: '1479345522270670939', isStaff: true, isAuto: false },
    { name: 'Senior Management', id: '1479345522933502024', isStaff: true, isAuto: false },
    { name: 'Management', id: '1479345523801723051', isStaff: true, isAuto: false },
    { name: 'Trial Management', id: '1479345524388663346', isStaff: true, isAuto: false },
    
    // More auto roles
    { name: '[Management Team]', id: '1479345525009416343', isStaff: false, isAuto: true },
    
    // More staff roles
    { name: 'Community Manager', id: '1479345525689159744', isStaff: true, isAuto: false },
    { name: 'Head of Staff', id: '1479345529845583913', isStaff: true, isAuto: false },
    { name: 'Lead Administrator', id: '1479345531477168230', isStaff: true, isAuto: false },
    
    // More auto roles
    { name: '[Higher Ups]', id: '1479345532261371965', isStaff: false, isAuto: true },
    
    // Admin roles
    { name: 'Head Administrator', id: '1479345532848570369', isStaff: true, isAuto: false },
    { name: 'Senior Administrator', id: '1479345533414932592', isStaff: true, isAuto: false },
    { name: 'Administrator', id: '1479345534685806736', isStaff: true, isAuto: false },
    
    // More staff roles
    { name: 'Head Moderator', id: '1479345536669585478', isStaff: true, isAuto: false },
    { name: 'Moderator', id: '1479345537928134737', isStaff: true, isAuto: false },
    { name: 'Trial Moderator', id: '1479345538657816646', isStaff: true, isAuto: false },
    
    // Final auto role (Staff Team - gives to ALL staff)
    { name: '[Staff Team]', id: '1493650573315149956', isStaff: false, isAuto: true }
];

// ============================
// DATABASE SETUP
// ============================
let db;
async function initializeDatabase() {
    db = await open({
        filename: './tebex_purchases.db',
        driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id TEXT UNIQUE,
            tebex_id TEXT,
            discord_id TEXT,
            package_name TEXT,
            price REAL,
            currency TEXT,
            status TEXT,
            purchase_date TIMESTAMP,
            claimed BOOLEAN DEFAULT FALSE,
            claimed_at TIMESTAMP,
            log_message_id TEXT
        );
        
        CREATE TABLE IF NOT EXISTS tebex_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tebex_id TEXT UNIQUE,
            discord_id TEXT UNIQUE,
            linked_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_purchases_discord ON purchases(discord_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_tebex ON purchases(tebex_id);
        CREATE INDEX IF NOT EXISTS idx_purchases_transaction ON purchases(transaction_id);
    `);

    // Initialize last webhook ID if not exists
    const lastWebhook = await db.get("SELECT value FROM settings WHERE key = 'last_webhook_id'");
    if (!lastWebhook) {
        await db.run("INSERT INTO settings (key, value) VALUES ('last_webhook_id', '0')");
    }
    
    console.log('✅ Database initialized');
}

// ============================
// TEBEX API FUNCTIONS
// ============================
async function fetchRecentPurchases() {
    try {
        const response = await axios.get('https://plugin.tebex.io/payments', {
            headers: {
                'X-Tebex-Secret': TEBEX_SECRET
            },
            params: {
                limit: 50 // Fetch recent 50 purchases
            }
        });
        
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching Tebex purchases:', error.message);
        return [];
    }
}

async function getPlayerInfo(tebexId) {
    try {
        const response = await axios.get(`https://plugin.tebex.io/user/${tebexId}`, {
            headers: {
                'X-Tebex-Secret': TEBEX_SECRET
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching player info:', error.message);
        return null;
    }
}

// ============================
// HELPER FUNCTIONS
// ============================
function getAllStaffRoles() {
    return ROLE_HIERARCHY.filter(role => role.isStaff && !role.isAuto);
}

function getAutoRolesForRank(rankName) {
    const rankIndex = ROLE_HIERARCHY.findIndex(role => role.name === rankName);
    if (rankIndex === -1) return [];
    
    const autoRoles = [];
    
    // Find all auto roles that come AFTER this rank in the hierarchy
    for (let i = rankIndex + 1; i < ROLE_HIERARCHY.length; i++) {
        if (ROLE_HIERARCHY[i].isAuto) {
            autoRoles.push(ROLE_HIERARCHY[i]);
        }
    }
    
    return autoRoles;
}

function hasPlusPlusRole(member) {
    const plusPlusRole = ROLE_HIERARCHY.find(role => role.name === '+_+');
    return plusPlusRole && member.roles.cache.has(plusPlusRole.id);
}

function hasSupportTeamRole(member) {
    return member.roles.cache.has(SUPPORT_TEAM_ROLE_ID);
}

// ============================
// PERMISSION CHECK
// ============================
function hasPermission(member, command = '') {
    // Check if user is the allowed user
    if (member.id === ALLOWED_USER_ID) {
        return true;
    }
    
    // For support team commands
    if (command === 'check') {
        return hasSupportTeamRole(member);
    }
    
    // For staff management commands
    if (['staff', 'blacklist', 'unblacklist', 'strike', 'viewstrikes'].includes(command)) {
        // Check if user has the required role
        if (member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return true;
        }
        
        // Check if user has the +_+ role (can reassign staff roles)
        if (hasPlusPlusRole(member)) {
            return true;
        }
        
        return false;
    }
    
    // For admin Tebex commands
    if (['tebexsync', 'tebexstats'].includes(command)) {
        return member.permissions.has('ADMINISTRATOR') || 
               member.roles.cache.has(REQUIRED_ROLE_ID) || 
               hasPlusPlusRole(member);
    }
    
    // Default permission (for purchase viewing, claim, etc.)
    return true;
}

// ============================
// EMBED CREATION FUNCTIONS (TEBEX)
// ============================
function createPurchaseEmbed(purchase, discordUser = null) {
    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎉 New Purchase!')
        .setDescription(`A purchase has been made on the store`)
        .addFields(
            { name: '📦 Package', value: purchase.package_name || 'Unknown', inline: true },
            { name: '💰 Price', value: `${purchase.currency || 'USD'} ${purchase.price || '0.00'}`, inline: true },
            { name: '🆔 Transaction ID', value: `\`${purchase.transaction_id}\``, inline: true }
        )
        .setTimestamp(new Date(purchase.purchase_date || Date.now()));
    
    if (purchase.tebex_id) {
        embed.addFields({ name: '👤 Tebex ID', value: `\`${purchase.tebex_id}\``, inline: true });
    }
    
    if (discordUser) {
        embed.addFields({ name: '🎯 Discord User', value: `${discordUser.tag} (\`${discordUser.id}\`)`, inline: true });
        embed.setThumbnail(discordUser.displayAvatarURL({ dynamic: true }));
    } else if (purchase.discord_id) {
        embed.addFields({ name: '🎯 Discord ID', value: `\`${purchase.discord_id}\``, inline: true });
    }
    
    if (purchase.status) {
        const statusEmoji = purchase.status === 'Complete' ? '✅' : '🔄';
        embed.addFields({ name: '📊 Status', value: `${statusEmoji} ${purchase.status}`, inline: true });
    }
    
    // Add claim button if not claimed
    if (purchase.tebex_id && !purchase.discord_id && !purchase.claimed) {
        embed.setFooter({ 
            text: '⚠️ This purchase needs to be claimed! Use /claim', 
            iconURL: 'https://cdn.discordapp.com/emojis/1064442701119217744.webp?size=96&quality=lossless' 
        });
    }
    
    return embed;
}

function createClaimEmbed(tebexId, discordUser, totalSpent = 0, purchaseCount = 0) {
    const embed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setTitle('✅ Account Linked!')
        .setDescription(`${discordUser.tag} has successfully linked their Tebex account`)
        .addFields(
            { name: '👤 Discord User', value: `${discordUser.tag} (\`${discordUser.id}\`)`, inline: true },
            { name: '🎮 Tebex ID', value: `\`${tebexId}\``, inline: true },
            { name: '📦 Total Purchases', value: `\`${purchaseCount}\``, inline: true },
            { name: '💰 Total Spent', value: `\`$${totalSpent.toFixed(2)}\``, inline: true }
        )
        .setThumbnail(discordUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
    
    return embed;
}

function createCheckEmbed(tebexId, playerInfo, discordUser = null, purchases = []) {
    const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('🔍 Tebex ID Check')
        .setDescription(`Information for Tebex ID: \`${tebexId}\``);
    
    if (playerInfo && playerInfo.player) {
        embed.addFields(
            { name: '👤 Username', value: playerInfo.player.username || tebexId, inline: true },
            { name: '📧 Email', value: playerInfo.player.email || 'Not available', inline: true },
            { name: '🌐 Language', value: playerInfo.player.language || 'Unknown', inline: true }
        );
        
        if (playerInfo.player.ign) {
            embed.addFields({ name: '🎮 Minecraft IGN', value: playerInfo.player.ign, inline: true });
        }
    }
    
    if (discordUser) {
        embed.addFields({ 
            name: '🔗 Linked Discord', 
            value: `${discordUser.tag} (\`${discordUser.id}\`)`, 
            inline: true 
        });
    }
    
    if (purchases.length > 0) {
        const totalSpent = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
        embed.addFields(
            { name: '📦 Total Purchases', value: `\`${purchases.length}\``, inline: true },
            { name: '💰 Total Spent', value: `\`$${totalSpent.toFixed(2)}\``, inline: true }
        );
        
        // Add recent purchase
        const recentPurchase = purchases[0];
        embed.addFields({
            name: '🛍️ Most Recent Purchase',
            value: `${recentPurchase.package_name} - $${recentPurchase.price} (${new Date(recentPurchase.purchase_date).toLocaleDateString()})`,
            inline: false
        });
    } else {
        embed.addFields({ name: '📦 Purchases', value: 'No purchases found', inline: true });
    }
    
    embed.setTimestamp();
    return embed;
}

function createStatsEmbed(user, tebexId, purchases, totalSpent) {
    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('📊 Purchase Statistics')
        .setDescription(`Purchase history for ${user ? user.tag : tebexId}`)
        .addFields(
            { name: '👤 User', value: user ? `${user.tag} (\`${user.id}\`)` : 'Not linked', inline: true },
            { name: '🎮 Tebex ID', value: `\`${tebexId}\``, inline: true },
            { name: '📦 Total Purchases', value: `\`${purchases.length}\``, inline: true },
            { name: '💰 Total Spent', value: `\`$${totalSpent.toFixed(2)}\``, inline: true }
        );
    
    // Add recent purchases (limit to 5)
    const recentPurchases = purchases.slice(0, 5);
    if (recentPurchases.length > 0) {
        const purchaseList = recentPurchases.map(p => 
            `• ${p.package_name} - $${p.price} (${new Date(p.purchase_date).toLocaleDateString()})`
        ).join('\n');
        
        embed.addFields({ 
            name: '🛍️ Recent Purchases', 
            value: purchaseList,
            inline: false 
        });
    }
    
    embed.setTimestamp();
    return embed;
}

// ============================
// PURCHASE HANDLING FUNCTIONS
// ============================
async function logPurchaseToDB(purchaseData) {
    try {
        await db.run(`
            INSERT OR REPLACE INTO purchases (
                transaction_id, tebex_id, discord_id, package_name, 
                price, currency, status, purchase_date, claimed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            purchaseData.transaction_id,
            purchaseData.tebex_id,
            purchaseData.discord_id,
            purchaseData.package_name,
            purchaseData.price,
            purchaseData.currency,
            purchaseData.status || 'Complete',
            purchaseData.purchase_date || new Date().toISOString(),
            purchaseData.discord_id ? true : false
        ]);
        
        console.log(`✅ Logged purchase: ${purchaseData.transaction_id}`);
        return true;
    } catch (error) {
        console.error('Error logging purchase to DB:', error);
        return false;
    }
}

async function sendPurchaseLog(purchase, channel, discordUser = null) {
    try {
        const embed = createPurchaseEmbed(purchase, discordUser);
        
        // Create claim button if needed
        let components = [];
        if (purchase.tebex_id && !purchase.discord_id && !purchase.claimed) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`claim_${purchase.transaction_id}`)
                        .setLabel('Claim Purchase')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('✅')
                );
            components = [row];
        }
        
        const message = await channel.send({
            embeds: [embed],
            components: components
        });
        
        // Store message ID in database
        await db.run(
            'UPDATE purchases SET log_message_id = ? WHERE transaction_id = ?',
            [message.id, purchase.transaction_id]
        );
        
        return message;
    } catch (error) {
        console.error('Error sending purchase log:', error);
        return null;
    }
}

async function processExistingPurchases(client) {
    try {
        console.log('🔄 Processing existing purchases...');
        
        const channel = await client.channels.fetch(TEBEX_LOG_CHANNEL_ID);
        if (!channel) {
            console.error('Tebex log channel not found');
            return;
        }
        
        // Get all unlogged purchases from database
        const purchases = await db.all(`
            SELECT * FROM purchases 
            WHERE log_message_id IS NULL OR log_message_id = ''
            ORDER BY purchase_date DESC
            LIMIT 20
        `);
        
        console.log(`📊 Found ${purchases.length} unlogged purchases`);
        
        for (const purchase of purchases) {
            let discordUser = null;
            if (purchase.discord_id) {
                try {
                    discordUser = await client.users.fetch(purchase.discord_id);
                } catch (error) {
                    console.log(`User ${purchase.discord_id} not found`);
                }
            }
            
            await sendPurchaseLog(purchase, channel, discordUser);
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay to avoid rate limits
        }
        
        console.log('✅ Finished processing existing purchases');
    } catch (error) {
        console.error('Error processing existing purchases:', error);
    }
}

async function syncRecentPurchases(client) {
    try {
        console.log('🔄 Syncing recent purchases from Tebex...');
        
        const purchases = await fetchRecentPurchases();
        console.log(`📊 Fetched ${purchases.length} purchases from Tebex`);
        
        const channel = await client.channels.fetch(TEBEX_LOG_CHANNEL_ID);
        if (!channel) {
            console.error('Tebex log channel not found');
            return;
        }
        
        let newPurchases = 0;
        
        for (const purchase of purchases) {
            // Check if purchase already exists in DB
            const existing = await db.get(
                'SELECT transaction_id FROM purchases WHERE transaction_id = ?',
                [purchase.id]
            );
            
            if (existing) continue; // Already logged
            
            // Try to find Discord ID from linked accounts
            let discordId = null;
            if (purchase.player && purchase.player.id) {
                const link = await db.get(
                    'SELECT discord_id FROM tebex_links WHERE tebex_id = ?',
                    [purchase.player.id]
                );
                discordId = link ? link.discord_id : null;
            }
            
            const purchaseData = {
                transaction_id: purchase.id,
                tebex_id: purchase.player ? purchase.player.id : null,
                discord_id: discordId,
                package_name: purchase.packages ? purchase.packages.map(p => p.name).join(', ') : 'Unknown',
                price: purchase.amount,
                currency: purchase.currency,
                status: purchase.status || 'Complete',
                purchase_date: purchase.date
            };
            
            await logPurchaseToDB(purchaseData);
            
            let discordUser = null;
            if (discordId) {
                try {
                    discordUser = await client.users.fetch(discordId);
                } catch (error) {
                    // User not found, that's okay
                }
            }
            
            await sendPurchaseLog(purchaseData, channel, discordUser);
            newPurchases++;
            
            await new Promise(resolve => setTimeout(resolve, 300)); // Delay to avoid rate limits
        }
        
        if (newPurchases > 0) {
            console.log(`✅ Synced ${newPurchases} new purchases`);
        }
    } catch (error) {
        console.error('Error syncing purchases:', error);
    }
}

// ============================
// CLAIM SYSTEM FUNCTIONS
// ============================
async function claimTebexId(interaction, tebexId) {
    try {
        // Verify Tebex ID exists
        const playerInfo = await getPlayerInfo(tebexId);
        if (!playerInfo) {
            return { success: false, error: '❌ Invalid Tebex ID. Please check and try again.' };
        }
        
        // Check if Tebex ID is already linked
        const existingLink = await db.get(
            'SELECT discord_id FROM tebex_links WHERE tebex_id = ?',
            [tebexId]
        );
        
        if (existingLink) {
            return { 
                success: false, 
                error: '❌ This Tebex ID is already linked to another Discord account.' 
            };
        }
        
        // Check if user already has a linked account
        const userLink = await db.get(
            'SELECT tebex_id FROM tebex_links WHERE discord_id = ?',
            [interaction.user.id]
        );
        
        if (userLink) {
            return { 
                success: false, 
                error: `❌ You already have a linked Tebex account: \`${userLink.tebex_id}\`` 
            };
        }
        
        // Link the accounts
        await db.run(
            'INSERT INTO tebex_links (tebex_id, discord_id, linked_at) VALUES (?, ?, ?)',
            [tebexId, interaction.user.id, new Date().toISOString()]
        );
        
        // Update all purchases with this Tebex ID
        await db.run(
            'UPDATE purchases SET discord_id = ?, claimed = TRUE, claimed_at = ? WHERE tebex_id = ? AND claimed = FALSE',
            [interaction.user.id, new Date().toISOString(), tebexId]
        );
        
        // Get purchase stats
        const purchases = await db.all(
            'SELECT * FROM purchases WHERE tebex_id = ? ORDER BY purchase_date DESC',
            [tebexId]
        );
        
        const totalSpent = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
        
        // Update existing log messages
        const channel = await interaction.client.channels.fetch(TEBEX_LOG_CHANNEL_ID);
        if (channel) {
            const purchaseMessages = await db.all(
                'SELECT log_message_id FROM purchases WHERE tebex_id = ? AND log_message_id IS NOT NULL',
                [tebexId]
            );
            
            for (const msg of purchaseMessages) {
                try {
                    const message = await channel.messages.fetch(msg.log_message_id);
                    const embed = createPurchaseEmbed(
                        { ...purchases.find(p => p.log_message_id === msg.log_message_id) },
                        interaction.user
                    );
                    
                    await message.edit({ embeds: [embed], components: [] });
                } catch (error) {
                    // Message might be deleted, that's okay
                }
            }
        }
        
        // Give role if configured
        if (CLAIM_ROLE_ID) {
            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const role = interaction.guild.roles.cache.get(CLAIM_ROLE_ID);
                if (role) {
                    await member.roles.add(role);
                }
            } catch (error) {
                console.error('Error giving role:', error);
            }
        }
        
        return {
            success: true,
            tebexId: tebexId,
            purchases: purchases,
            totalSpent: totalSpent
        };
        
    } catch (error) {
        console.error('Error claiming Tebex ID:', error);
        return { success: false, error: '❌ An error occurred while processing your claim.' };
    }
}

// ============================
// BOT SETUP
// ============================
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ] 
});

// Store blacklisted users and strike counts
let blacklistedUsers = new Set();
let userStrikes = new Map();

client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    
    // Set bot status
    client.user.setPresence({
        activities: [{
            name: 'Staff & Purchase Management',
            type: 0 // Playing
        }],
        status: 'online'
    });
    
    // Initialize database
    await initializeDatabase();
    
    // Register slash commands
    await registerSlashCommands();
    
    // Initialize blacklisted users and strike counts
    await initializeBlacklistedUsers();
    await initializeStrikeCounts();
    
    // Process existing purchases
    await processExistingPurchases(client);
    
    // Sync recent purchases from Tebex
    await syncRecentPurchases(client);
    
    // Set up periodic sync (every 5 minutes)
    setInterval(() => syncRecentPurchases(client), 5 * 60 * 1000);
    
    console.log(`🔄 Initialized ${blacklistedUsers.size} blacklisted users`);
    console.log(`⚡ Initialized ${userStrikes.size} users with strikes`);
    console.log('🚀 Bot is fully operational!');
});

// ============================
// COMMAND REGISTRATION
// ============================
async function registerSlashCommands() {
    try {
        const staffRoles = getAllStaffRoles();
        
        const commands = [
            // STAFF MANAGEMENT COMMANDS
            // /staff command with ALL staff roles as choices
            new SlashCommandBuilder()
                .setName('staff')
                .setDescription('Assign staff role with automatic sub-roles')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to assign role to')
                        .setRequired(true))
                .addStringOption(option => {
                    const builder = option
                        .setName('rank')
                        .setDescription('Staff rank to assign')
                        .setRequired(true);
                    
                    // Add all staff roles as choices
                    staffRoles.forEach(role => {
                        builder.addChoices({ name: role.name, value: role.name });
                    });
                    
                    return builder;
                })
                .toJSON(),
            
            // /blacklist command
            new SlashCommandBuilder()
                .setName('blacklist')
                .setDescription('Blacklist a user (assigns blacklist role and removes all staff roles)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to blacklist')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for blacklisting')
                        .setRequired(false))
                .toJSON(),
            
            // /unblacklist command
            new SlashCommandBuilder()
                .setName('unblacklist')
                .setDescription('Remove a user from blacklist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to unblacklist')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for unblacklist')
                        .setRequired(false))
                .toJSON(),
            
            // /strike command
            new SlashCommandBuilder()
                .setName('strike')
                .setDescription('Give a strike to a user (3 strikes = auto blacklist)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to strike')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the strike')
                        .setRequired(false))
                .toJSON(),
            
            // /viewstrikes command
            new SlashCommandBuilder()
                .setName('viewstrikes')
                .setDescription('View a user\'s strike count')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to check')
                        .setRequired(false))
                .toJSON(),
            
            // TEBEX PURCHASE COMMANDS
            // /claim command
            new SlashCommandBuilder()
                .setName('claim')
                .setDescription('Link your Tebex account to your Discord')
                .addStringOption(option =>
                    option.setName('tebex_id')
                        .setDescription('Your Tebex/Minecraft username')
                        .setRequired(true))
                .toJSON(),
            
            // /purchases command
            new SlashCommandBuilder()
                .setName('purchases')
                .setDescription('View your purchase history')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to check (admin only)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('tebex_id')
                        .setDescription('Tebex ID to check (admin only)')
                        .setRequired(false))
                .toJSON(),
            
            // /check command (for support team)
            new SlashCommandBuilder()
                .setName('check')
                .setDescription('Check a Tebex ID information')
                .addStringOption(option =>
                    option.setName('tebex_id')
                        .setDescription('Tebex ID to check')
                        .setRequired(true))
                .toJSON(),
            
            // /tebexstats command
            new SlashCommandBuilder()
                .setName('tebexstats')
                .setDescription('View store statistics (admin only)')
                .toJSON(),
            
            // /tebexsync command (admin)
            new SlashCommandBuilder()
                .setName('tebexsync')
                .setDescription('Manually sync purchases from Tebex (admin)')
                .toJSON()
        ];

        // Register commands globally
        await client.application?.commands.set(commands);
        console.log('✅ All slash commands registered globally');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// ============================
// LOGGING FUNCTIONS (STAFF)
// ============================
async function logRoleAssignment(interaction, targetUser, rank, mainRole, autoRoles) {
    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        if (!logChannel) {
            console.error('Role log channel not found');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x800080) // Purple color
            .setTitle('🎭 Roles Given')
            .setDescription(`Staff role assignment completed`)
            .addFields(
                { name: '👤 Given By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: '🎯 Given To', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                { name: '👑 Rank Assigned', value: rank, inline: true },
                { name: '📜 Main Role', value: `<@&${mainRole.id}>`, inline: true },
                { name: '🔗 Auto Roles', value: autoRoles.length > 0 ? autoRoles.map(r => `<@&${r.id}>`).join(', ') : 'None', inline: false },
                { name: '⏰ Time', value: new Date().toLocaleString('en-US', { 
                    timeZone: 'UTC',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) + ' UTC', inline: true }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'Staff Role Assignment', iconURL: client.user.displayAvatarURL() });

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending role log embed:', error);
    }
}

async function logStrike(interaction, targetUser, reason, strikeCount, action, previousStrikes) {
    try {
        const logChannel = await client.channels.fetch(STRIKE_LOG_CHANNEL_ID);
        if (!logChannel) {
            console.error('Strike log channel not found');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFA500) // Orange color for strikes
            .setTitle('⚠️ Strike Given')
            .setDescription(`User received a strike`)
            .addFields(
                { name: '👤 Given By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: '🎯 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                { name: '📝 Reason', value: reason || 'No reason provided', inline: true },
                { name: '🔢 Strike Count', value: `${strikeCount}/3`, inline: true },
                { name: '📈 Previous Strikes', value: `${previousStrikes}/3`, inline: true },
                { name: '⚡ Action Taken', value: action, inline: true },
                { name: '⏰ Time', value: new Date().toLocaleString('en-US', { 
                    timeZone: 'UTC',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) + ' UTC', inline: true }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'Strike System', iconURL: client.user.displayAvatarURL() });

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending strike log embed:', error);
    }
}

async function logBlacklist(interaction, targetUser, reason, removedRoles, isAuto = false) {
    try {
        const logChannel = await client.channels.fetch(BLACKLIST_LOG_CHANNEL_ID);
        if (!logChannel) {
            console.error('Blacklist log channel not found');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000) // Red color for blacklist
            .setTitle(isAuto ? '🚫 Auto-Blacklist Applied' : '🚫 User Blacklisted')
            .setDescription(isAuto ? 'User reached 3 strikes and was auto-blacklisted' : 'A user has been blacklisted')
            .addFields(
                { name: '👤 ' + (isAuto ? 'Auto-Blacklisted User' : 'Blacklisted By'), 
                  value: isAuto ? `${targetUser.tag} (${targetUser.id})` : `${interaction.user.tag} (${interaction.user.id})`, 
                  inline: true },
                { name: '🎯 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                { name: '📝 Reason', value: reason || (isAuto ? 'Reached 3 strikes' : 'No reason provided'), inline: true }
            );

        if (!isAuto && removedRoles.length > 0) {
            embed.addFields({ 
                name: '🧹 Roles Removed', 
                value: removedRoles.map(r => `<@&${r}>`).join(', '), 
                inline: false 
            });
        }

        embed.addFields(
            { name: '🚫 Blacklist Role', value: `<@&${BLACKLIST_ROLE_ID}>`, inline: true },
            { name: '⏰ Time', value: new Date().toLocaleString('en-US', { 
                timeZone: 'UTC',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) + ' UTC', inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: isAuto ? 'Auto-Blacklist System' : 'Blacklist System', 
                   iconURL: client.user.displayAvatarURL() });

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending blacklist log embed:', error);
    }
}

async function logUnblacklist(interaction, targetUser, reason) {
    try {
        const logChannel = await client.channels.fetch(BLACKLIST_LOG_CHANNEL_ID);
        if (!logChannel) {
            console.error('Blacklist log channel not found');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x00FF00) // Green color for unblacklist
            .setTitle('✅ User Unblacklisted')
            .setDescription(`User has been removed from blacklist`)
            .addFields(
                { name: '👤 Unblacklisted By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: '🎯 User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                { name: '📝 Reason', value: reason || 'No reason provided', inline: true },
                { name: '🚫 Blacklist Role Removed', value: `<@&${BLACKLIST_ROLE_ID}>`, inline: true },
                { name: '⏰ Time', value: new Date().toLocaleString('en-US', { 
                    timeZone: 'UTC',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) + ' UTC', inline: true }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: 'Blacklist System', iconURL: client.user.displayAvatarURL() });

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending unblacklist log embed:', error);
    }
}

// ============================
// STRIKE MANAGEMENT FUNCTIONS
// ============================
function getStrikeRoles() {
    return [STRIKE_1_ROLE_ID, STRIKE_2_ROLE_ID];
}

async function giveStrike(interaction, targetUser, reason) {
    try {
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        
        // Check if already blacklisted
        if (targetMember.roles.cache.has(BLACKLIST_ROLE_ID)) {
            return { success: false, error: 'User is already blacklisted.' };
        }
        
        // Get current strike count
        const currentStrikes = userStrikes.get(targetUser.id) || 0;
        const newStrikeCount = currentStrikes + 1;
        
        // Update strike count
        userStrikes.set(targetUser.id, newStrikeCount);
        
        // Remove previous strike roles
        const strikeRoles = getStrikeRoles();
        for (const strikeRoleId of strikeRoles) {
            if (targetMember.roles.cache.has(strikeRoleId)) {
                await targetMember.roles.remove(strikeRoleId);
            }
        }
        
        let action = '';
        
        // Apply appropriate strike role or blacklist
        if (newStrikeCount === 1) {
            // Give strike 1 role
            const strike1Role = interaction.guild.roles.cache.get(STRIKE_1_ROLE_ID);
            if (strike1Role) {
                await targetMember.roles.add(strike1Role);
                action = 'Strike 1 given';
            }
        } else if (newStrikeCount === 2) {
            // Give strike 2 role
            const strike2Role = interaction.guild.roles.cache.get(STRIKE_2_ROLE_ID);
            if (strike2Role) {
                await targetMember.roles.add(strike2Role);
                action = 'Strike 2 given';
            }
        } else if (newStrikeCount >= 3) {
            // Auto blacklist on 3rd strike
            const result = await blacklistUser(interaction, targetUser, `Auto-blacklisted: Reached 3 strikes. Last reason: ${reason}`);
            if (result.success) {
                action = 'Auto-blacklisted (3rd strike)';
                // Reset strikes after blacklisting
                userStrikes.delete(targetUser.id);
            } else {
                return { success: false, error: result.error };
            }
        }
        
        return { 
            success: true, 
            strikeCount: newStrikeCount,
            action: action,
            previousStrikes: currentStrikes
        };
        
    } catch (error) {
        console.error('Error giving strike:', error);
        return { success: false, error: error.message };
    }
}

async function removeStrikes(targetMember) {
    try {
        // Remove all strike roles
        const strikeRoles = getStrikeRoles();
        for (const strikeRoleId of strikeRoles) {
            if (targetMember.roles.cache.has(strikeRoleId)) {
                await targetMember.roles.remove(strikeRoleId);
            }
        }
        
        // Remove from strike tracking
        userStrikes.delete(targetMember.id);
        
        return true;
    } catch (error) {
        console.error('Error removing strikes:', error);
        return false;
    }
}

// ============================
// BLACKLIST/UNBLACKLIST FUNCTIONS
// ============================
async function blacklistUser(interaction, targetUser, reason) {
    try {
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const blacklistRole = interaction.guild.roles.cache.get(BLACKLIST_ROLE_ID);
        
        if (!blacklistRole) {
            return { success: false, error: 'Blacklist role not found on server.' };
        }
        
        // Check if user is already blacklisted
        if (targetMember.roles.cache.has(BLACKLIST_ROLE_ID)) {
            return { success: false, error: 'User is already blacklisted.' };
        }
        
        // Get all staff roles to remove
        const staffRoleIds = getAllStaffRoles().map(role => role.id);
        const rolesToRemove = [];
        
        // Find which staff roles the user has
        for (const roleId of staffRoleIds) {
            if (targetMember.roles.cache.has(roleId)) {
                rolesToRemove.push(roleId);
            }
        }
        
        // Remove staff roles
        if (rolesToRemove.length > 0) {
            await targetMember.roles.remove(rolesToRemove);
        }
        
        // Remove any strike roles
        await removeStrikes(targetMember);
        
        // Add blacklist role
        await targetMember.roles.add(blacklistRole);
        
        // Store in blacklist set
        blacklistedUsers.add(targetUser.id);
        
        return { 
            success: true, 
            removedRoles: rolesToRemove 
        };
        
    } catch (error) {
        console.error('Error blacklisting user:', error);
        return { success: false, error: error.message };
    }
}

async function unblacklistUser(interaction, targetUser, reason) {
    try {
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const blacklistRole = interaction.guild.roles.cache.get(BLACKLIST_ROLE_ID);
        
        if (!blacklistRole) {
            return { success: false, error: 'Blacklist role not found on server.' };
        }
        
        // Check if user is not blacklisted
        if (!targetMember.roles.cache.has(BLACKLIST_ROLE_ID)) {
            return { success: false, error: 'User is not blacklisted.' };
        }
        
        // Remove blacklist role
        await targetMember.roles.remove(blacklistRole);
        
        // Remove from blacklist set
        blacklistedUsers.delete(targetUser.id);
        
        // Clear strikes
        userStrikes.delete(targetUser.id);
        
        // Remove strike roles if they exist
        await removeStrikes(targetMember);
        
        return { success: true };
        
    } catch (error) {
        console.error('Error unblacklisting user:', error);
        return { success: false, error: error.message };
    }
}

// ============================
// INITIALIZATION FUNCTIONS
// ============================
async function initializeBlacklistedUsers() {
    try {
        // Get all guilds the bot is in
        for (const [guildId, guild] of client.guilds.cache) {
            // Get the blacklist role
            const blacklistRole = guild.roles.cache.get(BLACKLIST_ROLE_ID);
            if (!blacklistRole) continue;
            
            // Find all members with the blacklist role
            const blacklistedMembers = blacklistRole.members;
            
            // Add their IDs to the set
            for (const [memberId, member] of blacklistedMembers) {
                blacklistedUsers.add(memberId);
            }
        }
    } catch (error) {
        console.error('Error initializing blacklisted users:', error);
    }
}

async function initializeStrikeCounts() {
    try {
        // Get all guilds the bot is in
        for (const [guildId, guild] of client.guilds.cache) {
            // Get strike roles
            const strike1Role = guild.roles.cache.get(STRIKE_1_ROLE_ID);
            const strike2Role = guild.roles.cache.get(STRIKE_2_ROLE_ID);
            
            // Count strikes based on roles
            if (strike1Role) {
                for (const [memberId, member] of strike1Role.members) {
                    userStrikes.set(memberId, 1);
                }
            }
            
            if (strike2Role) {
                for (const [memberId, member] of strike2Role.members) {
                    userStrikes.set(memberId, 2);
                }
            }
        }
    } catch (error) {
        console.error('Error initializing strike counts:', error);
    }
}

// ============================
// INTERACTION HANDLER
// ============================
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        // Check permissions for the specific command
        if (!hasPermission(interaction.member, interaction.commandName)) {
            let errorMsg = '❌ You do not have permission to use this command.';
            
            if (['staff', 'blacklist', 'unblacklist', 'strike', 'viewstrikes'].includes(interaction.commandName)) {
                errorMsg += ' You need the "Role Perms" role, +_+ role, or be the allowed user.';
            } else if (interaction.commandName === 'check') {
                errorMsg += ' You need to be in the support team.';
            } else if (['tebexsync', 'tebexstats'].includes(interaction.commandName)) {
                errorMsg += ' You need administrator permissions.';
            }
            
            return interaction.reply({ 
                content: errorMsg,
                ephemeral: true 
            });
        }
        
        // Handle all commands
        if (interaction.commandName === 'staff') {
            await handleStaffCommand(interaction);
        } else if (interaction.commandName === 'blacklist') {
            await handleBlacklistCommand(interaction);
        } else if (interaction.commandName === 'unblacklist') {
            await handleUnblacklistCommand(interaction);
        } else if (interaction.commandName === 'strike') {
            await handleStrikeCommand(interaction);
        } else if (interaction.commandName === 'viewstrikes') {
            await handleViewStrikesCommand(interaction);
        } else if (interaction.commandName === 'claim') {
            await handleClaimCommand(interaction);
        } else if (interaction.commandName === 'purchases') {
            await handlePurchasesCommand(interaction);
        } else if (interaction.commandName === 'check') {
            await handleCheckCommand(interaction);
        } else if (interaction.commandName === 'tebexstats') {
            await handleTebexStatsCommand(interaction);
        } else if (interaction.commandName === 'tebexsync') {
            await handleTebexSyncCommand(interaction);
        }
    } else if (interaction.isButton()) {
        await handleButtonClick(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
    }
});

// ============================
// COMMAND HANDLERS - STAFF MANAGEMENT
// ============================
async function handleStaffCommand(interaction) {
    const targetUser = interaction.options.getUser('user');
    const rank = interaction.options.getString('rank');
    
    // Check if trying to assign to self
    if (targetUser.id === interaction.user.id) {
        return interaction.reply({ 
            content: '❌ You cannot assign roles to yourself.',
            ephemeral: true 
        });
    }
    
    // Check if trying to assign to a bot
    if (targetUser.bot) {
        return interaction.reply({ 
            content: '❌ You cannot assign roles to bots.',
            ephemeral: true 
        });
    }
    
    // Check if target is blacklisted
    if (blacklistedUsers.has(targetUser.id)) {
        return interaction.reply({ 
            content: '❌ This user is blacklisted and cannot receive staff roles.',
            ephemeral: true 
        });
    }
    
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        
        // Find the selected rank in hierarchy
        const selectedRank = ROLE_HIERARCHY.find(role => role.name === rank);
        if (!selectedRank || !selectedRank.isStaff) {
            return interaction.editReply({ content: '❌ Invalid staff rank selected.' });
        }
        
        // Get main role
        const mainRole = interaction.guild.roles.cache.get(selectedRank.id);
        if (!mainRole) {
            return interaction.editReply({ content: `❌ Main role "${rank}" not found on server.` });
        }
        
        // Get auto roles based on hierarchy (all square bracket roles below the selected rank)
        const autoRoleConfigs = getAutoRolesForRank(rank);
        const autoRoles = [];
        
        for (const autoRoleConfig of autoRoleConfigs) {
            const autoRole = interaction.guild.roles.cache.get(autoRoleConfig.id);
            if (autoRole) {
                autoRoles.push(autoRole);
            }
        }
        
        // Check bot permissions
        const botMember = interaction.guild.members.me;
        const botHighestRole = botMember.roles.highest;
        
        if (mainRole.position >= botHighestRole.position) {
            return interaction.editReply({ 
                content: `❌ I cannot assign the ${mainRole.name} role because it's higher than or equal to my highest role.`
            });
        }
        
        for (const autoRole of autoRoles) {
            if (autoRole.position >= botHighestRole.position) {
                return interaction.editReply({ 
                    content: `❌ I cannot assign the ${autoRole.name} role because it's higher than or equal to my highest role.`
                });
            }
        }
        
        // Add all roles to target
        await targetMember.roles.add([mainRole, ...autoRoles]);
        
        // Create success message
        const roleList = [mainRole.name, ...autoRoles.map(r => r.name)];
        const successMessage = `✅ Successfully assigned **${rank}** role to ${targetUser.tag}\n\n` +
                             `**Main Role:** ${mainRole.name}\n` +
                             `**Auto Roles:** ${autoRoles.length > 0 ? autoRoles.map(r => r.name).join(', ') : 'None'}`;
        
        await interaction.editReply({ content: successMessage });
        
        // Log to the log channel
        await logRoleAssignment(interaction, targetUser, rank, mainRole, autoRoles);
        
    } catch (error) {
        console.error('Error assigning roles:', error);
        
        let errorMessage = '❌ Failed to assign roles. ';
        
        if (error.code === 50013) {
            errorMessage += 'I lack the "Manage Roles" permission or the role is higher than mine.';
        } else if (error.code === 10007) {
            errorMessage += 'Target user not found in this server.';
        } else {
            errorMessage += 'Please check my permissions and role hierarchy.';
        }
        
        await interaction.editReply({ content: errorMessage });
    }
}

async function handleBlacklistCommand(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if trying to blacklist self
    if (targetUser.id === interaction.user.id) {
        return interaction.reply({ 
            content: '❌ You cannot blacklist yourself.',
            ephemeral: true 
        });
    }
    
    // Check if trying to blacklist a bot
    if (targetUser.bot) {
        return interaction.reply({ 
            content: '❌ You cannot blacklist bots.',
            ephemeral: true 
        });
    }
    
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const result = await blacklistUser(interaction, targetUser, reason);
        
        if (!result.success) {
            return interaction.editReply({ content: `❌ ${result.error}` });
        }
        
        const successMessage = `✅ Successfully blacklisted ${targetUser.tag}\n` +
                             `**Blacklist Role:** Assigned\n` +
                             `**Staff Roles Removed:** ${result.removedRoles.length} roles\n` +
                             `**Reason:** ${reason}`;
        
        await interaction.editReply({ content: successMessage });
        
        // Log blacklist action
        await logBlacklist(interaction, targetUser, reason, result.removedRoles);
        
    } catch (error) {
        console.error('Error in blacklist command:', error);
        await interaction.editReply({ 
            content: '❌ An error occurred while blacklisting the user. Please check my permissions and role hierarchy.' 
        });
    }
}

async function handleUnblacklistCommand(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if trying to unblacklist self
    if (targetUser.id === interaction.user.id) {
        return interaction.reply({ 
            content: '❌ You cannot unblacklist yourself.',
            ephemeral: true 
        });
    }
    
    // Check if trying to unblacklist a bot
    if (targetUser.bot) {
        return interaction.reply({ 
            content: '❌ You cannot unblacklist bots.',
            ephemeral: true 
        });
    }
    
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const result = await unblacklistUser(interaction, targetUser, reason);
        
        if (!result.success) {
            return interaction.editReply({ content: `❌ ${result.error}` });
        }
        
        const successMessage = `✅ Successfully unblacklisted ${targetUser.tag}\n` +
                             `**Blacklist Role:** Removed\n` +
                             `**Strikes:** Cleared\n` +
                             `**Reason:** ${reason}`;
        
        await interaction.editReply({ content: successMessage });
        
        // Log unblacklist action
        await logUnblacklist(interaction, targetUser, reason);
        
    } catch (error) {
        console.error('Error in unblacklist command:', error);
        await interaction.editReply({ 
            content: '❌ An error occurred while unblacklisting the user. Please check my permissions and role hierarchy.' 
        });
    }
}

async function handleStrikeCommand(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if trying to strike self
    if (targetUser.id === interaction.user.id) {
        return interaction.reply({ 
            content: '❌ You cannot give strikes to yourself.',
            ephemeral: true 
        });
    }
    
    // Check if trying to strike a bot
    if (targetUser.bot) {
        return interaction.reply({ 
            content: '❌ You cannot give strikes to bots.',
            ephemeral: true 
        });
    }
    
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const result = await giveStrike(interaction, targetUser, reason);
        
        if (!result.success) {
            return interaction.editReply({ content: `❌ ${result.error}` });
        }
        
        let successMessage = '';
        
        if (result.strikeCount >= 3) {
            successMessage = `⚠️ **${targetUser.tag} has reached 3 strikes and has been auto-blacklisted!**\n` +
                           `**Previous Strikes:** ${result.previousStrikes}\n` +
                           `**Action:** ${result.action}\n` +
                           `**Reason:** ${reason}`;
        } else {
            successMessage = `✅ Strike given to ${targetUser.tag}\n` +
                           `**Strike Count:** ${result.strikeCount}/3\n` +
                           `**Action:** ${result.action}\n` +
                           `**Reason:** ${reason}`;
        }
        
        await interaction.editReply({ content: successMessage });
        
        // Log strike action
        await logStrike(interaction, targetUser, reason, result.strikeCount, result.action, result.previousStrikes);
        
    } catch (error) {
        console.error('Error in strike command:', error);
        await interaction.editReply({ 
            content: '❌ An error occurred while giving a strike. Please check my permissions and role hierarchy.' 
        });
    }
}

async function handleViewStrikesCommand(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    try {
        const strikeCount = userStrikes.get(targetUser.id) || 0;
        const member = await interaction.guild.members.fetch(targetUser.id);
        
        let strikeRoles = [];
        if (member.roles.cache.has(STRIKE_1_ROLE_ID)) strikeRoles.push('Strike 1');
        if (member.roles.cache.has(STRIKE_2_ROLE_ID)) strikeRoles.push('Strike 2');
        if (member.roles.cache.has(BLACKLIST_ROLE_ID)) strikeRoles.push('Blacklisted');
        
        const strikeInfo = strikeRoles.length > 0 ? 
            `**Current Strike Roles:** ${strikeRoles.join(', ')}` : 
            'No active strike roles';
        
        const response = `📊 **Strike Information for ${targetUser.tag}**\n` +
                        `**Strike Count:** ${strikeCount}/3\n` +
                        `${strikeInfo}\n` +
                        `**Status:** ${strikeCount >= 3 ? '⚠️ Ready for blacklist' : 'Active'}`;
        
        await interaction.reply({ 
            content: response,
            ephemeral: true 
        });
        
    } catch (error) {
        console.error('Error in viewstrikes command:', error);
        await interaction.reply({ 
            content: '❌ An error occurred while fetching strike information.',
            ephemeral: true 
        });
    }
}

// ============================
// COMMAND HANDLERS - TEBEX
// ============================
async function handleClaimCommand(interaction) {
    const tebexId = interaction.options.getString('tebex_id');
    
    await interaction.deferReply({ ephemeral: true });
    
    const result = await claimTebexId(interaction, tebexId);
    
    if (result.success) {
        const embed = createClaimEmbed(
            result.tebexId,
            interaction.user,
            result.totalSpent,
            result.purchases.length
        );
        
        // Also send to log channel
        const logChannel = await interaction.client.channels.fetch(TEBEX_LOG_CHANNEL_ID);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
        
        await interaction.editReply({
            embeds: [embed],
            content: null
        });
    } else {
        await interaction.editReply({
            content: result.error,
            embeds: []
        });
    }
}

async function handlePurchasesCommand(interaction) {
    const targetUser = interaction.options.getUser('user');
    const tebexId = interaction.options.getString('tebex_id');
    
    // Check permissions for viewing other users' purchases
    if ((targetUser || tebexId) && !hasPermission(interaction.member, 'tebexstats')) {
        return interaction.reply({ 
            content: '❌ You need administrator permissions to view other users\' purchases.',
            ephemeral: true 
        });
    }
    
    await interaction.deferReply({ ephemeral: !(targetUser || tebexId) });
    
    try {
        let purchases = [];
        let user = targetUser || interaction.user;
        let targetTebexId = tebexId;
        
        if (tebexId) {
            // Get purchases by Tebex ID
            purchases = await db.all(
                'SELECT * FROM purchases WHERE tebex_id = ? ORDER BY purchase_date DESC',
                [tebexId]
            );
            targetTebexId = tebexId;
        } else if (targetUser) {
            // Get purchases by Discord ID
            const link = await db.get(
                'SELECT tebex_id FROM tebex_links WHERE discord_id = ?',
                [targetUser.id]
            );
            
            if (link) {
                purchases = await db.all(
                    'SELECT * FROM purchases WHERE discord_id = ? OR tebex_id = ? ORDER BY purchase_date DESC',
                    [targetUser.id, link.tebex_id]
                );
                targetTebexId = link.tebex_id;
            } else {
                purchases = await db.all(
                    'SELECT * FROM purchases WHERE discord_id = ? ORDER BY purchase_date DESC',
                    [targetUser.id]
                );
            }
        } else {
            // Get user's own purchases
            const link = await db.get(
                'SELECT tebex_id FROM tebex_links WHERE discord_id = ?',
                [interaction.user.id]
            );
            
            if (link) {
                purchases = await db.all(
                    'SELECT * FROM purchases WHERE discord_id = ? OR tebex_id = ? ORDER BY purchase_date DESC',
                    [interaction.user.id, link.tebex_id]
                );
                targetTebexId = link.tebex_id;
            } else {
                purchases = await db.all(
                    'SELECT * FROM purchases WHERE discord_id = ? ORDER BY purchase_date DESC',
                    [interaction.user.id]
                );
            }
        }
        
        if (purchases.length === 0) {
            return interaction.editReply({
                content: '📭 No purchases found for this user.'
            });
        }
        
        const totalSpent = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
        const embed = createStatsEmbed(user, targetTebexId || 'Not linked', purchases, totalSpent);
        
        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Error handling purchases command:', error);
        await interaction.editReply({
            content: '❌ An error occurred while fetching purchase history.'
        });
    }
}

async function handleCheckCommand(interaction) {
    const tebexId = interaction.options.getString('tebex_id');
    
    await interaction.deferReply();
    
    try {
        // Get player info from Tebex
        const playerInfo = await getPlayerInfo(tebexId);
        
        if (!playerInfo) {
            return interaction.editReply({
                content: `❌ Could not find information for Tebex ID: \`${tebexId}\``
            });
        }
        
        // Check if linked to Discord
        let discordUser = null;
        const link = await db.get(
            'SELECT discord_id FROM tebex_links WHERE tebex_id = ?',
            [tebexId]
        );
        
        if (link) {
            try {
                discordUser = await interaction.client.users.fetch(link.discord_id);
            } catch (error) {
                // User not found, that's okay
            }
        }
        
        // Get purchase history
        const purchases = await db.all(
            'SELECT * FROM purchases WHERE tebex_id = ? ORDER BY purchase_date DESC',
            [tebexId]
        );
        
        const embed = createCheckEmbed(tebexId, playerInfo, discordUser, purchases);
        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Error handling check command:', error);
        await interaction.editReply({
            content: '❌ An error occurred while checking the Tebex ID.'
        });
    }
}

async function handleTebexStatsCommand(interaction) {
    await interaction.deferReply();
    
    try {
        // Get overall stats
        const totalStats = await db.get(`
            SELECT 
                COUNT(*) as total_purchases,
                SUM(price) as total_revenue,
                COUNT(DISTINCT tebex_id) as unique_customers,
                COUNT(DISTINCT discord_id) as linked_accounts
            FROM purchases
            WHERE status = 'Complete'
        `);
        
        // Get today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayStats = await db.get(`
            SELECT 
                COUNT(*) as today_purchases,
                SUM(price) as today_revenue
            FROM purchases
            WHERE status = 'Complete' AND date(purchase_date) >= date(?)
        `, [today.toISOString()]);
        
        // Get top packages
        const topPackages = await db.all(`
            SELECT package_name, COUNT(*) as count, SUM(price) as revenue
            FROM purchases
            WHERE status = 'Complete'
            GROUP BY package_name
            ORDER BY revenue DESC
            LIMIT 5
        `);
        
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('📊 Tebex Store Statistics')
            .addFields(
                { name: '💰 Total Revenue', value: `$${(totalStats.total_revenue || 0).toFixed(2)}`, inline: true },
                { name: '📦 Total Purchases', value: `${totalStats.total_purchases || 0}`, inline: true },
                { name: '👥 Unique Customers', value: `${totalStats.unique_customers || 0}`, inline: true },
                { name: '🔗 Linked Accounts', value: `${totalStats.linked_accounts || 0}`, inline: true },
                { name: '📈 Today\'s Revenue', value: `$${(todayStats.today_revenue || 0).toFixed(2)}`, inline: true },
                { name: '🛍️ Today\'s Purchases', value: `${todayStats.today_purchases || 0}`, inline: true }
            )
            .setTimestamp();
        
        if (topPackages.length > 0) {
            const packageList = topPackages.map((pkg, i) => 
                `**${i + 1}.** ${pkg.package_name} - ${pkg.count} sales ($${pkg.revenue.toFixed(2)})`
            ).join('\n');
            
            embed.addFields({ 
                name: '🏆 Top Packages', 
                value: packageList,
                inline: false 
            });
        }
        
        await interaction.editReply({ embeds: [embed] });
        
    } catch (error) {
        console.error('Error handling stats command:', error);
        await interaction.editReply({
            content: '❌ An error occurred while fetching statistics.'
        });
    }
}

async function handleTebexSyncCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
        await syncRecentPurchases(interaction.client);
        await interaction.editReply({
            content: '✅ Successfully synced purchases from Tebex.'
        });
    } catch (error) {
        console.error('Error syncing purchases:', error);
        await interaction.editReply({
            content: '❌ An error occurred while syncing purchases.'
        });
    }
}

// ============================
// BUTTON HANDLER
// ============================
async function handleButtonClick(interaction) {
    if (interaction.customId.startsWith('claim_')) {
        const transactionId = interaction.customId.replace('claim_', '');
        
        // Create modal for Tebex ID input
        const modal = new ModalBuilder()
            .setCustomId(`claim_modal_${transactionId}`)
            .setTitle('Claim Purchase');
        
        const tebexIdInput = new TextInputBuilder()
            .setCustomId('tebex_id')
            .setLabel('Your Tebex/Minecraft Username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(32);
        
        const row = new ActionRowBuilder().addComponents(tebexIdInput);
        modal.addComponents(row);
        
        await interaction.showModal(modal);
    }
}

// ============================
// MODAL SUBMIT HANDLER
// ============================
async function handleModalSubmit(interaction) {
    if (interaction.customId.startsWith('claim_modal_')) {
        const transactionId = interaction.customId.replace('claim_modal_', '');
        const tebexId = interaction.fields.getTextInputValue('tebex_id');
        
        await interaction.deferReply({ ephemeral: true });
        
        const result = await claimTebexId(interaction, tebexId);
        
        if (result.success) {
            // Update the original message
            try {
                const originalMessage = await interaction.channel.messages.fetch(interaction.message.id);
                const purchase = await db.get(
                    'SELECT * FROM purchases WHERE transaction_id = ?',
                    [transactionId]
                );
                
                if (purchase && originalMessage) {
                    const embed = createPurchaseEmbed(purchase, interaction.user);
                    await originalMessage.edit({ embeds: [embed], components: [] });
                }
            } catch (error) {
                console.error('Error updating original message:', error);
            }
            
            const embed = createClaimEmbed(
                result.tebexId,
                interaction.user,
                result.totalSpent,
                result.purchases.length
            );
            
            await interaction.editReply({
                embeds: [embed],
                content: null
            });
        } else {
            await interaction.editReply({
                content: result.error,
                embeds: []
            });
        }
    }
}

// ============================
// GUILD MEMBER ADD (Auto-reapply blacklist)
// ============================
client.on('guildMemberAdd', async member => {
    try {
        // Check if this user was previously blacklisted
        if (blacklistedUsers.has(member.id)) {
            const blacklistRole = member.guild.roles.cache.get(BLACKLIST_ROLE_ID);
            
            if (blacklistRole) {
                await member.roles.add(blacklistRole);
                console.log(`Re-applied blacklist role to ${member.user.tag} (${member.id}) on rejoin`);
                
                // Log the auto-blacklist
                await logBlacklist(null, member.user, 'Previously blacklisted user rejoined', [], true);
            }
        }
    } catch (error) {
        console.error('Error handling guild member add:', error);
    }
});

// ============================
// ERROR HANDLING
// ============================
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

// ============================
// START THE BOT
// ============================
console.log('🚀 Starting bot...');
client.login(BOT_TOKEN);
