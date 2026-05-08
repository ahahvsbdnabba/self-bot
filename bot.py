import discord
import asyncio
import os
import random
from discord.ext import commands

# ================================
# 🔥 TOKEN FROM RAILWAY ENV VAR
# ================================
TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN:
    print("❌ Set DISCORD_TOKEN in Railway Variables")
    exit(1)

class SelfBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.all())
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════════════╗
║              🔥 SELF-BOT LIVE                 ║
║                                              ║
║ 👤 {self.user}                               ║
║ 🆔 {self.user.id}                            ║
║ 📡 {len(self.guilds)} servers                ║
║                                              ║
║ ⚠️  TOS VIOLATION - USE AT OWN RISK          ║
╚══════════════════════════════════════════════╝
        """)
        
        # Stealth status
        await self.change_presence(status=discord.Status.invisible)
    
    async def on_message(self, message):
        if message.author != self.user:
            # Auto-react to your mentions
            if self.user.mentioned_in(message):
                await message.add_reaction('👍')
            return
        
        content = message.content.lower()
        
        # DM Commands (send to yourself)
        if '!ping' in content:
            await message.edit(content='🏓 **Pong! Self-bot working**')
        
        elif '!clear' in content:
            try:
                count = 10
                if content.split()[1:]:
                    count = int(content.split()[1])
                deleted = await message.channel.purge(limit=count)
                await message.channel.send(f'🗑️ Deleted {len(deleted)} messages', delete_after=3)
            except:
                await message.reply('❌ No permission')
        
        elif '!status' in content:
            statuses = ['coding', 'gaming', 'music', 'streaming']
            status = random.choice(statuses)
            await self.change_presence(activity=discord.Game(name=status))
            await message.edit(content=f'✅ Status: **{status}**')
        
        elif '!invisible' in content:
            await self.change_presence(status=discord.Status.invisible)
            await message.edit(content='👻 **Invisible mode ON**')
        
        elif '!help' in content:
            help_text = '''🔥 **SELF-BOT COMMANDS** (DM yourself)
!ping
!clear [num]
!status
!invisible  
!spam [text] [count]
!deleteall'''
            await message.edit(content=help_text)
        
        elif '!spam' in content:
            parts = content.split(' ', 2)
            if len(parts) >= 3:
                text = parts[2]
                count = int(parts[1])
                for _ in range(count):
                    await message.channel.send(text)
                await message.delete()
        
        elif '!deleteall' in content:
            async for msg in message.channel.history(limit=100):
                if msg.author == self.user:
                    try:
                        await msg.delete()
                    except:
                        pass
            await message.delete()
        
        # Auto-delete command after 3s
        await asyncio.sleep(3)
        try:
            await message.delete()
        except:
            pass

# ================================
# 🚀 STEALTH LAUNCH
# ================================
async def main():
    print("🔥 **Launching Self-Bot...**")
    selfbot = SelfBot()
    
    try:
        await selfbot.start(TOKEN)
    except discord.LoginFailure:
        print("❌ **INVALID TOKEN**")
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == '__main__':
    asyncio.run(main())
