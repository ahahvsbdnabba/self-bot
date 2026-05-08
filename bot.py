import discord
import asyncio
import aiohttp
import os
import sys
import re
import random
from datetime import datetime, timedelta

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN or len(TOKEN) < 50:
    print("❌ INVALID TOKEN")
    sys.exit(1)

class SelfBot(discord.Client):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.command_prefix = '.'
        self.auto_replies = {}  # dict: trigger_lower -> response
    
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
        # Ignore own messages for processing commands (except mention reply)
        if message.author == self.user:
            return
        
        # Auto-reply when mentioned (but not if you already have an autoreply for that)
        if self.user in message.mentions:
            await message.reply("Hello, I will be with you shortly!")
            return
        
        # Auto-replies (trigger-based)
        content_lower = message.content.lower().strip()
        for trigger, response in self.auto_replies.items():
            if trigger in content_lower:
                await message.reply(response)
                return  # only one autoreply per message
        
        # Command processing
        if not content_lower.startswith(self.command_prefix):
            return
        
        cmd = content_lower[1:].split()[0].lower()
        args = message.content[len(self.command_prefix)+len(cmd):].strip()
        
        try:
            # ── AutoReply System ──
            if cmd == 'autoreply':
                if not args:
                    await self.show_help(message, 'autoreply')
                    return
                parts = args.split('|', 1)
                action = parts[0].strip().lower()
                if action == 'list':
                    if not self.auto_replies:
                        await message.reply("No auto-replies set.")
                    else:
                        reply_list = "\n".join([f"• `{k}` → {v[:50]}" for k, v in self.auto_replies.items()])
                        await message.reply(f"**Auto-replies ({len(self.auto_replies)}):**\n{reply_list}")
                elif action == 'remove':
                    if len(parts) < 2:
                        await message.reply("Usage: `.autoreply remove <trigger>`")
                        return
                    trigger = parts[1].strip().lower()
                    if trigger in self.auto_replies:
                        del self.auto_replies[trigger]
                        await message.reply(f"✅ Removed auto-reply for `{trigger}`")
                    else:
                        await message.reply(f"❌ No auto-reply for `{trigger}`")
                elif action == 'clear':
                    self.auto_replies.clear()
                    await message.reply("✅ All auto-replies cleared.")
                else:
                    # Set new autoreply: trigger | response
                    if len(parts) < 2:
                        await message.reply("Usage: `.autoreply <trigger> | <response>`")
                        return
                    trigger = parts[0].strip().lower()
                    response = parts[1].strip()
                    self.auto_replies[trigger] = response
                    await message.reply(f"✅ Auto-reply set: `{trigger}` → \"{response[:50]}{'...' if len(response)>50 else ''}\"")
            
            # ── Ping / PingUser ──
            elif cmd in ('pinguser', 'ping'):
                if not message.mentions:
                    await message.reply("❌ Mention someone! `.pinguser @user Hello`")
                    return
                user = message.mentions[0]
                ping_msg = args.replace(message.mentions[0].mention, '').strip() if message.mentions else ''
                if ping_msg:
                    await message.channel.send(f"{user.mention} {ping_msg}")
                else:
                    await message.channel.send(f"{user.mention}")
            
            # ── Massping ──
            elif cmd == 'massping':
                parts = args.split()
                if len(parts) < 2:
                    await message.reply("Usage: `.massping <count> @user`")
                    return
                try:
                    count = int(parts[0])
                except:
                    await message.reply("❌ Invalid count.")
                    return
                target = message.mentions[0] if message.mentions else None
                if not target:
                    await message.reply("❌ Mention someone.")
                    return
                if count > 10:
                    await message.reply("❌ Max 10 pings allowed.")
                    return
                for _ in range(count):
                    await message.channel.send(f"{target.mention}")
                    await asyncio.sleep(0.3)
                await message.delete()
            
            # ── DM ──
            elif cmd == 'dm':
                if not message.mentions:
                    await message.reply("❌ Mention someone! `.dm @user hello`")
                    return
                user = message.mentions[0]
                dm_text = args.replace(message.mentions[0].mention, '').strip()
                if not dm_text:
                    await message.reply("❌ Add a message.")
                    return
                try:
                    await user.send(dm_text)
                    await message.reply(f"✉️ DM sent to {user.mention}")
                except:
                    await message.reply("❌ Could not DM that user.")
            
            # ── Everyone ──
            elif cmd == 'everyone':
                if not args:
                    await message.reply("Usage: `.everyone <message>`")
                    return
                await message.channel.send(f"@everyone {args}")
            
            # ── MentionRole ──
            elif cmd == 'mentionrole':
                # Find role from args before first space
                parts = args.split(maxsplit=1)
                if len(parts) < 2:
                    await message.reply("Usage: `.mentionrole <role name> <message>`")
                    return
                role_name = parts[0].strip()
                role_msg = parts[1].strip()
                if not message.guild:
                    await message.reply("❌ This only works in a server.")
                    return
                role = discord.utils.get(message.guild.roles, name=role_name)
                if not role:
                    await message.reply(f"❌ Role `{role_name}` not found.")
                    return
                await message.channel.send(f"{role.mention} {role_msg}")
            
            # ── Nick ──
            elif cmd == 'nick':
                if not args:
                    await message.reply("Usage: `.nick <new nickname>`")
                    return
                if not message.guild:
                    await message.reply("❌ This only works in a server.")
                    return
                try:
                    await message.guild.me.edit(nick=args[:32])
                    await message.reply(f"✅ Nickname changed to `{args[:32]}`")
                except:
                    await message.reply("❌ Cannot change nickname (missing permissions).")
            
            # ── React ──
            elif cmd == 'react':
                if not args:
                    await message.reply("Usage: `.react 😊`")
                    return
                # React to the last bot message in channel
                async for msg in message.channel.history(limit=5):
                    if msg.author == self.user and msg.id != message.id:
                        try:
                            await msg.add_reaction(args.strip())
                            await message.reply("✅ Reacted.")
                        except:
                            await message.reply("❌ Invalid emoji.")
                        return
                await message.reply("❌ No bot message found to react to.")
            
            # ── Slowmode ──
            elif cmd == 'slowmode':
                if not args:
                    await message.reply("Usage: `.slowmode <seconds>`")
                    return
                try:
                    seconds = int(args)
                    if seconds < 0 or seconds > 21600:
                        await message.reply("❌ Must be between 0 and 21600.")
                        return
                    await message.channel.edit(slowmode_delay=seconds)
                    await message.reply(f"✅ Slowmode set to {seconds}s")
                except:
                    await message.reply("❌ Invalid number.")
            
            # ── Purge (delete own messages only) ──
            elif cmd == 'purge':
                count = 10
                if args:
                    try:
                        count = min(int(args.split()[0]), 100)
                    except:
                        count = 10
                deleted = await self.clear_messages(message.channel, count)
                await message.reply(f'🗑️ Deleted {len(deleted)} messages', delete_after=5)
            
            # ── Channel Topic ──
            elif cmd == 'topic':
                if not args:
                    await message.reply("Usage: `.topic <new topic>`")
                    return
                try:
                    await message.channel.edit(topic=args[:1024])
                    await message.reply("✅ Channel topic updated.")
                except:
                    await message.reply("❌ Cannot change topic.")
            
            # ── Channel Rename ──
            elif cmd == 'rename':
                if not args:
                    await message.reply("Usage: `.rename <new name>`")
                    return
                try:
                    await message.channel.edit(name=args[:100].replace(' ', '-').lower())
                    await message.reply("✅ Channel renamed.")
                except:
                    await message.reply("❌ Cannot rename.")
            
            # ── Copy last message of a user ──
            elif cmd == 'copy':
                if not message.mentions:
                    await message.reply("❌ Mention someone! `.copy @user`")
                    return
                user = message.mentions[0]
                async for msg in message.channel.history(limit=50):
                    if msg.author == user:
                        await message.channel.send(f"**{user.display_name} said:** {msg.content}")
                        return
                await message.reply("❌ No recent message from that user.")
            
            # ── Steal Emoji ──
            elif cmd == 'stealemoji':
                # Expects custom emoji like :emoji: or <:name:id>
                if not args:
                    await message.reply("Usage: `.stealemoji <emoji>`")
                    return
                # Extract emoji ID from custom emoji
                match = re.match(r'<a?:(\w+):(\d+)>', args.strip())
                if not match:
                    await message.reply("❌ That's not a custom emoji. Use the emoji itself.")
                    return
                name = match.group(1)
                emoji_id = match.group(2)
                url = f"https://cdn.discordapp.com/emojis/{emoji_id}.png"
                if not message.guild:
                    await message.reply("❌ This only works in a server.")
                    return
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as resp:
                        if resp.status != 200:
                            await message.reply("❌ Could not fetch emoji image.")
                            return
                        image_data = await resp.read()
                try:
                    await message.guild.create_custom_emoji(name=name, image=image_data)
                    await message.reply(f"✅ Emoji `:{name}:` added to this server.")
                except discord.Forbidden:
                    await message.reply("❌ No permission to create emojis.")
                except:
                    await message.reply("❌ Failed to add emoji.")
            
            # ── Guilds list ──
            elif cmd == 'guilds':
                guilds = [f"• {guild.name} ({guild.member_count})" for guild in self.guilds[:20]]
                await message.reply(f"📡 **I'm in {len(self.guilds)} servers:**\n" + "\n".join(guilds))
            
            # ── Channel info ──
            elif cmd == 'channelinfo':
                ch = message.channel
                embed = discord.Embed(title=f"# {ch.name}", color=0x00ff00)
                embed.add_field(name="🆔 ID", value=ch.id, inline=True)
                embed.add_field(name="📌 Type", value=str(ch.type), inline=True)
                if hasattr(ch, 'topic') and ch.topic:
                    embed.add_field(name="📋 Topic", value=ch.topic[:100], inline=False)
                embed.add_field(name="👥 Category", value=ch.category.name if ch.category else "None", inline=True)
                embed.add_field(name="⏱️ Slowmode", value=f"{ch.slowmode_delay}s" if ch.slowmode_delay else "Off", inline=True)
                await message.reply(embed=embed)
            
            # ── Role Add / Remove ──
            elif cmd == 'roleadd':
                parts = args.split(maxsplit=1)
                if len(parts) < 2 or not message.mentions:
                    await message.reply("Usage: `.roleadd @user @role`")
                    return
                user = message.mentions[0]
                role_name = parts[1].strip()
                if not message.guild:
                    await message.reply("❌ This only works in a server.")
                    return
                role = discord.utils.get(message.guild.roles, name=role_name)
                if not role:
                    # Try by ID
                    try:
                        role_id = int(role_name)
                        role = message.guild.get_role(role_id)
                    except:
                        pass
                if not role:
                    await message.reply(f"❌ Role `{role_name}` not found.")
                    return
                try:
                    await user.add_roles(role)
                    await message.reply(f"✅ Added {role.mention} to {user.mention}")
                except:
                    await message.reply("❌ Cannot add role.")
            
            elif cmd == 'roleremove':
                parts = args.split(maxsplit=1)
                if len(parts) < 2 or not message.mentions:
                    await message.reply("Usage: `.roleremove @user @role`")
                    return
                user = message.mentions[0]
                role_name = parts[1].strip()
                if not message.guild:
                    await message.reply("❌ This only works in a server.")
                    return
                role = discord.utils.get(message.guild.roles, name=role_name)
                if not role:
                    try:
                        role_id = int(role_name)
                        role = message.guild.get_role(role_id)
                    except:
                        pass
                if not role:
                    await message.reply(f"❌ Role `{role_name}` not found.")
                    return
                try:
                    await user.remove_roles(role)
                    await message.reply(f"✅ Removed {role.mention} from {user.mention}")
                except:
                    await message.reply("❌ Cannot remove role.")
            
            # ── Fallback ──
            else:
                # Check if it's one of the previously defined commands (help, ping, 8ball, etc.)
                # We'll just show unknown command
                await message.reply(f"❌ Unknown command `{cmd}`. Use `.help` for the list.")
        
        except Exception as e:
            print(f"Error: {e}")
            await message.channel.send(f'❌ Error: {str(e)}', delete_after=10)
    
    async def show_help(self, message, cmd_name='general'):
        # (help text included in previous code)
        pass
    
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
