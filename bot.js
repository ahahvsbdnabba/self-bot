import discord
import asyncio
import random

# ================================
# ✅ YOUR EXACT TOKEN
# ================================
TOKEN = "mfa.MTM1MDI5MzQxMzkxNTkxODM2Nw.GEamBH.mg79efUw6-3egtbE1Mww0ltxZryxY-_oJT_0fI"

# ================================
# ✅ FULL FEATURE CLIENT
# ================================
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

client = discord.Client(intents=intents)

# ================================
# ✅ RICH STATUS
# ================================
@client.event
async def on_ready():
    print("""
╔══════════════════════════════════════╗
║           ✅ SELF-BOT LIVE           ║
║    """)
    print(f"║ 👤 {client.user} ({client.user.id})")
    print(f"║ 📡 {len(client.guilds)} servers")
    print(f"║ 🎯 Send '!help' to yourself!     ║")
    print("╚══════════════════════════════════════╝")
    
    # Rotating status
    statuses = ["🛠️ self-bot", "💻 coding", "🎮 gaming"]
    async def status_loop():
        while True:
            await client.change_presence(activity=discord.Game(name=random.choice(statuses)))
            await asyncio.sleep(15)
    asyncio.create_task(status_loop())

# ================================
# ✅ FULL COMMANDS SYSTEM
# ================================
@client.event
async def on_message(message):
    # Skip other bots
    if message.author.bot and message.author != client.user:
        return
    
    # ========== YOUR COMMANDS ==========
    if message.author == client.user:
        cmd = message.content.lower().strip()
        
        # Ping test
        if cmd == '!ping':
            await message.edit(content="🏓 **PONG!** `Connected`")
        
        # Clear messages
        elif cmd.startswith('!clear'):
            try:
                count = int(cmd.split()[1]) if len(cmd.split()) > 1 else 10
                count = min(count, 14)
                deleted = await message.channel.purge(limit=count)
                await message.channel.send(f"🧹 **Cleared {len(deleted)}**", delete_after=3)
            except:
                await message.reply("❌ `!clear 5`")
        
        # Status change
        elif cmd.startswith('!status'):
            status = " ".join(cmd.split()[1:]) or "self-bot"
            await client.change_presence(activity=discord.Game(name=status))
            await message.edit(content=f"✅ **Status:** {status}")
        
        # Server list
        elif cmd == '!servers':
            srv_list = "\n".join([f"• {g.name}" for g in client.guilds])
            await message.edit(content=f"**Servers:**\n{srv_list}")
        
        # User info
        elif cmd.startswith('!user'):
            user = message.channel.guild.get_member(int(cmd.split()[1])) if len(cmd.split()) > 1 else message.author
            await message.edit(content=f"**{user}** `{user.id}`")
        
        # Help menu
        elif cmd in ['!help', '!commands']:
            help_text = """
**🛠️ SELF-BOT COMMANDS**

`!ping`           → Test connection
`!clear 5`        → Delete messages
`!status coding`  → Change status
`!servers`        → List servers  
`!user 123456`    → User info
`!help`           → This menu

💡 Send to YOURSELF only!
"""
            await message.edit(content=help_text)
        
        # Auto cleanup
        await asyncio.sleep(3)
        try:
            await message.delete()
        except:
            pass
        return
    
    # ========== AUTO RESPONSES ==========
    content = message.content.lower()
    
    # Mention reactions
    if client.user.mentioned_in(message):
        reactions = ['👋', '👍', '😊']
        await message.add_reaction(random.choice(reactions))
        try:
            await message.reply(f"Hi {message.author.display_name}!")
        except:
            pass
    
    # Keyword auto-reacts
    keywords = {
        'hello': '👋', 'hi': '👋', 'hey': '👋',
        'morning': '☀️', 'gm': '🌅',
        'night': '🌙', 'gn': '🌙',
        'love': '❤️', 'good': '👍'
    }
    
    for word, emoji in keywords.items():
        if word in content:
            try:
                await message.add_reaction(emoji)
            except:
                break

# ================================
# ✅ PERFECT STARTUP
# ================================
async def main():
    print("🚀 **Starting self-bot...**")
    try:
        await client.start(TOKEN)
    except discord.LoginFailure:
        print("❌ **Token invalid** - Get new one!")
    except KeyboardInterrupt:
        print("\n👋 **Stopped**")
    except Exception as e:
        print(f"💥 **Error:** {e}")

if __name__ == '__main__':
    asyncio.run(main())
