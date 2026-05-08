import discord
import asyncio
import aiohttp
import os
import gc
import ssl

# Global cleanup
aiohttp.client.DEFAULT_CLEANUP_CLOSED = True

# Get token from Railway
TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN:
    print("❌ No DISCORD_TOKEN in Railway variables")
    exit(1)

# Auto-fix common token issues
if TOKEN.startswith('Bot '):
    print("🔧 Removing 'Bot ' prefix...")
    TOKEN = TOKEN[4:]

print(f"🔥 Self-bot starting... Token length: {len(TOKEN)}")
print(f"🔍 Preview: {TOKEN[:12]}...{TOKEN[-8:]}")

class UltimateSelfBot(discord.Client):
    def __init__(self):
        # Perfect connector for self-bots
        connector = aiohttp.TCPConnector(
            limit=10,
            limit_per_host=5,
            force_close=True,
            enable_cleanup_closed=True,
            use_dns_cache=True,
            ssl=ssl.create_default_context()
        )
        super().__init__(
            intents=discord.Intents.default(),
            connector=connector,
            heartbeat_timeout=60.0
        )
    
    async def close(self):
        try:
            if hasattr(self, 'http') and self.http.session:
                await self.http.session.close()
        except: pass
        await super().close()
        gc.collect()
        print("🧹 Cleaned up")
    
    async def on_connect(self):
        print("🔗 Connected to gateway")
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════╗
║           ✅ SELF-BOT ONLINE          ║
║                                      ║
║ 👤 {self.user}                       ║
║ 🆔 {self.user.id}                    ║
║ 🌐 {len(self.guilds)} servers        ║
║                                      ║
║ 💬 DM these commands:                ║
║   !ping  !help  !clear  !status      ║
╚══════════════════════════════════════╝
        """)
        # Stay invisible
        await self.change_presence(status=discord.Status.invisible)
    
    async def on_message(self, message):
        # Ignore other users
        if message.author != self.user:
            # Auto-react to your mentions
            if self.user.mentioned_in(message):
                try:
                    await message.add_reaction('👋')
                except: pass
            return
        
        # Parse command
        cmd = message.content.lower().strip()
        
        # !ping
        if '!ping' in cmd:
            await message.edit(content='🚀 **SELF-BOT 100% WORKING!**')
        
        # !help
        elif '!help' in cmd:
            await message.edit(content='''🔥 **COMMANDS** (DM only)

`!ping` - Test bot
`!help` - This help
`!clear 10` - Delete 10 msgs
`!status coding` - Set status
`!invisible` - Go invisible
`!servers` - List servers
`!cleanup` - Clean memory''')
        
        # !clear
        elif '!clear' in cmd:
            try:
                count = 10
                parts = cmd.split()
                if len(parts) > 1: 
                    count = min(int(parts[1]), 50)
                deleted = await message.channel.purge(limit=count+1)
                await message.channel.send(f'🗑️ Deleted {len(deleted)-1}', delete_after=2)
            except Exception as e:
                await message.edit(content=f'❌ {str(e)[:30]}')
        
        # !status
        elif '!status' in cmd:
            status = cmd.split(' ', 1)[1] if len(cmd.split()) > 1 else 'online'
            await self.change_presence(activity=discord.Game(name=status[:30]))
            await message.edit(content=f'✅ Status: {status}')
        
        # !invisible
        elif '!invisible' in cmd:
            await self.change_presence(status=discord.Status.invisible)
            await message.edit(content='👻 Invisible ON')
        
        # !servers
        elif '!servers' in cmd:
            servers = '\n'.join([f'• {g.name}' for g in self.guilds[:10]])
            await message.edit(content=f'📡 **{len(self.guilds)} servers:**\n{servers}')
        
        # !cleanup
        elif '!cleanup' in cmd:
            gc.collect()
            await message.edit(content='🧹 Memory cleaned')
        
        # Auto-delete command message
        await asyncio.sleep(3)
        try:
            await message.delete()
        except: pass

# Main launcher
async def main():
    print("🚀 **Ultimate Self-Bot**")
    bot = UltimateSelfBot()
    
    try:
        await bot.start(TOKEN)
    except discord.LoginFailure:
        print("\n❌ LOGIN FAILED")
        print("💡 Get FRESH token:")
        print("   1. discord.com → F12 → Network")
        print("   2. Send message → 'messages' → Authorization")
        print("   3. Copy FULL token to Railway")
    except KeyboardInterrupt:
        print("\n👋 Shutdown")
    except Exception as e:
        print(f"💥 {type(e).__name__}: {e}")
    finally:
        await bot.close()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("👋 Exit")
