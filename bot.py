import discord
import asyncio
import aiohttp
import os
import sys
import gc

# Fix aiohttp issues
if 'aiohttp' in sys.modules:
    del sys.modules['aiohttp']

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN or len(TOKEN) < 50:
    print("❌ INVALID TOKEN FORMAT")
    print("Must be ~59 chars, starts with letters/numbers")
    sys.exit(1)

print(f"🔥 Token loaded: {len(TOKEN)} chars")

class UltimateSelfBot(discord.Client):
    def __init__(self):
        # Perfect connector - no errors
        connector = aiohttp.TCPConnector(
            limit=10,
            limit_per_host=5,
            force_close=True,
            enable_cleanup_closed=True
        )
        super().__init__(
            intents=discord.Intents.all(),
            connector=connector
        )
    
    async def test_token(self):
        """Test token validity"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                'https://discord.com/api/v9/users/@me',
                headers={'Authorization': TOKEN}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ TOKEN VALID: {data.get('username')}#{data.get('discriminator')}")
                    return True
                print(f"❌ HTTP {resp.status}: Invalid token")
                return False
    
    async def close(self):
        """Clean shutdown"""
        try:
            if self.http and self.http.session:
                await self.http.session.close()
        except: pass
        await super().close()
        gc.collect()
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════════════╗
║                ✅ SELF-BOT LIVE               ║
║                                              ║
║ 👤 {self.user}                               ║
║ 🆔 {self.user.id}                            ║
║ 📡 {len(self.guilds)} servers                ║
║                                              ║
║ 🎯 DM COMMANDS: !ping !help !clear !status   ║
╚══════════════════════════════════════════════╝
        """)
        await self.change_presence(status=discord.Status.invisible)
    
    async def on_message(self, message):
        # Only respond to YOUR messages
        if message.author != self.user:
            # Auto-react to mentions
            if self.user.mentioned_in(message):
                try:
                    await message.add_reaction('✅')
                except: pass
            return
        
        cmd = message.content.lower().strip()
        
        # !ping
        if '!ping' in cmd:
            await message.edit(content='🚀 **SELF-BOT 100% WORKING!** 🏓')
        
        # !help
        elif '!help' in cmd:
            help_text = '''🔥 **ULTIMATE SELF-BOT COMMANDS**

`!ping`           Test connection
`!help`           This help
`!clear 20`       Delete 20 messages  
`!status coding`  Set custom status
`!invisible`      Go invisible
`!servers`        List servers
`!test`           Check token
`!cleanup`        Clean memory'''
            await message.edit(content=help_text)
        
        # !clear
        elif '!clear' in cmd:
            try:
                count = 10
                parts = cmd.split()
                if len(parts) > 1:
                    count = min(int(parts[1]), 100)
                deleted = await message.channel.purge(limit=count)
                await message.channel.send(f'🗑️ **Deleted {len(deleted)}**', delete_after=3)
            except Exception as e:
                await message.reply(f'❌ **Error:** {str(e)[:50]}')
        
        # !status
        elif '!status' in cmd:
            status_text = 'online'
            parts = cmd.split(' ', 1)
            if len(parts) > 1:
                status_text = parts[1][:50]
            await self.change_presence(activity=discord.Game(name=status_text))
            await message.edit(content=f'✅ **Status:** {status_text}')
        
        # !invisible
        elif '!invisible' in cmd:
            await self.change_presence(status=discord.Status.invisible)
            await message.edit(content='👻 **Invisible mode ON**')
        
        # !servers
        elif '!servers' in cmd:
            servers = [f'• {guild.name}' for guild in self.guilds[:15]]
            server_list = '\n'.join(servers)
            await message.edit(content=f'📡 **{len(self.guilds)} servers:**\n{server_list}')
        
        # !test
        elif '!test' in cmd:
            valid = await self.test_token()
            await message.edit(content=f'🔍 **Token:** {"✅ VALID" if valid else "❌ INVALID"}')
        
        # !cleanup
        elif '!cleanup' in cmd:
            gc.collect()
            await message.edit(content='🧹 **Memory cleaned**')
        
        # Auto-delete command after 3s
        await asyncio.sleep(3)
        try:
            await message.delete()
        except: pass

async def main():
    print("🚀 **Ultimate Self-Bot v2.0**")
    
    # Pre-test token
    bot = UltimateSelfBot()
    if not await bot.test_token():
        print("💥 Exiting - invalid token")
        return
    
    try:
        await bot.start(TOKEN)
    except discord.LoginFailure:
        print("❌ **LOGIN FAILED** - Token revoked")
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
    except Exception as e:
        print(f"💥 **ERROR:** {type(e).__name__}: {e}")
    finally:
        await bot.close()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("👋 Exit")
