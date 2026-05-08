import discord
import asyncio
import aiohttp
import os
import sys
import re

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN or len(TOKEN) < 50:
    print("❌ INVALID TOKEN")
    sys.exit(1)

class SelfBot(discord.Client):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
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
    
    async def on_message(self, message):
        # Ignore other users
        if message.author != self.user:
            return
        
        content = message.content.lower()
        
        # Auto-delete all own messages after 3 seconds
        asyncio.create_task(self.delete_after(message, 3))
        
        # Command handling (prefix: .)
        if not content.startswith('.'):
            return
        
        cmd = content[1:].split()[0]  # Get command name
        
        try:
            if cmd == 'ping':
                await message.reply('🚀 **Pong!**', delete_after=3)
            
            elif cmd == 'help':
                help_text = """
**🔥 Self-Bot Commands (. prefix):**
`.ping` - Test connection
`.clear 10` - Delete 10 own messages
`.status coding` - Set playing status  
`.invisible` - Go invisible
`.servers` - List servers
                """
                await message.reply(help_text, delete_after=10)
            
            elif cmd == 'clear':
                count = 10
                if len(message.content.split()) > 1:
                    try:
                        count = min(int(message.content.split()[1]), 100)
                    except:
                        count = 10
                deleted = await self.clear_messages(message.channel, count)
                await message.reply(f'🗑️ Deleted {len(deleted)} messages', delete_after=3)
            
            elif cmd == 'status':
                status_text = 'online'
                if len(message.content.split()) > 1:
                    status_text = ' '.join(message.content.split()[1:])
                await self.change_presence(activity=discord.Game(name=status_text))
                await message.reply(f'✅ Status: **{status_text}**', delete_after=3)
            
            elif cmd == 'invisible':
                await self.change_presence(status=discord.Status.invisible)
                await message.reply('👻 **Invisible ON**', delete_after=3)
            
            elif cmd == 'servers':
                servers = [f"• {guild.name}" for guild in self.guilds[:15]]
                server_text = f"📡 **{len(self.guilds)} servers:**\n" + "\n".join(servers)
                await message.reply(server_text, delete_after=10)
                
        except Exception as e:
            await message.reply(f'❌ Error: {str(e)}', delete_after=5)
    
    async def clear_messages(self, channel, limit=10):
        """Delete own messages from channel"""
        deleted = []
        async for message in channel.history(limit=limit*2):
            if message.author == self.user:
                try:
                    await message.delete()
                    deleted.append(message)
                    if len(deleted) >= limit:
                        break
                except:
                    pass
        return deleted
    
    async def delete_after(self, message, delay):
        """Delete message after delay"""
        await asyncio.sleep(delay)
        try:
            await message.delete()
        except:
            pass

async def main():
    print("🚀 Starting Self-Bot...")
    
    # Test token
    async with aiohttp.ClientSession() as session:
        async with session.get(
            'https://discord.com/api/v9/users/@me',
            headers={'Authorization': TOKEN}
        ) as resp:
            if resp.status != 200:
                print("❌ Token invalid")
                return
            data = await resp.json()
            print(f"✅ VALID: {data.get('username')}#{data.get('discriminator')}")
    
    bot = SelfBot()
    
    try:
        await bot.start(TOKEN)
    except discord.LoginFailure:
        print("❌ LOGIN FAILED - Token invalid or self-bot blocked")
    except Exception as e:
        print(f"💥 Error: {e}")
    finally:
        await bot.close()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Shutdown")
