const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, entersState, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');

// ============================
// CONFIGURATION - EDIT THESE
// ============================
const BOT_TOKEN = process.env.BOT_TOKEN || 'MTUwMTI3NTE2NDc2MTkxOTU4OQ.GrKF0l.zB5WxeQFGeNfk8K692AecU9g8TErDVnaNO8t3Q'; // Use env var for Railway
const ALLOWED_USER_ID = '1350293413915918367'; // User who can always run command
const LOG_CHANNEL_ID = '1482790191407173733'; // Channel for role assignment logs
const BLACKLIST_LOG_CHANNEL_ID = '1482790260432961650'; // Channel for blacklist logs
const STRIKE_LOG_CHANNEL_ID = '1482790224357490904'; // Channel for strike logs
const REQUIRED_ROLE_ID = '1479345511067554002'; // "Role Perms" role ID
const BLACKLIST_ROLE_ID = '1479345579669848134'; // Blacklist role ID
const STRIKE_1_ROLE_ID = '1501054755089154179'; // Strike 1 role
const STRIKE_2_ROLE_ID = '1479345540532539443'; // Strike 2 role
const VOICE_CHANNEL_ID = '1491782921852424433'; // VC to auto-join on launch

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
// VOICE CHAT VARIABLES
// ============================
let voiceConnection = null;
let audioPlayer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds

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

// ============================
// VOICE CHAT FUNCTIONS
// ============================
async function joinVoiceChat(client) {
    try {
        console.log(`🔊 Attempting to join voice channel: ${VOICE_CHANNEL_ID}`);
        
        const voiceChannel = await client.channels.fetch(VOICE_CHANNEL_ID);
        if (!voiceChannel) {
            console.error('❌ Voice channel not found');
            return;
        }
        
        if (!voiceChannel.isVoiceBased()) {
            console.error('❌ Channel is not a voice channel');
            return;
        }
        
        // Join the voice channel
        voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false, // Bot is not deafened (can hear)
            selfMute: true   // Bot is muted (won't transmit audio)
        });
        
        console.log('✅ Successfully joined voice channel');
        
        // Create an audio player (for silent audio to keep connection active)
        audioPlayer = createAudioPlayer();
        
        // Create a silent audio resource (1 second of silence, looped)
        const silentAudio = createAudioResource('silence.mp3', {
            inputType: StreamType.Arbitrary,
            inlineVolume: true
        });
        
        // Play silent audio
        audioPlayer.play(silentAudio);
        voiceConnection.subscribe(audioPlayer);
        
        console.log('🔇 Playing silent audio to maintain connection');
        
        // Set up connection event handlers
        voiceConnection.on(VoiceConnectionStatus.Ready, () => {
            console.log('✅ Voice connection ready');
            reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        });
        
        voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
            console.log('⚠️ Voice connection disconnected, attempting to reconnect...');
            reconnectAttempts++;
            
            if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => joinVoiceChat(client), RECONNECT_DELAY);
            } else {
                console.error(`❌ Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
            }
        });
        
        voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
            console.log('❌ Voice connection destroyed');
            reconnectAttempts = 0;
        });
        
        voiceConnection.on('error', error => {
            console.error('❌ Voice connection error:', error);
        });
        
        // Log to console that bot appears to be in VC
        console.log('🎮 Bot is now in voice channel - will appear as "In Voice Channel" to users');
        
    } catch (error) {
        console.error('❌ Error joining voice channel:', error);
        
        // Attempt to reconnect after delay
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY/1000}s...`);
            setTimeout(() => joinVoiceChat(client), RECONNECT_DELAY);
        }
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
        GatewayIntentBits.GuildVoiceStates
    ] 
});

// Store blacklisted users and strike counts
let blacklistedUsers = new Set();
let userStrikes = new Map();

client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    
    // Set bot status to show it's "in a call"
    client.user.setPresence({
        activities: [{
            name: 'Staff Management',
            type: 0 // Playing
        }],
        status: 'online'
    });
    
    // Join voice channel on startup
    await joinVoiceChat(client);
    
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
        const staffRoles = getAllStaffRoles();
        
        const commands = [
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
            
            // /voice command to manually control voice
            new SlashCommandBuilder()
                .setName('voice')
                .setDescription('Control bot voice connection')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Join VC', value: 'join' },
                            { name: 'Leave VC', value: 'leave' },
                            { name: 'Reconnect', value: 'reconnect' },
                            { name: 'Status', value: 'status' }
                        ))
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
    
    // Check if user has the +_+ role (can reassign staff roles)
    if (hasPlusPlusRole(member)) {
        return true;
    }
    
    return false;
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
        // Check permissions for all commands (except /voice)
        if (interaction.commandName !== 'voice' && !hasPermission(interaction.member)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command. You need the "Role Perms" role or +_+ role.',
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
        } else if (interaction.commandName === 'voice') {
            await handleVoiceCommand(interaction);
        }
    }
});

// Handle /staff command
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

// Handle /voice command
async function handleVoiceCommand(interaction) {
    const action = interaction.options.getString('action');
    
    // Only allowed users can control voice
    if (!hasPermission(interaction.member)) {
        return interaction.reply({ 
            content: '❌ You do not have permission to control the voice connection.',
            ephemeral: true 
        });
    }
    
    try {
        await interaction.deferReply({ ephemeral: true });
        
        switch (action) {
            case 'join':
                await joinVoiceChat(client);
                await interaction.editReply({ 
                    content: `✅ Attempting to join voice channel <#${VOICE_CHANNEL_ID}>...` 
                });
                break;
                
            case 'leave':
                if (voiceConnection) {
                    voiceConnection.destroy();
                    voiceConnection = null;
                    audioPlayer = null;
                    await interaction.editReply({ 
                        content: `✅ Left voice channel <#${VOICE_CHANNEL_ID}>` 
                    });
                } else {
                    await interaction.editReply({ 
                        content: '❌ Bot is not currently in a voice channel.' 
                    });
                }
                break;
                
            case 'reconnect':
                if (voiceConnection) {
                    voiceConnection.destroy();
                }
                reconnectAttempts = 0;
                await joinVoiceChat(client);
                await interaction.editReply({ 
                    content: `🔄 Attempting to reconnect to <#${VOICE_CHANNEL_ID}>...` 
                });
                break;
                
            case 'status':
                const status = voiceConnection ? 
                    `✅ Connected to <#${VOICE_CHANNEL_ID}>` : 
                    '❌ Not connected to voice channel';
                await interaction.editReply({ 
                    content: `**Voice Status:**\n${status}` 
                });
                break;
        }
        
    } catch (error) {
        console.error('Error in voice command:', error);
        await interaction.editReply({ 
            content: '❌ An error occurred while processing the voice command.' 
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
