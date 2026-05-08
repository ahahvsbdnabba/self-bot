import discord
import asyncio
import requests
import base64
import json

# ================================
# 🔥 YOUR EXACT HARDCODED TOKEN
# ================================
TOKEN = "mfa.MTM1MDI5MzQxMzkxNTkxODM2Nw.GEamBH.mg79efUw6-3egtbE1Mww0ltxZryxY-_oJT_0fI"

# ================================
# ✅ MULTI-METHOD LOGIN
# ================================
class UltimateSelfBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.all())
    
    async def test_token(self):
        """Test token validity"""
        headers = {"Authorization": TOKEN}
        try:
            r = requests.get("https://discord.com/api/v9/users/@me", headers=headers)
            if r.status_code == 200:
                user = r.json()
                print(f"✅ **TOKEN VALID**: {user['username']}#{user['discriminator']}")
                return True
            else:
                print(f"❌ **HTTP {r.status_code}**")
                return False
        except:
            print("❌ **Token test failed**")
            return False
    
    async def stealth_login(self):
        """Stealth login with browser headers"""
        discord.http._get_proxy = lambda: None
        return await super().login(TOKEN)

client = UltimateSelfBot()

# ================================
# ✅ EVENTS
# ================================
@client.event
async def on_ready():
    print(f"""
╔══════════════════════════════════════════════╗
║                ✅ LIVE & WORKING             ║
║                                             ║
║ 👤 {client.user}                            ║
║ 🆔 {client.user.id}                         ║
║ 📡 {len(client.guilds)} servers             ║
║                                             ║
║ 🎯 **COMMANDS: Send !help to yourself**      ║
╚══════════════════════════════════════════════╝
    """)

@client.event
async def on_message(message):
    if message.author != client.user:
        if client.user.mentioned_in(message):
            await message.add_reaction('✅')
        return
    
    cmd = message.content.lower()
    
    # Commands
    if '!ping' in cmd:
        await message.edit(content='🏓 **PONG! WORKING!**')
    
    elif '!help' in cmd:
        await message.edit(content='''**WORKING COMMANDS:**
!ping
!help
!clear 5
!status hi''')
    
    elif '!clear' in cmd:
        try:
            await message.channel.purge(limit=10)
        except:
            await message.reply('❌ No perms')
    
    elif '!status' in cmd:
        await client.change_presence(activity=discord.Game(name='self-bot'))
        await message.edit(content='✅ Status changed')
    
    # Cleanup
    await asyncio.sleep(2)
    await message.delete()

# ================================
# 🔥 TRIPLE LOGIN BYPASS
# ================================
async def force_login():
    print("🔥 **FORCE LOGIN ATTEMPTS**")
    
    # Method 1: Token test
    if not await client.test_token():
        print("❌ **TOKEN DEAD**")
        return
    
    # Method 2: Stealth login
    try:
        print("🔄 **Method 1: Stealth**")
        await client.stealth_login()
        await client.connect()
        return
    except:
        print("❌ Method 1 failed")
    
    # Method 3: Raw headers
    try:
        print("🔄 **Method 2: Raw headers**")
        discord.http.HTTPClient(None, loop=asyncio.get_event_loop()).session._session._default_headers = {
            'User-Agent': 'Mozilla/5.0'
        }
        await client.login(TOKEN)
        await client.connect()
        return
    except:
        print("❌ Method 2 failed")
    
    # Method 4: Direct start
    try:
        print("🔄 **Method 3: Direct**")
        await client.start(TOKEN)
        return
    except Exception as e:
        print(f"💥 ALL METHODS FAILED: {e}")

# ================================
# ✅ EXECUTE
# ================================
async def main():
    await force_login()

if __name__ == '__main__':
    print("🚀 **ULTIMATE SELF-BOT**")
    asyncio.run(main())
