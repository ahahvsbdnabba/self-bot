const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// ============================
// CONFIGURATION - EDIT THESE
// ============================
const BOT_TOKEN = 'MTUwMTI3NTE2NDc2MTkxOTU4OQ.GrKF0l.zB5WxeQFGeNfk8K692AecU9g8TErDVnaNO8t3Q'; // Replace with your bot token
const ALLOWED_USER_ID = '1350293413915918367'; // User who can always run command
const LOG_CHANNEL_ID = '1482790191407173733'; // Channel for role assignment logs
const BLACKLIST_LOG_CHANNEL_ID = '1482790260432961650'; // Channel for blacklist logs
const STRIKE_LOG_CHANNEL_ID = '1482790224357490904'; // Channel for strike logs
const REQUIRED_ROLE_ID = '1479345511067554002'; // "Role Perms" role ID
const BLACKLIST_ROLE_ID = '1479345579669848134'; // Blacklist role ID
const STRIKE_1_ROLE_ID = '1501054755089154179'; // Strike 1 role
const STRIKE_2_ROLE_ID = '1479345540532539443'; // Strike 2 role

// Role Configuration
const ROLES_CONFIG = {
    // Primary roles with their automatic sub-roles
    "FOUNDER (PAY)": {
        roleId: "1469853355756228759",
        autoRoles: ["1479345519586316489", "1479369071974940769", "1485133595009089626", "1479345519024144416", "1479345520194486325", "1477571643692810262"]
    },
    "Owner": {
        roleId: "1491333172439420968",
        autoRoles: ["1479345519586316489", "1479369071974940769", "1485133595009089626", "1479345519024144416", "1479345520194486325", "1477571643692810262"]
    },
    "Co Owner": {
        roleId: "1479345499441074206",
        autoRoles: ["1479345519586316489", "1479369071974940769", "1485133595009089626", "1479345519024144416", "1479345520194486325", "1477571643692810262"]
    },
    "CEO": {
        roleId: "1500931584243531858",
        autoRoles: ["1479345519586316489", "1479369071974940769", "1485133595009089626", "1479345519024144416", "1479345520194486325", "1477571643692810262"]
    },
    "Supervisor": {
        roleId: "1500084210172428459",
        autoRoles: ["1479345511067554002", "1493678098514968576"]
    },
    "Superior": {
        roleId: "1479345508928721074",
        autoRoles: ["1479345511067554002", "1493678098514968576"]
    },
    "Server Director": {
        roleId: "1479345512606863380",
        autoRoles: ["1479345511067554002", "1493678098514968576"]
    },
    "Staff Director": {
        roleId: "1479345513244659752",
        autoRoles: ["1479345511067554002", "1493678098514968576"]
    },
    "Operations": {
        roleId: "1479345516100980877",
        autoRoles: ["1479345511067554002", "1493678098514968576"]
    },
    "Executive": {
        roleId: "1479345516814008411",
        autoRoles: ["1479345511067554002", "1493678098514968576"]
    },
    "Overseer": {
        roleId: "1479345520874094752",
        autoRoles: ["1479345511067554002", "1493678098514968576"]
    },
    "Server Management": {
        roleId: "1479345521649909760",
        autoRoles: ["1479345525009416343"]
    },
    "Head Management": {
        roleId: "1479345522270670939",
        autoRoles: ["1479345525009416343"]
    },
    "Senior Management": {
        roleId: "1479345522933502024",
        autoRoles: ["1479345525009416343"]
    },
    "Management": {
        roleId: "1479345523801723051",
        autoRoles: ["1479345525009416343"]
    },
    "Trial Management": {
        roleId: "1479345524388663346",
        autoRoles: ["1479345525009416343"]
    },
    "Community Manager": {
        roleId: "1479345525689159744",
        autoRoles: ["1479345532261371965"]
    },
    "Head of Staff": {
        roleId: "1479345529845583913",
        autoRoles: ["1479345532261371965"]
    },
    "Lead Administrator": {
        roleId: "1479345531477168230",
        autoRoles: ["1479345532261371965"]
    },
    "Head Administrator": {
        roleId: "1479345532848570369",
        autoRoles: ["1493650573315149956"]
    },
    "Senior Administrator": {
        roleId: "1479345533414932592",
        autoRoles: ["1493650573315149956"]
    },
    "Administrator": {
        roleId: "1479345534685806736",
        autoRoles: ["1493650573315149956"]
    },
    "Head Moderator": {
        roleId: "1479345536669585478",
        autoRoles: ["1493650573315149956"]
    },
    "Moderator": {
        roleId: "1479345537928134737",
        autoRoles: ["1493650573315149956"]
    },
    "Trial Moderator": {
        roleId: "1479345538657816646",
        autoRoles: ["1493650573315149956"]
    }
};

