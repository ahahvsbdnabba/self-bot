import discord
import asyncio
import aiohttp
import os
import random
from datetime import datetime
from discord.ext import commands, tasks

# Bot token from environment (set DISCORD_TOKEN in your environment)
TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN:
    print("❌ Set DISCORD_TOKEN environment variable!")
    print("Get bot token: https://discord.com/developers/applications")
    exit(1)

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(
    command_prefix=['!', '.', '?'], 
    intents=intents,
    help_command=None
)

# Startup
@bot.event
async def on_ready():
    print(f"""
╔══════════════════════════════════════════════╗
║              🤖 {bot.user} ONLINE              ║
║                                              ║
║ 🆔 ID: {bot.user.id}                           ║
║ 📡 Servers: {len(bot.guilds)}                  ║
║ 👥 Users: {len(bot.users)}                     ║
╚══════════════════════════════════════════════╝
    """)
    
    # Set status
    await bot.change_presence(
        activity=discord.Game(name="!help | discord.gg/yourserver"),
        status=discord.Status.online
    )
    
    # Start background tasks
    status_loop.start()

# Rotate status
@tasks.loop(seconds=30)
async def status_loop():
    statuses = [
        "coding in Python",
        f"{len(bot.guilds)} servers",
        "!help for commands",
        "discord.py v2.3+"
    ]
    status = random.choice(statuses)
    await bot.change_presence(activity=discord.Game(name=status))

# Basic commands
@bot.command(name='ping')
async def ping(ctx):
    """Test bot latency"""
    latency = round(bot.latency * 1000)
    embed = discord.Embed(
        title="🏓 Pong!",
        description=f"**{latency}ms**",
        color=0x00ff00,
        timestamp=datetime.utcnow()
    )
    embed.set_footer(text=f"Requested by {ctx.author}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
    await ctx.reply(embed=embed, mention_author=False)

@bot.command(name='clear', aliases=['purge', 'clean'])
@commands.has_permissions(manage_messages=True)
async def clear(ctx, count: int = 10):
    """Delete messages (bot owner only)"""
    count = min(count, 100)
    deleted = await ctx.channel.purge(limit=count, check=lambda m: not m.pinned)
    embed = discord.Embed(
        description=f"🗑️ **Deleted {len(deleted)} messages**",
        color=0xffaa00
    )
    msg = await ctx.send(embed=embed)
    await asyncio.sleep(3)
    await msg.delete()

@clear.error
async def clear_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        await ctx.reply("❌ **Missing permissions** (Manage Messages)", delete_after=5)

@bot.command(name='status')
@commands.is_owner()
async def status(ctx, *, status_text: str = "online"):
    """Change bot status (owner only)"""
    await bot.change_presence(activity=discord.Game(name=status_text))
    await ctx.reply(f"✅ **Status changed to:** `{status_text}`", delete_after=5)

@bot.command(name='servers', aliases=['guilds'])
async def servers(ctx):
    """List servers bot is in"""
    guild_list = []
    for i, guild in enumerate(bot.guilds, 1):
        member_count = guild.member_count or len(guild.members)
        guild_list.append(f"{i}. **{guild.name}** ({member_count} members)")
    
    embed = discord.Embed(
        title=f"📡 **{len(bot.guilds)} Servers**",
        description="\n".join(guild_list[:10]),
        color=0x0099ff
    )
    if len(bot.guilds) > 10:
        embed.set_footer(text=f"... and {len(bot.guilds)-10} more")
    
    await ctx.reply(embed=embed, mention_author=False)

@bot.command(name='avatar')
async def avatar(ctx, member: discord.Member = None):
    """Show user avatar"""
    user = member or ctx.author
    embed = discord.Embed(title=f"{user.display_name}'s Avatar", color=0x7289da)
    embed.set_image(url=user.avatar.url if user.avatar else user.default_avatar.url)
    await ctx.reply(embed=embed, mention_author=False)

@bot.command(name='userinfo', aliases=['user'])
async def userinfo(ctx, member: discord.Member = None):
    """Show user information"""
    user = member or ctx.author
    embed = discord.Embed(title=f"👤 {user.display_name}", color=0x00ff00)
    embed.set_thumbnail(url=user.avatar.url if user.avatar else user.default_avatar.url)
    embed.add_field(name="ID", value=user.id, inline=True)
    embed.add_field(name="Account Created", value=user.created_at.strftime("%Y-%m-%d"), inline=True)
    embed.add_field(name="Joined Server", value=ctx.guild.joined_at.strftime("%Y-%m-%d") if hasattr(ctx.guild, 'joined_at') else "N/A", inline=True)
    embed.add_field(name="Roles", value=len(user.roles)-1, inline=True)
    embed.add_field(name="Top Role", value=user.top_role.mention, inline=True)
    await ctx.reply(embed=embed, mention_author=False)

@bot.command(name='help')
async def help_command(ctx):
    """Show all commands"""
    embed = discord.Embed(title="🤖 Bot Commands", color=0x5865f2", description="**Prefix:** `!`, `.`, `?`", timestamp=datetime.utcnow())
    
    embed.add_field(
        name="📊 **Info**",
        value="`.ping` `.userinfo` `.avatar` `.servers`",
        inline=False
    )
    embed.add_field(
        name="🧹 **Moderation** (Admin)",
        value="`.clear 10` `.status <text>`",
        inline=False
    )
    embed.add_field(
        name="ℹ️ **Support**",
        value="[Invite Bot](https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID&permissions=8&scope=bot)",
        inline=False
    )
    
    embed.set_footer(text=f"Requested by {ctx.author}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
    await ctx.reply(embed=embed, mention_author=False)

# Error handler
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        return
    elif isinstance(error, commands.MissingPermissions):
        await ctx.reply("❌ **You don't have permission to use this command!**", delete_after=5)
    elif isinstance(error, commands.MissingRequiredArgument):
        await ctx.reply("❌ **Missing arguments!** Use `!help <command>`", delete_after=5)
    else:
        print(f"Error: {error}")
        await ctx.reply("❌ **An error occurred!**", delete_after=5)

# Run bot
async def main():
    async with bot:
        await bot.start(TOKEN)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Bot shutting down...")
    except Exception as e:
        print(f"💥 Fatal error: {e}")
