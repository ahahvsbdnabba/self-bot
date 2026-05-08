import discord
import asyncio
import os
import random
import sqlite3
from datetime import datetime
from discord.ext import commands, tasks

# CONFIG
TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN:
    print("❌ Set DISCORD_TOKEN=Bot YOUR_BOT_TOKEN")
    print("https://discord.com/developers/applications")
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

# Database
def init_db():
    conn = sqlite3.connect('bot.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        guild_id INTEGER,
        balance INTEGER DEFAULT 1000,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0
    )''')
    conn.commit()
    conn.close()

# Events
@bot.event
async def on_ready():
    init_db()
    print(f"""
╔══════════════════════════════════════════════╗
║              ✅ {bot.user} LIVE                ║
║                                              ║
║ 🆔 {bot.user.id}                              ║
║ 📡 {len(bot.guilds)} servers                  ║
║ 👥 {sum(g.member_count for g in bot.guilds)} users ║
╚══════════════════════════════════════════════╝
    """)
    status_loop.start()

@tasks.loop(seconds=30)
async def status_loop():
    statuses = [
        "!help - Ultimate Bot",
        f"{len(bot.guilds)} servers", 
        "Fully working!",
        "No self-bots!"
    ]
    await bot.change_presence(activity=discord.Game(random.choice(statuses)))

# ==================== COMMANDS ====================
@bot.command()
async def ping(ctx):
    """Bot latency"""
    latency = round(bot.latency * 1000)
    embed = discord.Embed(title="🏓 Pong!", description=f"**{latency}ms**", color=0x00ff00)
    await ctx.reply(embed=embed)

@bot.command(aliases=['info'])
async def botinfo(ctx):
    """Bot stats"""
    embed = discord.Embed(title=f"🤖 {bot.user}", color=0x5865f2)
    embed.add_field(name="Servers", value=len(bot.guilds))
    embed.add_field(name="Commands", value=len(bot.commands))
    embed.set_footer(text="100% Working!")
    await ctx.reply(embed=embed)

@bot.command()
async def servers(ctx):
    """List servers"""
    srvlist = [f"**{g.name}** ({g.member_count})" for g in bot.guilds[:10]]
    embed = discord.Embed(title=f"📡 {len(bot.guilds)} Servers", description="\n".join(srvlist))
    await ctx.reply(embed=embed)

@bot.command()
async def avatar(ctx, user: discord.Member = None):
    """User avatar"""
    user = user or ctx.author
    embed = discord.Embed(title=f"{user}'s Avatar")
    embed.set_image(url=user.display_avatar.url)
    await ctx.reply(embed=embed)

@bot.command()
async def userinfo(ctx, user: discord.Member = None):
    """User info"""
    user = user or ctx.author
    embed = discord.Embed(title=str(user), color=0x00ff88)
    embed.add_field(name="ID", value=user.id)
    embed.add_field(name="Joined", value=user.created_at.strftime("%Y-%m-%d"))
    if ctx.guild:
        embed.add_field(name="Server Join", value=user.joined_at.strftime("%Y-%m-%d"))
    embed.set_thumbnail(url=user.display_avatar.url)
    await ctx.reply(embed=embed)

@bot.command(aliases=['purge', 'clean'])
@commands.has_permissions(manage_messages=True)
async def clear(ctx, amount: int = 10):
    """Delete messages"""
    amount = min(amount, 100)
    deleted = await ctx.channel.purge(limit=amount)
    embed = discord.Embed(description=f"🗑️ Deleted {len(deleted)}", color=0xffaa00)
    msg = await ctx.send(embed=embed)
    await asyncio.sleep(3)
    await msg.delete()

@clear.error
async def clear_error(ctx, error):
    if isinstance(error, commands.MissingPermissions):
        await ctx.reply("❌ Need Manage Messages perm!", delete_after=5)

# Economy
def get_user(user_id, guild_id):
    conn = sqlite3.connect('bot.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE user_id=? AND guild_id=?", (user_id, guild_id))
    data = c.fetchone()
    if not data:
        c.execute("INSERT INTO users VALUES(?, ?, 1000, 1, 0)", (user_id, guild_id))
        conn.commit()
        data = (user_id, guild_id, 1000, 1, 0)
    conn.close()
    return data

@bot.command(aliases=['bal'])
async def balance(ctx):
    """Check balance"""
    data = get_user(ctx.author.id, ctx.guild.id)
    embed = discord.Embed(title="💰 Balance", color=0x00ff88)
    embed.add_field(name="Coins", value=f"${data[2]:,}")
    embed.add_field(name="Level", value=data[3])
    await ctx.reply(embed=embed)

@bot.command()
async def daily(ctx):
    """Daily reward"""
    data = get_user(ctx.author.id, ctx.guild.id)
    reward = random.randint(100, 500)
    new_bal = data[2] + reward
    conn = sqlite3.connect('bot.db')
    c = conn.cursor()
    c.execute("UPDATE users SET balance=? WHERE user_id=? AND guild_id=?", 
              (new_bal, ctx.author.id, ctx.guild.id))
    conn.commit()
    conn.close()
    await ctx.reply(f"🎁 **+${reward}** New balance: ${new_bal:,}")

# Fun
@bot.command(name='8ball')
async def magic8ball(ctx, *, question):
    """Magic 8-ball"""
    answers = ["Yes", "No", "Maybe", "Ask again", "Yes definitely", "No way"]
    embed = discord.Embed(title="🎱 8-Ball", color=0x663399)
    embed.add_field(name=question[:100], value=random.choice(answers))
    await ctx.reply(embed=embed)

@bot.command()
async def coinflip(ctx):
    """Flip coin"""
    result = random.choice(["**Heads! 🪙**", "**Tails! 🪙**"])
    await ctx.reply(result)

# Help
@bot.command()
async def help(ctx):
    """Help menu"""
    embed = discord.Embed(title="🤖 Commands", color=0x5865f2)
    embed.add_field(name="📊 Info", value="`ping` `botinfo` `servers` `userinfo` `avatar`", inline=False)
    embed.add_field(name="🧹 Mod", value="`clear 10` (admin)", inline=False)
    embed.add_field(name="💰 Economy", value="`balance` `daily`", inline=False)
    embed.add_field(name="🎮 Fun", value="`8ball <question>` `coinflip`", inline=False)
    await ctx.reply(embed=embed)

# XP System
@bot.event
async def on_message(message):
    if message.author.bot:
        return
    
    await bot.process_commands(message)
    
    # XP (5% chance)
    if random.randint(1, 20) == 1:
        data = get_user(message.author.id, message.guild.id)
        new_xp = data[4] + random.randint(10, 25)
        
        # Level up
        level = data[3]
        required = 5 * (level ** 2)
        if new_xp >= required:
            new_level = level + 1
            conn = sqlite3.connect('bot.db')
            c = conn.cursor()
            c.execute("UPDATE users SET xp=?, level=? WHERE user_id=? AND guild_id=?", 
                     (new_xp, new_level, message.author.id, message.guild.id))
            conn.commit()
            conn.close()
            await message.channel.send(f"🎉 {message.author.mention} **Level {new_level}!**")
        else:
            conn = sqlite3.connect('bot.db')
            c = conn.cursor()
            c.execute("UPDATE users SET xp=? WHERE user_id=? AND guild_id=?", 
                     (new_xp, message.author.id, message.guild.id))
            conn.commit()
            conn.close()

# Error handler
@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        return
    await ctx.reply("❌ Error! Use `!help`", delete_after=5)

# Run
async def main():
    status_loop.start()
    await bot.start(TOKEN)

if __name__ == '__main__':
    asyncio.run(main())
