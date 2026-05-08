import discord
import asyncio
import logging
from datetime import datetime

# ================================
# 🔥 HARDCODED TOKEN - UPDATE THIS!
# ================================
TOKEN = "MTM1MDI5MzQxMzkxNTkxODM2Nw.GEamBH.mg79efUw6-3egtbE1Mww0ltxZryxY-_oJT_0fI"

# ================================
# ✅ QUIET LOGGING (No spam)
# ================================
logging.getLogger('discord.http').setLevel(logging.WARNING)
logging.getLogger('discord.gateway').setLevel(logging.WARNING)

log = logging.getLogger('SelfBot')
logging.basicConfig(level=logging.INFO)

# ================================
# ✅ PROPER SELF-BOT CLIENT
# ================================
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

client = discord.Client(intents=intents)

# ================================
# ✅ EVENTS
# ================================
@client.event
async def on_ready():
    print(f'\n{"="*60}')
    print(f'✅ SELF-BOT **ONLINE** → {client.user}#{client.user.discriminator}')
    print(f'🆔 Account ID: `{client.user.id}`')
    print(f'📊 {len(client.guilds)} servers')
    print(f'🚀 **READY** - Type `!help` to yourself!')
    print(f'{"="*60}')
    
    # Invisible status
    await client.change_presence(status=discord.Status.online)

@client.event
async def on_message(message):
    # Ignore other bots
    if message.author.bot and message.author != client.user:
        return
    
    # ========== SELF COMMANDS (Your messages only) ==========
    if message.author == client.user:
        content = message.content.strip().lower()
        
        # !ping
        if content == '!ping':
            await message.edit(content="🏓 **PONG!** `✓ Connected`")
        
        # !clear
        elif content.startswith('!clear'):
            try:
                amount = int(content.split(maxsplit=1)[1]) if len(content.split()) > 1 else 10
                amount = min(amount, 14)  # Discord limit
                
                deleted = await message.channel.purge(limit=amount)
                await message.channel.send(f'🧹 **Deleted {len(deleted)} messages**', delete_after=2)
            except ValueError:
                await message.reply('❌ **Syntax:** `!clear 5`')
            except discord.Forbidden:
                await message.reply('❌ **No permission**')
        
        # !status  
        elif content.startswith('!status'):
            status_text = content[7:].strip() or "self-bot"
            await client.change_presence(activity=discord.Game(name=status_text))
            await message.edit(content=f'✅ **Status →** `{status_text}`')
        
        # !help
        elif content in ['!help', '!commands']:
            help_msg = '''```
🛠️ SELF-BOT COMMANDS 👇

!ping           → Connection test
!clear [1-14]   → Delete messages  
!status [text]  → Change status
!help           → This help

💡 Type to YOURSELF only!
⚠️ Auto deletes in 3s
```'''
            await message.edit(content=help_msg)
        
        # !servers
        elif content == '!servers':
            server_list = '\n'.join([f'• {g.name} ({g.member_count})' for g in client.guilds])
            await message.edit(content=f'**Servers ({len(client.guilds)}):**\n{server_list}')
        
        # Auto cleanup
        await asyncio.sleep(2)
        try:
            await message.delete()
        except:
            pass
        return
    
    # ========== AUTO RESPONSES ==========
    content = message.content.lower()
    
    # Mention me → React
    if client.user.mentioned_in(message):
        try:
            await message.add_reaction('👋')
            await asyncio.sleep(0.3)
            await message.reply(f"**Hi {message.author.display_name}!** 👋")
        except:
            pass
    
    # Keywords
    elif any(x in content for x in ['hello', 'hi', 'hey']):
        await message.add_reaction('👋')
    elif 'morning' in content or 'gm' in content:
        await message.add_reaction('☀️')
    elif 'night' in content or 'gn' in content:
        await message.add_reaction('🌙')

# ================================
# ✅ CORRECT STARTUP (FIXED!)
# ================================
async def main():
    print("🚀 **SELF-BOT LAUNCHING**")
    print("💡 Commands: Send `!help` to YOURSELF")
    print("⚠️  **HIGH BAN RISK** - Use responsibly!")
    
    try:
        # FIXED: Use run() NOT login()
        await client.start(TOKEN)
    except discord.LoginFailure:
        print("\n❌ **INVALID TOKEN**")
        print("🔧 **FIX:**")
        print("   1. Discord.com → F12 → Network")
        print("   2. Refresh → 'science' request") 
        print("   3. Headers → Authorization → Copy NEW token")
        print("   4. Replace line 12")
    except discord.HTTPException as e:
        print(f"❌ **HTTP {e.status}:** Token revoked!")
    except KeyboardInterrupt:
        print("\n⏹️ **Stopped**")
    except Exception as e:
        print(f"❌ **ERROR:** {type(e).__name__}: {e}")

if __name__ == '__main__':
    asyncio.run(main())
