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
        if message.author != self.user:
            return
        
        content = message.content.lower()
        
        # Auto-delete command message after 3 seconds
        asyncio.create_task(self.delete_after(message, 3))
        
        if not content.startswith('.'):
            return
        
        cmd = content[1:].split()[0]
        
        try:
            if cmd == 'ping':
                msg = await message.channel.send('🚀 **Pong!**')
                asyncio.create_task(self.delete_after(msg, 3))
            
            elif cmd == 'help':
                help_text = """
**🔥 Self-Bot Commands (. prefix):**
`.ping` - Test connection
`.clear 10` - Delete 10 own messages
`.status coding` - Set playing status  
`.invisible` - Go invisible
`.servers` - List servers
                """
                msg = await message.channel.send(help_text)
                asyncio.create_task(self.delete_after(msg, 10))
            
            elif cmd == 'clear':
                count = 10
                if len(message.content.split()) > 1:
                    try:
                        count = min(int(message.content.split()[1]), 100)
                    except:
                        count = 10
                deleted = await self.clear_messages(message.channel, count)
                msg = await message.channel.send(f'🗑️ Deleted {len(deleted)} messages')
                asyncio.create_task(self.delete_after(msg, 3))
            
            elif cmd == 'status':
                status_text = 'online'
                if len(message.content.split()) > 1:
                    status_text = ' '.join(message.content.split()[1:])
                await self.change_presence(activity=discord.Game(name=status_text))
                msg = await message.channel.send(f'✅ Status: **{status_text}**')
                asyncio.create_task(self.delete_after(msg, 3))
            
            elif cmd == 'invisible':
                await self.change_presence(status=discord.Status.invisible)
                msg = await message.channel.send('👻 **Invisible ON**')
                asyncio.create_task(self.delete_after(msg, 3))
            
            elif cmd == 'servers':
                servers = [f"• {guild.name}" for guild in self.guilds[:15]]
                server_text = f"📡 **{len(self.guilds)} servers:**\n" + "\n".join(servers)
                msg = await message.channel.send(server_text)
                asyncio.create_task(self.delete_after(msg, 10))
                
        except Exception as e:
            error_msg = await message.channel.send(f'❌ Error: {str(e)}')
            asyncio.create_task(self.delete_after(error_msg, 5))
    
    async def clear_messages(self, channel, limit=10):
        deleted = []
        async for msg in channel.history(limit=limit*2):
            if msg.author == self.user:
                try:
                    await msg.delete()
                    deleted.append(msg)
                    if len(deleted) >= limit:
                        break
                except:
                    pass
        return deleted
    
    async def delete_after(self, msg, delay):
        await asyncio.sleep(delay)
        try:
            await msg.delete()
        except:
            pass

async def main():
    print("🚀 Starting Self-Bot...")
    
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
