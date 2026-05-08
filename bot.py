import discord
import asyncio
import os
import aiohttp
import gc

TOKEN = os.getenv('DISCORD_TOKEN')
print(f"🔥 Token loaded: {len(TOKEN)} chars")

class UltimateSelfBot(discord.Client):
    def __init__(self):
        # FIXED: Clean connector
        connector = aiohttp.TCPConnector(
            limit=1,
            limit_per_host=1,
            force_close=True,
            enable_cleanup_closed=True
        )
        super().__init__(intents=discord.Intents.all(), connector=connector)
    
    async def test_token(self):
        """Quick token test"""
        async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(limit=1)) as session:
            async with session.get(
                "https://discord.com/api/v9/users/@me", 
                headers={"Authorization": TOKEN}
            ) as r:
                if r.status == 200:
                    data = await r.json()
                    print(f"✅ **TOKEN VALID**: {data['username']}#{data['discriminator']}")
                    return True
        return False
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════════════╗
║                ✅ LIVE & WORKING             ║
║                                             ║
║ 👤 {self.user}                            ║
║ 🆔 {self.user.id}                         ║
║ 📡 {len(self.guilds)} servers             ║
║                                             ║
║ 🎯 **Send !help to yourself**               ║
╚══════════════════════════════════════════════╝
        """)
        await self.change_presence(status=discord.Status.invisible)
    
    async def on_message(self, message):
        if message.author != self.user:
            if self.user.mentioned_in(message):
                await message.add_reaction('✅')
            return
        
        cmd = message.content.lower()
        
        if '!ping' in cmd:
            await message.edit(content='🏓 **PONG! WORKING!**')
        
        elif '!help' in cmd:
            await message.edit(content='''**COMMANDS:**
!ping
!help  
!clear 5
!status hi
!invisible''')
        
        elif '!clear' in cmd:
            try:
                count = 10
                if cmd.split()[1:]:
                    count = int(cmd.split()[1])
                await message.channel.purge(limit=count)
            except:
                await message.reply('❌ No perms')
        
        elif '!status' in cmd:
            await self.change_presence(activity=discord.Game(name='self-bot'))
            await message.edit(content='✅ Status changed')
        
        elif '!invisible' in cmd:
            await self.change_presence(status=discord.Status.invisible)
            await message.edit(content='👻 Invisible')
        
        await asyncio.sleep(2)
        await message.delete()

# ================================
# FIXED CLEAN LOGIN
# ================================
async def force_login():
    print("🔥 **FORCE LOGIN**")
    
    if not await UltimateSelfBot().test_token():
        print("❌ **TOKEN DEAD**")
        return
    
    client = UltimateSelfBot()
    
    try:
        # Clean session
        await client.login(TOKEN)
        await client.connect()
    except Exception as e:
        print(f"💥 LOGIN ERROR: {e}")
        # Force cleanup
        gc.collect()

if __name__ == '__main__':
    print("🚀 **ULTIMATE SELF-BOT**")
    asyncio.run(force_login())
