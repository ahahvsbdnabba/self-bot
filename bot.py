import discord
import asyncio
import aiohttp
import os
import sys
import gc
from discord.ext import commands

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN or len(TOKEN) < 50:
    print("❌ INVALID TOKEN")
    sys.exit(1)

print(f"🔥 Self-bot ready: {len(TOKEN)} chars")

intents = discord.Intents.default()
intents.message_content = True

class UltimateSelfBot(commands.Bot):
    def __init__(self):
        super().__init__('!', intents=intents)
    
    async def test_token(self):
        async with aiohttp.ClientSession() as session:
            async with session.get(
                'https://discord.com/api/v9/users/@me',
                headers={'Authorization': TOKEN}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    print(f"✅ VALID: {data.get('username')}#{data.get('discriminator')}")
                    return True
        return False
    
    async def close(self):
        try:
            await self.http.session.close()
        except: pass
        await super().close()
    
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
        await self.change_presence(status=discord.Status.invisible)
    
    @commands.command()
    async def ping(self, ctx):
        await ctx.message.edit(content='🚀 **100% WORKING!** 🏓')
    
    @commands.command()
    async def help(self, ctx):
        embed = discord.Embed(title="🔥 Self-Bot Commands", color=0x00ff00)
        embed.add_field(name="!ping", value="Test connection", inline=False)
        embed.add_field(name="!clear 10", value="Delete 10 messages", inline=False)
        embed.add_field(name="!status coding", value="Set status", inline=False)
        embed.add_field(name="!invisible", value="Go invisible", inline=False)
        await ctx.message.edit(content=None, embed=embed)
    
    @commands.command()
    async def clear(self, ctx, count: int = 10):
        count = min(count, 100)
        try:
            deleted = await ctx.channel.purge(limit=count)
            await ctx.send(f'🗑️ Deleted {len(deleted)}', delete_after=3)
        except:
            await ctx.send('❌ No permissions', delete_after=3)
    
    @commands.command()
    async def status(self, ctx, *, status: str = "online"):
        await self.change_presence(activity=discord.Game(name=status))
        await ctx.message.edit(content=f'✅ Status: **{status}**')
    
    @commands.command()
    async def invisible(self, ctx):
        await self.change_presence(status=discord.Status.invisible)
        await ctx.message.edit(content='👻 **Invisible ON**')
    
    @commands.command()
    async def servers(self, ctx):
        server_list = [f"• {guild.name}" for guild in self.guilds[:10]]
        await ctx.message.edit(content=f"📡 **{len(self.guilds)} servers:**\n" + "\n".join(server_list))
    
    async def on_message(self, message):
        if message.author != self.user:
            return
        
        await self.process_commands(message)
        
        # Auto-delete
        await asyncio.sleep(3)
        try:
            await message.delete()
        except: pass

async def main():
    print("🚀 **Ultimate Self-Bot**")
    
    bot = UltimateSelfBot()
    
    if not await bot.test_token():
        print("❌ Invalid token")
        return
    
    # Use raw websocket connection
    try:
        await bot.start(TOKEN, bot=False)  # Self-bot mode
    except Exception as e:
        print(f"💥 Gateway error: {e}")
        print("🔄 Trying legacy login...")
        # Fallback
        client = discord.Client(intents=intents)
        await client.start(TOKEN)
    finally:
        await bot.close()

if __name__ == '__main__':
    asyncio.run(main())
