import discord
import asyncio
import os

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN:
    print("❌ DISCORD_TOKEN not set in Railway")
    exit(1)

print(f"🔥 Self-bot starting... Token length: {len(TOKEN)}")

class SelfBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.all())
    
    async def on_ready(self):
        print(f"""
╔══════════════════════════════════════════════╗
║                ✅ SELF-BOT ONLINE             ║
║                                              ║
║ 👤 {self.user}                               ║
║ 🆔 {self.user.id}                            ║
║ 📡 Connected to {len(self.guilds)} servers    ║
║                                              ║
║ 🎯 DM COMMANDS: !ping !help !clear           ║
╚══════════════════════════════════════════════╝
        """)
        await self.change_presence(status=discord.Status.invisible)
    
    async def on_message(self, message):
        # Only respond to YOUR messages
        if message.author != self.user:
            return
        
        content = message.content.lower()
        
        # !ping
        if '!ping' in content:
            await message.edit(content='🏓 **PONG! Self-bot working!**')
        
        # !help
        elif '!help' in content:
            help_msg = '''🔥 **SELF-BOT COMMANDS** (DM yourself)
!ping           - Test connection
!clear [num]    - Delete messages  
!status [text]  - Change status
!invisible      - Go invisible
!servers        - List servers'''
            await message.edit(content=help_msg)
        
        # !clear
        elif '!clear' in content:
            try:
                count = 10
                parts = content.split()
                if len(parts) > 1:
                    count = int(parts[1])
                deleted = await message.channel.purge(limit=count)
                await message.channel.send(f'🗑️ Deleted {len(deleted)} messages', delete_after=3)
            except:
                await message.reply('❌ Cannot delete')
        
        # !status
        elif '!status' in content:
            status_text = 'self-bot'
            parts = content.split(' ', 1)
            if len(parts) > 1:
                status_text = parts[1]
            await self.change_presence(activity=discord.Game(name=status_text))
            await message.edit(content=f'✅ Status: **{status_text}**')
        
        # !invisible
        elif '!invisible' in content:
            await self.change_presence(status=discord.Status.invisible)
            await message.edit(content='👻 **Invisible mode ON**')
        
        # !servers
        elif '!servers' in content:
            server_list = '\n'.join([f"• {guild.name}" for guild in self.guilds[:10]])
            await message.edit(content=f'📡 **Servers ({len(self.guilds)}):**\n{server_list}')
        
        # Auto-delete command message
        await asyncio.sleep(3)
        try:
            await message.delete()
        except:
            pass

# Launch
async def main():
    bot = SelfBot()
    try:
        await bot.start(TOKEN)
    except discord.LoginFailure:
        print("❌ Invalid token")
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == '__main__':
    asyncio.run(main())
