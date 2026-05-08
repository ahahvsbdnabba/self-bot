import discord
import asyncio
import aiohttp
import os
import sys
from discord.ext import commands

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN or len(TOKEN) < 50:
    print("❌ INVALID TOKEN")
    sys.exit(1)

intents = discord.Intents.default()
intents.message_content = True

class SelfBot(discord.Client):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.bg_task = None
    
    async def test_token(self):
        """Test token validity"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                'https://discord.com/api/v9/users/@me',
                headers={'Authorization': f'Bot {TOKEN}' if TOKEN.startswith('Bot ') else TOKEN}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ VALID: {data.get('username')}#{data.get('discriminator')}")
                    return True
        return False
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════════════╗
║                ✅ LIVE & READY               ║
║                                              ║
║ 👤 {self.user}                               ║
║ 🆔 {self.user.id}                            ║
║ 📡 {len(self.guilds)} servers                ║
╚══════════════════════════════════════════════╝
        """)
        # Set invisible status
        await self.change_presence(status=discord.Status.invisible)
        
        # Auto-delete command messages
        self.bg_task = self.loop.create_task(self.auto_delete_commands())
    
    async def auto_delete_commands(self):
        """Auto-delete command messages after 3 seconds"""
        while not self.is_closed():
            try:
                await asyncio.sleep(1)
            except:
                break
    
    async def on_message(self, message):
        if message.author != self.user:
            return
            
        # Process commands (prefix: .)
        if message.content.startswith('.'):
            await self.process_commands(message)
            
            # Auto-delete after 3 seconds
            await asyncio.sleep(3)
            try:
                await message.delete()
            except:
                pass

# Commands cog
class Commands(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command()
    async def ping(self, ctx):
        await ctx.send('🚀 **Pong!**', delete_after=3)
    
    @commands.command()
    async def clear(self, ctx, count: int = 10):
        count = min(count, 100)
        try:
            deleted = await ctx.channel.purge(limit=count, check=lambda m: m.author == ctx.me)
            await ctx.send(f'🗑️ Deleted {len(deleted)} messages', delete_after=3)
        except discord.Forbidden:
            await ctx.send('❌ No permissions', delete_after=3)
    
    @commands.command()
    async def status(self, ctx, *, status: str = "online"):
        await self.bot.change_presence(activity=discord.Game(name=status))
        await ctx.send(f'✅ Status: **{status}**', delete_after=3)
    
    @commands.command()
    async def invisible(self, ctx):
        await self.bot.change_presence(status=discord.Status.invisible)
        await ctx.send('👻 **Invisible ON**', delete_after=3)

async def main():
    print("🚀 Starting Self-Bot...")
    
    # Test token first
    async with aiohttp.ClientSession() as session:
        async with session.get('https://discord.com/api/v9/users/@me', 
                             headers={'Authorization': TOKEN}) as resp:
            if resp.status != 200:
                print("❌ Token invalid or rate-limited")
                return
    
    bot = SelfBot(intents=intents, command_prefix='.')
    bot.add_cog(Commands(bot))
    
    try:
        await bot.start(TOKEN)  # No bot=False parameter
    except discord.LoginFailure:
        print("❌ Login failed - Token invalid or self-bot detected")
    except Exception as e:
        print(f"💥 Error: {e}")
    finally:
        await bot.close()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Shutdown")
