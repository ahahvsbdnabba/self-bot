import discord
import asyncio
import logging
import aiohttp
import os
from datetime import datetime

# ================================
# 🔥 HARDCODED TOKEN - REPLACE THIS!
# ================================
TOKEN = "MTM1MDI5MzQxMzkxNTkxODM2Nw.GEamBH.mg79efUw6-3egtbE1Mww0ltxZryxY-_oJT_0fI"

# ================================
# ✅ CLEAN LOGGING
# ================================
logging.basicConfig(
    level=logging.WARNING,  # Reduce spam
    format='%(asctime)s | %(levelname)s | %(message)s'
)
log = logging.getLogger('SelfBot')

# ================================
# ✅ FIXED CLIENT WITH CLEANUP
# ================================
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

class SelfBot(discord.Client):
    async def close(self):
        log.info("👋 Shutting down cleanly...")
        await super().close()

client = SelfBot(intents=intents)

# ================================
# ✅ EVENTS
# ================================
@client.event
async def on_ready():
    print(f'\n{"="*60}')
    print(f'✅ SELF-BOT ONLINE: {client.user} (ID: {client.user.id})')
    print(f'📊 {len(client.guilds)} servers | {sum(len(g.members) for g in client.guilds)} members')
    print(f'🚀 Send "!help" to YOURSELF to start!')
    print(f'{"="*60}')
    
    # Stealth status
    await client.change_presence(status=discord.Status.online, afk=True)

@client.event
async def on_message(message):
    if message.author != client.user:
        # Auto-reactions
        content = message.content.lower()
        if client.user.mentioned_in(message):
            try:
                await message.add_reaction('👋')
                await asyncio.sleep(0.5)
                await message.reply(f"Hi {message.author.mention}!")
            except:
                pass
        return
    
    # ========== SELF COMMANDS ==========
    content = message.content.strip().lower()
    
    if content == '!ping':
        await message.edit(content="🏓 **PONG!** *(0.1s)*")
    
    elif content.startswith('!clear'):
        try:
            amount = int(content.split()[1]) if len(content.split()) > 1 else 10
            amount = min(amount, 14)  # Discord bulk delete limit
            
            deleted = await message.channel.purge(limit=amount)
            await message.channel.send(f"🧹 **Cleared {len(deleted)}**", delete_after=3)
        except:
            await message.reply("❌ **Use: !clear 5**")
    
    elif content.startswith('!status'):
        status = content[7:].strip() or "🛠️ self-bot"
        await client.change_presence(activity=discord.Game(name=status))
        await message.edit(content=f"✅ **Status:** {status}")
    
    elif content == '!servers':
        servers = "\n".join([f"• {g.name} ({g.id})" for g in client.guilds])
        await message.edit(content=f"**Servers ({len(client.guilds)}):**\n{servers}")
    
    elif content == '!help':
        help_text = """
**🛠️ SELF-BOT COMMANDS** (send to yourself):

`!ping`     → Test connection
`!clear 5`  → Delete 5 messages
`!status hi`→ Change status  
`!servers`  → List servers
`!help`     → This help

⚠️ Auto-deletes in 3s
"""
        await message.edit(content=help_text)
    
    # Auto-cleanup
    await asyncio.sleep(3)
    try:
        await message.delete()
    except:
        pass

@client.event
async def on_disconnect():
    log.warning("🔌 Disconnected - reconnecting...")

# ================================
# ✅ FIXED STARTUP WITH CLEANUP
# ================================
async def main():
    """🚀 Main startup with proper cleanup"""
    print("🚀 **SELF-BOT STARTING**")
    print("💡 Send `!help` to YOURSELF")
    print("⚠️ Token hardcoded - CHANGE IMMEDIATELY!")
    
    # Fix aiohttp cleanup
    connector = aiohttp.TCPConnector(limit=50, limit_per_host=20)
    timeout = aiohttp.ClientTimeout(total=30)
    
    try:
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            await client.login(TOKEN, bot=False)
            await client.connect()
    except discord.LoginFailure:
        print("\n❌ **INVALID/EXPIRED TOKEN!**")
        print("🔄 **GET NEW TOKEN:**")
        print("   1. Discord.com → F12 → Network tab")
        print("   2. Refresh → Find 'science' request")
        print("   3. Headers → 'Authorization' → Copy")
        print("   4. Replace line 12 with new token")
    except discord.HTTPException as e:
        print(f"❌ **HTTP ERROR:** {e.status} {e.code}")
        print("🔄 Token likely revoked - get new one")
    except KeyboardInterrupt:
        print("\n⏹️ Stopped by user")
    except Exception as e:
        print(f"❌ **CRASH:** {type(e).__name__}: {e}")
    finally:
        # Proper cleanup
        if not client.is_closed():
            await client.close()
        print("✅ Clean shutdown")

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
