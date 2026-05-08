import discord
import asyncio
import os
import aiohttp
import sys

# Fix aiohttp connector error
if 'aiohttp' in sys.modules:
    del sys.modules['aiohttp']

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN or len(TOKEN) < 50:
    print("❌ INVALID TOKEN FORMAT")
    print("Must be ~59 chars, starts with letters/numbers")
    sys.exit(1)

print(f"🔥 Token loaded: {len(TOKEN)} chars")

class SelfBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.all(), 
                        connector=aiohttp.TCPConnector(limit=0))
    
    async def test_token(self):
        """Test token before login"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                'https://discord.com/api/v9/users/@me',
                headers={'Authorization': TOKEN}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ TOKEN VALID: {data.get('username', 'Unknown')}#{data.get('discriminator', '0000')}")
                    return True
                else:
                    print(f"❌ HTTP {resp.status}: Invalid/revoked token")
                    return False
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════════════╗
║                ✅ SELF-BOT LIVE               ║
║                                              ║
║ 👤 {self.user}                               ║
║ 🆔 {self.user.id}                            ║
║ 📡 {len(self.guilds)} servers                ║
╚══════════════════════════════════════════════╝
        """)
        await self.change_presence(status=discord.Status.invisible)
    
    async def on_message(self, message):
        if message.author != self.user:
            return
        
        cmd = message.content.lower().strip()
        
        if cmd == '!ping':
            await message.edit(content='🏓 **PONG! 100% WORKING!**')
        
        elif cmd.startswith('!clear'):
            try:
                count = 10
                if len(cmd.split()) > 1:
                    count = min(int(cmd.split()[1]), 100)
                deleted = await message.channel.purge(limit=count)
                await message.channel.send(f'🗑️ Deleted {len(deleted)}', delete_after=2)
            except:
                await message.reply('❌ No perms')
        
        elif cmd == '!help':
            await message.edit(content='''**🔥 COMMANDS** (DM yourself)
`!ping` - Test
`!clear 20` - Delete messages
`!invisible` - Hide status
`!status coding` - Change status
`!test` - Token check''')
        
        elif cmd == '!invisible':
            await self.change_presence(status=discord.Status.invisible)
            await message.edit(content='👻 **Invisible ON**')
        
        elif cmd.startswith('!status'):
            status = cmd.split(' ', 1)[1] if len(cmd.split()) > 1 else 'online'
            await self.change_presence(activity=discord.Game(name=status))
            await message.edit(content=f'✅ **Status: {status}**')
        
        elif cmd == '!test':
            valid = await self.test_token()
            await message.edit(content=f'🔍 **Token valid:** {"✅ YES" if valid else "❌ NO"}')
        
        # Auto-delete after 3 seconds
        await asyncio.sleep(3)
        try:
            await message.delete()
        except:
            pass

# ================================
# 🚀 CLEAN LAUNCH
# ================================
async def main():
    print("🔥 **Launching Self-Bot...**")
    
    # Test token first
    selfbot = SelfBot()
    valid = await selfbot.test_token()
    
    if not valid:
        print("💥 Cannot proceed - fix DISCORD_TOKEN")
        return
    
    try:
        await selfbot.start(TOKEN)
    except discord.LoginFailure:
        print("❌ LOGIN FAILED - Token revoked")
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
