import discord
import asyncio
import aiohttp
import os
import gc
import ssl

# Global aiohttp cleanup
aiohttp.client.DEFAULT_CLEANUP_CLOSED = True

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN:
    print("❌ No DISCORD_TOKEN in Railway variables")
    exit(1)

# ✅ AUTO-FIX Railway Token (removes 'Bot ' prefix)
if TOKEN.startswith('Bot '):
    print("🔧 Auto-fixing Railway token (removed 'Bot ' prefix)")
    TOKEN = TOKEN[4:]

print(f"🔥 Self-bot starting... Token length: {len(TOKEN)}")
print(f"🔍 Token preview: {TOKEN[:10]}...{TOKEN[-10:]}")

class UltimateSelfBot(discord.Client):
    def __init__(self):
        # ✅ PERFECT connector - NO ERRORS
        connector = aiohttp.TCPConnector(
            limit=5,
            limit_per_host=5,
            ttl_dns_cache=300,
            force_close=True,
            enable_cleanup_closed=True,
            use_dns_cache=True,
            ssl=ssl.create_default_context()
        )
        super().__init__(
            intents=discord.Intents.all(),
            connector=connector,
            heartbeat_timeout=60.0,
            max_messages=1000
        )
    
    async def close(self):
        """Force cleanup ALL connections"""
        try:
            if self.http and self.http.session:
                await self.http.session.close()
        except:
            pass
        await super().close()
        gc.collect()
        print("🧹 All connections cleaned")
    
    async def on_connect(self):
        print("🔗 Connected to Discord gateway")
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════════════╗
║                ✅ SELF-BOT LIVE               ║
║                                              ║
║ 👤 {self.user}                               ║
║ 🆔 {self.user.id}                            ║
║ 📡 {len(self.guilds)} servers                ║
║                                              ║
║ 🎯 **DM yourself: !ping !help !clear**        ║
╚══════════════════════════════════════════════╝
        """)
        await self.change_presence(status=discord.Status.invisible)
    
    async def on_message(self, message):
        if message.author != self.user:
            if self.user.mentioned_in(message):
                try:
                    await message.add_reaction('✅')
                except:
                    pass
            return
        
        cmd = message.content.lower().strip()
        
        if '!ping' in cmd:
            await message.edit(content='🚀 **SELF-BOT + Railway 100% WORKING!**')
        
        elif '!help' in cmd:
            help_text = '''🔥 **SELF-BOT COMMANDS** (DM yourself)

`!ping`          Test connection
`!clear 10`      Delete 10 messages
`!status coding` Change status  
`!invisible`     Go invisible
`!servers`       List servers
`!cleanup`       Force cleanup'''
            await message.edit(content=help_text)
        
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
        
        elif '!status' in cmd:
            status_text = 'self-bot'
            parts = cmd.split(' ', 1)
            if len(parts) > 1:
                status_text = parts[1][:50]
            await self.change_presence(activity=discord.Game(name=status_text))
            await message.edit(content=f'✅ **Status:** {status_text}')
        
        elif '!invisible' in cmd:
            await self.change_presence(status=discord.Status.invisible)
            await message.edit(content='👻 **Invisible mode ON**')
        
        elif '!servers' in cmd:
            servers = [guild.name for guild in self.guilds[:15]]
            server_text = '\n'.join([f'• {s}' for s in servers])
            await message.edit(content=f'📡 **Servers ({len(self.guilds)}):**\n{server_text}')
        
        elif '!cleanup' in cmd:
            gc.collect()
            await message.edit(content='🧹 **Memory cleaned**')
        
        await asyncio.sleep(3)
        try:
            await message.delete()
        except:
            pass

async def main():
    print("🚀 **Ultimate Self-Bot with Railway**")
    bot = UltimateSelfBot()
    
    try:
        await bot.start(TOKEN)
    except discord.LoginFailure:
        print("❌ **LOGIN FAILED** - Token format still wrong!")
        print("💡 Use Discord F12 → Network → Authorization (no 'Bot ' prefix)")
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
    except Exception as e:
        print(f"💥 **ERROR:** {e}")
    finally:
        await bot.close()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("👋 Exit")
