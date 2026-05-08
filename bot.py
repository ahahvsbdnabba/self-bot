import discord
import asyncio
import os
import sys
import aiohttp

# Fix aiohttp globally
aiohttp.client_exceptions.ClientConnectorError = Exception

TOKEN = os.getenv('DISCORD_TOKEN')
print(f"🔥 Token: {len(TOKEN)} chars ✓")

class StealthSelfBot(discord.Client):
    def __init__(self):
        # Fix connector issues
        connector = aiohttp.TCPConnector(
            limit=0, 
            limit_per_host=0,
            ttl_dns_cache=300,
            use_dns_cache=True
        )
        super().__init__(intents=discord.Intents.all(), connector=connector)
    
    async def on_connect(self):
        print("🔗 **Connected to Discord**")
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════════════╗
║                ✅ SELF-BOT LIVE               ║
║                                              ║
║ 👤 {self.user} ({self.user.id})                ║
║ 📡 {len(self.guilds)} servers                 ║
║                                              ║
║ 🎯 DM yourself: !ping !help !clear           ║
╚══════════════════════════════════════════════╝
        """)
        # Invisible immediately
        await self.change_presence(status=discord.Status.invisible)
    
    async def on_message(self, message):
        # Only respond to YOUR messages
        if message.author != self.user:
            return
        
        cmd = message.content.lower().strip()
        
        if cmd == '!ping':
            await message.edit(content='🚀 **SELF-BOT 100% WORKING!**')
        
        elif cmd.startswith('!clear '):
            try:
                count = min(int(cmd.split()[1]), 100)
                deleted = await message.channel.purge(limit=count + 1)
                await message.channel.send(f'🗑️ **{len(deleted)} deleted**', delete_after=3)
            except:
                await message.reply('❌ **No perms**')
        
        elif cmd == '!help':
            await message.edit(content='''🔥 **SELF-BOT COMMANDS**
`!ping` Test
`!clear 20` Delete
`!invisible` Hide
`!status coding` Status
`!servers` List servers''')
        
        elif cmd == '!invisible':
            await self.change_presence(status=discord.Status.invisible)
            await message.edit(content='👻 **Invisible ON**')
        
        elif cmd.startswith('!status '):
            status_text = ' '.join(cmd.split()[1:])
            await self.change_presence(activity=discord.Game(name=status_text))
            await message.edit(content=f'✅ **Status: {status_text}**')
        
        elif cmd == '!servers':
            servers = [guild.name for guild in self.guilds]
            await message.edit(content=f'📡 **Servers ({len(servers)}):**\n' + '\n'.join(servers[:10]))
        
        # Auto cleanup
        await asyncio.sleep(3)
        try:
            await message.delete()
        except:
            pass

# ================================
# 🚀 BULLETPROOF LAUNCH
# ================================
async def safe_login():
    print("🔥 **Stealth Launch...**")
    
    # Multiple login attempts
    for attempt in range(3):
        try:
            print(f"🔄 Login attempt {attempt + 1}/3")
            bot = StealthSelfBot()
            await bot.login(TOKEN)
            await bot.connect(reconnect=True)
            return
        except discord.LoginFailure:
            print("❌ **LOGIN FAILED** - Token issue")
            break
        except Exception as e:
            print(f"⚠️  Attempt {attempt + 1} error: {str(e)[:100]}")
            await asyncio.sleep(2)
    
    print("💥 **ALL LOGIN METHODS FAILED**")
    print("🔧 Fix: New token needed")

if __name__ == '__main__':
    try:
        asyncio.run(safe_login())
    except KeyboardInterrupt:
        print("\n👋 Shutdown")
    except Exception as e:
        print(f"💥 Fatal: {e}")