// Store blacklisted users and strike counts
let blacklistedUsers = new Set();
let userStrikes = new Map(); // Map of user ID to strike count

// ============================
// BOT SETUP
// ============================
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences
    ] 
});

client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    
    // Register slash commands
    await registerSlashCommands();
    
    // Initialize blacklisted users and strike counts
    await initializeBlacklistedUsers();
    await initializeStrikeCounts();
    
    console.log(`🔄 Initialized ${blacklistedUsers.size} blacklisted users`);
    console.log(`⚡ Initialized ${userStrikes.size} users with strikes`);
});

// ============================
// COMMAND REGISTRATION
// ============================
async function registerSlashCommands() {
    try {
        const commands = [
            // /staff command
            new SlashCommandBuilder()
                .setName('staff')
                .setDescription('Assign staff role with automatic sub-roles')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to assign role to')
                        .setRequired(true))
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
                        .setDescription('Reason for unblacklisting')
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
                .toJSON()
        ];

        // Register commands globally
        await client.application?.commands.set(commands);
        console.log('✅ Slash commands registered globally');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
}

// ============================
// PERMISSION CHECK
// ============================
function hasPermission(member) {
    // Check if user is the allowed user
    if (member.id === ALLOWED_USER_ID) {
        return true;
    }
    
    // Check if user has the required role
    if (member.roles.cache.has(REQUIRED_ROLE_ID)) {
        return true;
    }
    
    return false;
}

// ============================
// ROLE MANAGEMENT FUNCTIONS
// ============================
function getAllStaffRoleIds() {
    const allRoleIds = new Set();
    
    // Add all main role IDs
    for (const config of Object.values(ROLES_CONFIG)) {
        allRoleIds.add(config.roleId);
        // Add all auto role IDs
        for (const autoRoleId of config.autoRoles) {
            allRoleIds.add(autoRoleId);
        }
    }
    
    return Array.from(allRoleIds);
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
// LOGGING FUNCTIONS
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
// SELECT MENU CREATION
// ============================
function createRankSelectMenu() {
    const options = Object.keys(ROLES_CONFIG).map(rank => 
        new StringSelectMenuOptionBuilder()
            .setLabel(rank)
            .setValue(rank)
            .setDescription(`Assign ${rank} role`)
    );

    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('rank_select')
                .setPlaceholder('Select a staff rank...')
                .addOptions(...options)
        );
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
        const staffRoleIds = getAllStaffRoleIds();
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
        // Check permissions for all commands
        if (!hasPermission(interaction.member)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command. You need the "Role Perms" role.',
                ephemeral: true 
            });
        }
        
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
        }
    } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'rank_select') {
            await handleRankSelect(interaction);
        }
    }
});

// Handle /staff command (shows dropdown)
async function handleStaffCommand(interaction) {
    const targetUser = interaction.options.getUser('user');
    
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
    
    // Create and send dropdown menu
    const selectMenu = createRankSelectMenu();
    
    await interaction.reply({ 
        content: `🎯 **Select a rank for ${targetUser.tag}:**`,
        components: [selectMenu],
        ephemeral: true 
    });
}

// Handle rank selection from dropdown
async function handleRankSelect(interaction) {
    const rank = interaction.values[0];
    const message = await interaction.message.fetch();
    const targetUserMatch = message.content.match(/for (.+?):/);
    
    if (!targetUserMatch) {
        return interaction.update({ 
            content: '❌ Error: Could not find target user.',
            components: [],
            ephemeral: true 
        });
    }
    
    const targetUsername = targetUserMatch[1];
    const targetUser = interaction.guild.members.cache.find(member => 
        member.user.tag === targetUsername || member.user.username === targetUsername
    )?.user;
    
    if (!targetUser) {
        return interaction.update({ 
            content: '❌ Error: Target user not found in server.',
            components: [],
            ephemeral: true 
        });
    }
    
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        const roleConfig = ROLES_CONFIG[rank];
        
        if (!roleConfig) {
            return interaction.editReply({ content: '❌ Invalid rank selected.' });
        }
        
        // Get main role
        const mainRole = interaction.guild.roles.cache.get(roleConfig.roleId);
        if (!mainRole) {
            return interaction.editReply({ content: `❌ Main role for "${rank}" not found on server.` });
        }
        
        // Get auto roles
        const autoRoles = [];
        for (const autoRoleId of roleConfig.autoRoles) {
            const autoRole = interaction.guild.roles.cache.get(autoRoleId);
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

// Handle /blacklist command
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

// Handle /unblacklist command
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

// Handle /strike command
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

// Handle /viewstrikes command
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
