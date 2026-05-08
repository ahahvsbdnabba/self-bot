import discord
import asyncio
import logging
from datetime import datetime

# ================================
# 🔥 HARDCODED TOKEN (CHANGE THIS!)
# ================================
TOKEN = "MTM1MDI5MzQxMzkxNTkxODM2Nw.GEamBH.mg79efUw6-3egtbE1Mww0ltxZryxY-_oJT_0fI"  # ← YOUR TOKEN HERE

# ================================
# ✅ LOGGING
# ================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('SelfBot')

# ================================
# ✅ SELF-BOT CLIENT
# ================================
intents = discord.Intents.all()
client = discord.Client(intents=intents)

# ================================
# ✅ EVENTS
# ================================
@client.event
async def on_ready():
    print(f'\n{"="*50}')
    print(f'✅ Self-bot logged in: {client.user}')
    print(f'🆔 ID: {client.user.id}')
    print(f'📱 Servers: {len(client.guilds)}')
    print(f'👥 Status: Online')
    print(f'🚀 READY - Send !help to yourself!')
    print(f'{"="*50}')
    
    await client.change_presence(
        status=discord.Status.online,
        activity=discord.Game(name="🛠️ Self-bot | !help")
    )

@client.event
async def on_message(message):
    if message.author == client.user:
        # ========== SELF COMMANDS ==========
        content = message.content.lower().strip()
        
        if content == '!ping':
            await message.edit(content="🏓 **PONG!**")
            await asyncio.sleep(1)
            await message.delete()
        
        elif content.startswith('!clear'):
            try:
                parts = content.split()
                amount = int(parts[1]) if len(parts) > 1 else 10
                amount = min(amount, 100)  # Safety limit
                
                deleted = await message.channel.purge(limit=amount)
                await message.channel.send(f"🧹 **Cleared {len(deleted)} messages**", delete_after=2)
            except:
                await message.reply("❌ **Invalid number!** `!clear 10`")
        
        elif content.startswith('!status'):
            status_text = content[7:].strip() or "🛠️ Self-bot"
            await client.change_presence(activity=discord.Game(name=status_text))
            await message.edit(content=f"✅ **Status:** {status_text}")
        
        elif content == '!help':
            help_msg = """```
🛠️ SELF-BOT COMMANDS (send to YOURSELF):

!ping          → Test response
!clear 10      → Delete 10 messages  
!clear         → Delete 10 (default)
!status text   → Change status
!help          → This help
!info          → Bot info

⚠️ Auto-deletes after 3s
```"""
            await message.edit(content=help_msg)
        
        elif content == '!info':
            info = f"""
**Self-bot Info:**
👤 `{client.user}`
🆔 `{client.user.id}`
📊 `{len(client.guilds)}` servers
💬 `{len([ch for g in client.guilds for ch in g.text_channels])}` channels
⏰ Online since: <t:{int(client.user.created_at.timestamp())}:F>
"""
            await message.edit(content=info)
        
        # Auto-delete commands after 3 seconds
        await asyncio.sleep(3)
        try:
            await message.delete()
        except:
            pass
    
    else:
        # ========== AUTO-RESPONSES ==========
        content = message.content.lower()
        author = message.author
        
        # Mention response
        if client.user.mentioned_in(message) and not message.reference:
            try:
                await message.delete()
                await asyncio.sleep(0.5)
                reply = f"**Hi {author.mention}!** How can I help you? 😊"
                await message.channel.send(reply)
            except discord.Forbidden:
                await message.channel.send(f"**Hi {author.mention}!** How can I help? 😊")
        
        # Keyword reactions
        elif any(word in content for word in ['hello', 'hi', 'hey']):
            await message.add_reaction('👋')
        
        elif 'morning' in content or 'gm' in content:
            await message.add_reaction('🌅')
        
        elif 'night' in content or 'gn' in content:
            await message.add_reaction('🌙')
        
        elif 'love' in content:
            await message.add_reaction('❤️')

@client.event
async def on_member_join(member):
    """Welcome new members"""
    for channel in member.guild.text_channels:
        if channel.name in ['general', 'welcome', 'lounge']:
            try:
                await channel.send(f"🎉 **Welcome {member.mention}** to **{member.guild.name}**!")
                break
            except:
                pass

@client.event
async def on_voice_state_update(member, before, after):
    """Voice status"""
    if before.channel is None and after.channel:
        print(f"🔊 {member} joined voice: {after.channel.name}")
    elif after.channel is None and before.channel:
        print(f"🔇 {member} left voice: {before.channel.name}")

# ================================
# ✅ MAIN LOOP
# ================================
async def main():
    print("🚨 **SELF-BOT STARTING** (High ban risk!)")
    print("💡 **USAGE:** Send `!help` to YOURSELF")
    print("⚠️  **CHANGE TOKEN IMMEDIATELY** after testing!")
    
    try:
        await client.start(TOKEN)
    except discord.LoginFailure:
        print("❌ **INVALID TOKEN!**")
        print("💡 Get new token: F12 → Network → Authorization header")
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
    except Exception as e:
        print(f"❌ **ERROR:** {e}")

# 🔥 RUN IT
if __name__ == '__main__':
    asyncio.run(main())
