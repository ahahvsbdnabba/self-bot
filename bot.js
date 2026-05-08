import discord
import asyncio
from discord.ext import commands
import logging
import re

# ⚠️ HARDCODED TOKEN - CHANGE THIS!
DISCORD_TOKEN = "MTM1MDI5MzQxMzkxNTkxODM2Nw.GEamBH.mg79efUw6-3egtbE1Mww0ltxZryxY-_oJT_0fI"  # ← PUT YOUR TOKEN HERE!!!

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('selfbot')

intents = discord.Intents.default()
intents.message_content = True
client = commands.Bot(command_prefix='!', self_bot=True, intents=intents)

@client.event
async def on_ready():
    print(f'✅ {client.user} logged in!')
    print(f'🆔 ID: {client.user.id}')
    print('🚀 Self-bot ready!')
    await client.change_presence(activity=discord.Game(name='🛠️ Ready to help!'))

@client.event
async def on_message(message):
    if message.author == client.user:
        return
    
    # AUTO-REPLY TO MENTIONS
    if client.user.mentioned_in(message) and not message.reference:
        user_mention = message.author.mention
        reply = f"Hello {user_mention}, How may I help you? 😊"
        try:
            await message.delete()
            await message.channel.send(reply)
        except:
            await message.channel.send(reply)
    
    # Auto-react
    if 'hello' in message.content.lower():
        await message.add_reaction('👋')
    
    # Channel echo
    if message.channel.name == 'general':
        await message.channel.send(f"Echo: {message.content}", delete_after=5)
    
    await client.process_commands(message)

@client.command(name='test')
async def test(ctx):
    """✅ Test command - always works!"""
    embed = discord.Embed(
        title="✅ TEST SUCCESSFUL!",
        description=f"**Bot working perfectly!**\n\n"
                   f"👤 **{ctx.author.name}**\n"
                   f"📱 **{ctx.guild.name}**\n"
                   f"💬 **{ctx.channel.name}**\n"
                   f"⏰ **<t:{int(ctx.message.created_at.timestamp())}:F>**",
        color=0x00ff00
    )
    embed.set_thumbnail(url=ctx.author.display_avatar.url)
    await ctx.send(embed=embed, delete_after=10)
    await ctx.message.delete()

@client.command()
async def ping(ctx):
    latency = round(client.latency * 1000)
    embed = discord.Embed(title="🏓 Pong!", description=f"**{latency}ms**", color=0x5865F2)
    await ctx.send(embed=embed)

@client.command()
async def status(ctx, *, status_text):
    await client.change_presence(activity=discord.Game(name=status_text))
    await ctx.send(f'✅ Status: **{status_text}**')

@client.command()
async def clear(ctx, amount: int = 10):
    deleted = await ctx.channel.purge(limit=amount+1)
    embed = discord.Embed(title="🧹 Cleared", description=f"**{len(deleted)-1}** msgs", color=0xff0000)
    msg = await ctx.send(embed=embed)
    await asyncio.sleep(3)
    await msg.delete()

@client.command()
async def help(ctx):
    embed = discord.Embed(title="🤖 Commands", color=0x0099ff)
    embed.add_field(name="📝 Basic", value="`!test` `!ping` `!help`", inline=False)
    embed.add_field(name="⚙️ Utils", value="`!status hi` `!clear 10`", inline=False)
    embed.add_field(name="🎯 Auto", value="@bot → Auto reply!", inline=False)
    await ctx.send(embed=embed)

@client.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        return
    await ctx.send(f"❌ `{error}`", delete_after=5)

if __name__ == '__main__':
    if DISCORD_TOKEN == "MTM1MDI5MzQxMzkxNTkxODM2Nw.GEamBH.mg79efUw6-3egtbE1Mww0ltxZryxY-_oJT_0fI":
        print("❌ CHANGE THE TOKEN IN LINE 11!!!")
        input("Press Enter after changing token...")
    
    try:
        client.run(DISCORD_TOKEN, bot=False)
    except discord.LoginFailure:
        print('❌ INVALID TOKEN!')
    except Exception as e:
        print(f'❌ {e}')
