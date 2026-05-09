import discord
import asyncio
import aiohttp
import os
import sys
import re
import random
import io
from datetime import datetime, timedelta

TOKEN = os.getenv('DISCORD_TOKEN')
if not TOKEN or len(TOKEN) < 50:
    print("❌ INVALID TOKEN")
    sys.exit(1)

class SelfBot(discord.Client):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.command_prefix = '.'
        self.auto_replies = {}
        self.mention_reply = None

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
        await self.change_presence(status=discord.Status.dnd)

    async def send_long(self, channel_or_message, content, split_by=2000):
        if len(content) <= split_by:
            await channel_or_message.reply(content)
        else:
            parts = []
            while content:
                if len(content) <= split_by:
                    parts.append(content)
                    break
                split_at = content.rfind('\n', 0, split_by)
                if split_at == -1:
                    split_at = split_by
                parts.append(content[:split_at])
                content = content[split_at:].strip()
            for part in parts:
                await channel_or_message.reply(part)

    async def delete_trigger(self, message, delay=5):
        await asyncio.sleep(delay)
        try:
            await message.delete()
        except:
            pass

    async def on_message(self, message):
        if message.author != self.user:
            if self.mention_reply and self.user in message.mentions:
                await message.reply(self.mention_reply)
                return
            content_lower = message.content.lower().strip()
            for trigger, response in self.auto_replies.items():
                if trigger in content_lower:
                    await message.reply(response)
                    return
            return

        content = message.content
        if not content.startswith(self.command_prefix):
            return

        cmd = content[1:].split()[0].lower()
        args = content[len(self.command_prefix)+len(cmd):].strip()

        asyncio.create_task(self.delete_trigger(message))

        try:
            if cmd == 'help':
                help1 = """🔥 **Self-Bot Commands (1/2)**
Prefix: `.`

**-- Basic --**
`.ping` - Test connection
`.help` - This menu
`.invite` - Bot invite
`.feedback <text>` - Send feedback
`.report <text>` - Report an issue
`.bug <desc>` - Report a bug

**-- AutoReply & Mention --**
`.autoreply <trigger> | <response>` - Set custom auto-reply
`.autoreply list` - List all auto-replies
`.autoreply remove <trigger>` - Remove one
`.autoreply clear` - Clear all
`.replymention <message>` - Set mention reply
`.replymention off` - Disable mention reply

**-- Ping & DM --**
`.pinguser @user <msg>` - Ping user with message
`.massping <count> @user` - Ping user multiple times (max 100)
`.dm @user <msg>` - Send DM
`.everyone <msg>` - @everyone ping
`.mentionrole <role> <msg>` - Ping a role

**-- Fun --**
`.8ball <question>` - Magic 8ball
`.joke` - Random joke
`.coinflip` - Flip a coin
`.roll <max>` - Roll a dice (default 100)
`.choose <a | b | c>` - Choose between options
`.rps <rock|paper|scissors>` - Play RPS
`.cat` - Random cat picture
`.dog` - Random dog picture
`.meme` - Random meme
`.quote` - Random quote
`.fact` - Random fact"""

                help2 = """**-- Fun (cont.) --**
`.hug @user` - Hug someone
`.slap @user` - Slap someone
`.say <text>` - Make me say something
`.embed <title> | <desc>` - Create an embed

**-- Info --**
`.avatar @user` - Get avatar
`.serverinfo` - Server info
`.userinfo @user` - User info
`.channelinfo` - Current channel info
`.roleinfo <role>` - Role info
`.viewrole` - All roles in server
`.emoji` - List all server emojis
`.guilds` - List all servers

**-- Utility --**
`.weather <city>` - Weather info (placeholder)
`.define <word>` - Dictionary definition
`.urban <term>` - Urban Dictionary
`.translate <lang> | <text>` - Translate (placeholder)
`.shorten <url>` - Shorten URL (placeholder)
`.qr <text>` - Generate QR code (placeholder)
`.timer <seconds>` - Set a timer
`.remind <min> | <text>` - Reminder
`.poll <Q> | <opt1> | <opt2>` - Create a poll
`.clear <count>` - Delete your messages
`.purge <count>` - Same as clear

**-- File Generators --**
`.code` - Generate staff RoleNames + Permissions
`.tag` - Generate staff Tags + CustomChatTag"""
                await self.send_long(message, help1)
                await self.send_long(message, help2)

            # ── ReplyMention ──
            elif cmd == 'replymention':
                if not args:
                    if self.mention_reply:
                        await message.reply(f"Current mention reply: \"{self.mention_reply}\"\nUse `.replymention <message>` to change, or `.replymention off` to disable.")
                    else:
                        await message.reply("No mention reply set. Use `.replymention <message>` to enable it.")
                    return
                if args.lower().strip() == 'off':
                    self.mention_reply = None
                    await message.reply("✅ Mention reply disabled.")
                else:
                    self.mention_reply = args.strip()
                    await message.reply(f"✅ Mention reply set to: \"{self.mention_reply[:100]}{'...' if len(self.mention_reply)>100 else ''}\"")

            # ── AutoReply System ──
            elif cmd == 'autoreply':
                if not args:
                    await message.reply("**AutoReply Commands:**\n`.autoreply trigger | response` - Set\n`.autoreply list` - List all\n`.autoreply remove <trigger>` - Remove one\n`.autoreply clear` - Clear all")
                    return
                parts = args.split('|', 1)
                action = parts[0].strip().lower()
                if action == 'list':
                    if not self.auto_replies:
                        await message.reply("No auto-replies set.")
                    else:
                        lines = [f"• `{k}` → {v[:50]}{'...' if len(v)>50 else ''}" for k, v in self.auto_replies.items()]
                        await self.send_long(message, f"**Auto-replies ({len(self.auto_replies)}):**\n" + "\n".join(lines))
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
                    if len(parts) < 2:
                        await message.reply("Usage: `.autoreply <trigger> | <response>`")
                        return
                    trigger = parts[0].strip().lower()
                    response = parts[1].strip()
                    self.auto_replies[trigger] = response
                    await message.reply(f"✅ Auto-reply set: `{trigger}` → \"{response[:50]}{'...' if len(response)>50 else ''}\"")

            # ── PingUser ──
            elif cmd == 'pinguser':
                if not message.mentions:
                    await message.reply("❌ Mention someone! `.pinguser @user Hello`")
                    return
                user = message.mentions[0]
                msg = args.replace(message.mentions[0].mention, '').strip() if message.mentions else ''
                await message.channel.send(f"{user.mention} {msg}" if msg else user.mention)

            # ── MassPing ──
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
                if not message.mentions:
                    await message.reply("❌ Mention someone.")
                    return
                target = message.mentions[0]
                if count > 100:
                    await message.reply("❌ Max 100 pings allowed.")
                    return
                for _ in range(count):
                    await message.channel.send(target.mention)
                    await asyncio.sleep(0.3)

            # ── DM ──
            elif cmd == 'dm':
                if not message.mentions:
                    await message.reply("❌ Mention someone! `.dm @user message`")
                    return
                user = message.mentions[0]
                text = args.replace(user.mention, '').strip()
                if not text:
                    await message.reply("❌ Add a message.")
                    return
                try:
                    await user.send(text)
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
                parts = args.split(maxsplit=1)
                if len(parts) < 2:
                    await message.reply("Usage: `.mentionrole <role name> <message>`")
                    return
                role_name = parts[0].strip()
                text = parts[1].strip()
                if not message.guild:
                    await message.reply("❌ This only works in a server.")
                    return
                role = discord.utils.get(message.guild.roles, name=role_name)
                if not role:
                    try:
                        rid = int(role_name)
                        role = message.guild.get_role(rid)
                    except:
                        pass
                if not role:
                    await message.reply(f"❌ Role `{role_name}` not found.")
                    return
                await message.channel.send(f"{role.mention} {text}")

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
                    await message.reply("❌ Cannot change nickname.")

            # ── React ──
            elif cmd == 'react':
                if not args:
                    await message.reply("Usage: `.react 😊`")
                    return
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

            # ── Topic ──
            elif cmd == 'topic':
                if not args:
                    await message.reply("Usage: `.topic <new topic>`")
                    return
                try:
                    await message.channel.edit(topic=args[:1024])
                    await message.reply("✅ Channel topic updated.")
                except:
                    await message.reply("❌ Cannot change topic.")

            # ── Rename ──
            elif cmd == 'rename':
                if not args:
                    await message.reply("Usage: `.rename <new name>`")
                    return
                new_name = args[:100].replace(' ', '-').lower()
                try:
                    await message.channel.edit(name=new_name)
                    await message.reply(f"✅ Channel renamed to `{new_name}`")
                except:
                    await message.reply("❌ Cannot rename.")

            # ── Copy ──
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

            # ── StealEmoji ──
            elif cmd == 'stealemoji':
                if not args:
                    await message.reply("Usage: `.stealemoji <emoji>`")
                    return
                match = re.match(r'<a?:(\w+):(\d+)>', args.strip())
                if not match:
                    await message.reply("❌ That's not a custom emoji. Use the emoji itself.")
                    return
                name = match.group(1)
                eid = match.group(2)
                url = f"https://cdn.discordapp.com/emojis/{eid}.png"
                if not message.guild:
                    await message.reply("❌ This only works in a server.")
                    return
                async with aiohttp.ClientSession() as session:
                    async with session.get(url) as resp:
                        if resp.status != 200:
                            await message.reply("❌ Could not fetch emoji image.")
                            return
                        img = await resp.read()
                try:
                    await message.guild.create_custom_emoji(name=name, image=img)
                    await message.reply(f"✅ Emoji `:{name}:` added.")
                except discord.Forbidden:
                    await message.reply("❌ No permission to create emojis.")
                except:
                    await message.reply("❌ Failed to add emoji.")

            # ── Guilds ──
            elif cmd == 'guilds':
                guilds = [f"• {g.name} ({g.member_count})" for g in self.guilds[:20]]
                msg = f"**📡 Servers ({len(self.guilds)})**\n" + "\n".join(guilds)
                await self.send_long(message, msg)

            # ── Channelinfo ──
            elif cmd == 'channelinfo':
                ch = message.channel
                info = f"**# {ch.name}**\nID: {ch.id}\nType: {str(ch.type)}\n"
                if hasattr(ch, 'topic') and ch.topic:
                    info += f"Topic: {ch.topic[:100]}\n"
                info += f"Category: {ch.category.name if ch.category else 'None'}\n"
                info += f"Slowmode: {ch.slowmode_delay}s" if ch.slowmode_delay else "Slowmode: Off"
                await message.reply(info)

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
                    try:
                        rid = int(role_name)
                        role = message.guild.get_role(rid)
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
                        rid = int(role_name)
                        role = message.guild.get_role(rid)
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

            # ── VIEWROLE ──
            elif cmd == 'viewrole':
                if not message.guild:
                    await message.reply("❌ Only works in a server.")
                    return
                roles = sorted(
                    [r for r in message.guild.roles if r.name != "@everyone"],
                    key=lambda r: r.position,
                    reverse=True
                )
                count = len(roles)
                msg_parts = []
                current = f"📋 **{count} roles** (highest first):\n"
                for role in roles:
                    line = f"`{role.name}` | `{role.id}` | `#{role.color.value:06x}`\n"
                    if len(current) + len(line) > 1900:
                        msg_parts.append(current)
                        current = ""
                    current += line
                if current:
                    msg_parts.append(current)
                for i, part in enumerate(msg_parts):
                    if i == 0:
                        await message.reply(part)
                    else:
                        await message.channel.send(part)

            # ── CODE (RoleNames + Permissions – only the 31 staff roles) ──
            elif cmd == 'code':
                if not message.guild:
                    await message.reply("❌ Only works in a server.")
                    return

                # Exact staff roles you want
                staff_roles = [
                    "Founder", "blood", "Owner", "Co Owner", "CEO", "Developer", "Superior",
                    "Server Director", "Staff Director", "Supervisor", "Head Operations",
                    "Operations", "Executive", "Overseer", "Server Management", "Head Management",
                    "Senior Management", "Management", "Trial Management", "Community Management",
                    "Head Of Staff", "Lead Administrator", "Head Administrator", "Senior Administrator",
                    "Administrator", "Head Moderator", "Senior Moderator", "Moderator",
                    "Trial Moderator", "DANGER (ABOVE ALL)"
                ]

                # Permission data – adjust as needed. For missing ones I used sensible defaults.
                perms = {
                    "Founder": ['immune','doorlock','givecar','givecoin','sendback','offlineban','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "blood": ['immune','doorlock','givecar','givecoin','sendback','offlineban','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Owner": ['immune','doorlock','givecar','givecoin','sendback','offlineban','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Co Owner": ['immune','doorlock','givecar','offlineban','givecoin','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "CEO": ['doorlock','givecar','offlineban','givecoin','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Developer": ['doorlock','offlineban','givecar','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Superior": ['doorlock','givecar','offlineban','givecoin','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Server Director": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Staff Director": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Supervisor": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Head Operations": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Operations": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Executive": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Overseer": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Server Management": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Head Management": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','invisible','noclip','giveweapon','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Senior Management": ['givecar','offlineban','sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','invisible','noclip','giveweapon','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Management": ['sendback','offlineban','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','spectate','unban','entitywipe','heal','invisible','noclip','giveweapon','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Trial Management": ['sendback','offlineban','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','spectate','entitywipe','heal','invisible','noclip','giveweapon','giveitem','setgang','setjob','skin','announce','keyall'],
                    "Community Management": ['sendback','offlineban','spawnvehicle','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','spectate','entitywipe','heal','invisible','noclip','giveweapon','giveitem','setgang','setjob','skin','announce'],
                    "Head Of Staff": ['sendback','offlineban','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','spectate','entitywipe','heal','noclip','giveweapon','giveitem','setgang','setjob','skin','announce'],
                    "Lead Administrator": ['sendback','offlineban','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','spectate','entitywipe','heal','noclip','giveweapon','giveitem','setgang','setjob','skin'],
                    "Head Administrator": ['sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','spectate','entitywipe','heal','noclip','giveweapon','giveitem','setgang','setjob','skin'],
                    "Senior Administrator": ['sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','spectate','entitywipe','heal','noclip','giveweapon','giveitem','setgang','setjob','skin'],
                    "Administrator": ['sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','ban','offlineban','spectate','entitywipe','heal','noclip','giveweapon','giveitem','setgang','setjob','skin'],
                    "Head Moderator": ['sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','spectate','entitywipe','heal','noclip','skin'],
                    "Senior Moderator": ['sendback','noclip','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','spectate','entitywipe','heal','skin'],
                    "Moderator": ['sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','spectate','entitywipe','heal','skin'],
                    "Trial Moderator": ['sendback','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','endcomserv','spectate','entitywipe','heal','skin'],
                    "DANGER (ABOVE ALL)": ['immune','doorlock','givecar','givecoin','sendback','offlineban','comserv','tpm','teleport','revive','kick','freeze','spawnvehicle','repairvehicle','cleanvehicle','flipvehicle','staffchat','clearchat','coords','slap','banwipe','endcomserv','ban','offlineban','clearinventory','clearloadout','spectate','unban','entitywipe','heal','godmode','invisible','noclip','giveweapon','givemoney','giveitem','setgang','setjob','skin','announce','keyall']
                }

                # Build RoleNames
                lines = ["RoleNames = {"]
                for name in staff_roles:
                    role = discord.utils.get(message.guild.roles, name=name)
                    rid = role.id if role else 0
                    lines.append(f'    ["{name}"] = {rid},')
                lines.append("},")
                lines.append("")
                # Build Permissions
                lines.append("Permissions = {")
                for name in staff_roles:
                    perm_list = perms.get(name, [])
                    perm_str = ", ".join(f"'{p}'" for p in perm_list)
                    lines.append(f'    ["{name}"] = {{ {perm_str} }},')
                lines.append("},")

                content = "\n".join(lines)
                file = discord.File(io.BytesIO(content.encode('utf-8')), filename="message.txt")
                await message.reply("✅ Here's your staff RoleNames + Permissions:", file=file)

            # ── TAG (Tags + CustomChatTag – only staff roles) ──
            elif cmd == 'tag':
                if not message.guild:
                    await message.reply("❌ Only works in a server.")
                    return

                # Same staff list as .code
                staff_roles = [
                    "Founder", "blood", "Owner", "Co Owner", "CEO", "Developer", "Superior",
                    "Server Director", "Staff Director", "Supervisor", "Head Operations",
                    "Operations", "Executive", "Overseer", "Server Management", "Head Management",
                    "Senior Management", "Management", "Trial Management", "Community Management",
                    "Head Of Staff", "Lead Administrator", "Head Administrator", "Senior Administrator",
                    "Administrator", "Head Moderator", "Senior Moderator", "Moderator",
                    "Trial Moderator", "DANGER (ABOVE ALL)"
                ]

                lines = ["Tags = {"]
                for name in staff_roles:
                    role = discord.utils.get(message.guild.roles, name=name)
                    rid = role.id if role else 0
                    color = role.color if role else discord.Color.default()
                    r, g, b = color.r, color.g, color.b
                    lines.append("        {")
                    lines.append(f"            tag = '{name}',")
                    lines.append(f"            color = '{r}, {g}, {b}',")
                    lines.append(f"            role = {rid}")
                    lines.append("        },")
                lines.append("    },")
                lines.append("")
                # Static CustomChatTag block (from your example)
                lines.append("    CustomChatTag = {")
                lines.append("        role = 1380648059679281353,")
                lines.append("        tag = {")
                lines.append("            min = 2,")
                lines.append("            max = 15")
                lines.append("        },")
                lines.append("        blacklisted = { 'nigger','rap3','ni33ers','faggot','fag','niglet','chode','nigga','n!gaa','f@g','nsfw' }")
                lines.append("    },")
                lines.append("},")

                content = "\n".join(lines)
                file = discord.File(io.BytesIO(content.encode('utf-8')), filename="message.txt")
                await message.reply("✅ Here's your staff Tags + CustomChatTag:", file=file)

            # ── Existing old commands ──
            elif cmd in ('ping', '8ball', 'joke', 'coinflip', 'roll', 'choose', 'rps', 'cat', 'dog', 'meme', 'quote', 'fact', 'hug', 'slap', 'say', 'embed', 'avatar', 'serverinfo', 'userinfo', 'roleinfo', 'emoji', 'weather', 'define', 'urban', 'translate', 'shorten', 'qr', 'timer', 'remind', 'poll', 'clear', 'purge', 'invite', 'feedback', 'report', 'bug'):
                await self.handle_old_commands(message, cmd, args)

            else:
                await message.reply(f"❌ Unknown command `{cmd}`. Use `.help` for the list.")

        except Exception as e:
            print(f"Error: {e}")
            await message.channel.send(f'❌ Error: {str(e)}', delete_after=10)

    async def handle_old_commands(self, message, cmd, args):
        if cmd == 'ping':
            await message.reply('🚀 **Pong!**')
        elif cmd == '8ball':
            if not args:
                await message.reply("❌ Ask a question!")
                return
            responses = [
                "🎱 It is certain.", "🎱 It is decidedly so.", "🎱 Without a doubt.",
                "🎱 Yes – definitely.", "🎱 You may rely on it.", "🎱 As I see it, yes.",
                "🎱 Most likely.", "🎱 Outlook good.", "🎱 Yes.",
                "🎱 Signs point to yes.", "🎱 Reply hazy, try again.",
                "🎱 Ask again later.", "🎱 Better not tell you now.",
                "🎱 Cannot predict now.", "🎱 Concentrate and ask again.",
                "🎱 Don't count on it.", "🎱 My reply is no.",
                "🎱 My sources say no.", "🎱 Outlook not so good.",
                "🎱 Very doubtful."
            ]
            await message.reply(random.choice(responses))
        elif cmd == 'joke':
            async with aiohttp.ClientSession() as session:
                async with session.get('https://official-joke-api.appspot.com/random_joke') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        await message.reply(f"**{data['setup']}**\n\n{data['punchline']}")
                    else:
                        await message.reply("Couldn't fetch a joke.")
        elif cmd == 'coinflip':
            await message.reply(f"🪙 **{random.choice(['Heads', 'Tails'])}**")
        elif cmd == 'roll':
            try:
                max_num = int(args) if args else 100
                if max_num < 2: max_num = 100
                await message.reply(f"🎲 **{random.randint(1, max_num)}** (1-{max_num})")
            except:
                await message.reply("❌ Invalid number.")
        elif cmd == 'choose':
            options = [o.strip() for o in args.split('|')]
            if len(options) < 2:
                await message.reply("❌ Give options separated by `|`.")
                return
            await message.reply(f"🤔 I choose **{random.choice(options)}**")
        elif cmd == 'rps':
            choices = ['rock', 'paper', 'scissors']
            user_choice = args.lower().strip()
            if user_choice not in choices:
                await message.reply("❌ Choose `rock`, `paper`, or `scissors`.")
                return
            bot_choice = random.choice(choices)
            if user_choice == bot_choice:
                result = "It's a tie!"
            elif (user_choice == 'rock' and bot_choice == 'scissors') or \
                 (user_choice == 'scissors' and bot_choice == 'paper') or \
                 (user_choice == 'paper' and bot_choice == 'rock'):
                result = "You win! 🎉"
            else:
                result = "I win! 😎"
            await message.reply(f"**You:** {user_choice}  vs  **Me:** {bot_choice}\n{result}")
        elif cmd == 'cat':
            async with aiohttp.ClientSession() as session:
                async with session.get('https://api.thecatapi.com/v1/images/search') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        await message.reply(data[0]['url'])
                    else:
                        await message.reply("Couldn't fetch a cat pic.")
        elif cmd == 'dog':
            async with aiohttp.ClientSession() as session:
                async with session.get('https://dog.ceo/api/breeds/image/random') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        await message.reply(data['message'])
                    else:
                        await message.reply("Couldn't fetch a dog pic.")
        elif cmd == 'meme':
            async with aiohttp.ClientSession() as session:
                async with session.get('https://meme-api.com/gimme') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        await self.send_long(message, f"**{data['title']}**\n{data['url']}")
                    else:
                        await message.reply("Couldn't fetch a meme.")
        elif cmd == 'quote':
            async with aiohttp.ClientSession() as session:
                async with session.get('https://api.quotable.io/random') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        await message.reply(f"*\"{data['content']}\"*\n— {data['author']}")
                    else:
                        await message.reply("Couldn't fetch a quote.")
        elif cmd == 'fact':
            async with aiohttp.ClientSession() as session:
                async with session.get('https://uselessfacts.jsph.pl/random.json?language=en') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        await message.reply(f"💡 {data['text']}")
                    else:
                        await message.reply("Couldn't fetch a fact.")
        elif cmd == 'hug':
            if not message.mentions:
                await message.reply("❌ Mention someone to hug!")
                return
            await message.reply(f"🤗 **{message.author.mention} hugs {message.mentions[0].mention}!**")
        elif cmd == 'slap':
            if not message.mentions:
                await message.reply("❌ Mention someone to slap!")
                return
            await message.reply(f"🤚 **{message.author.mention} slaps {message.mentions[0].mention}!**")
        elif cmd == 'say':
            if not args:
                await message.reply("❌ Give me something to say!")
                return
            await message.channel.send(args)
        elif cmd == 'embed':
            if '|' not in args:
                await message.reply("❌ Usage: `.embed Title | Description`")
                return
            parts = args.split('|', 1)
            await message.channel.send(f"**{parts[0].strip()}**\n{parts[1].strip()}")
        elif cmd == 'avatar':
            user = message.mentions[0] if message.mentions else message.author
            await message.reply(f"🖼️ **{user.display_name}'s Avatar**\n{user.display_avatar.url}")
        elif cmd == 'serverinfo':
            if not message.guild:
                await message.reply("❌ Only works in a server.")
                return
            g = message.guild
            info = f"**{g.name}**\nID: {g.id}\nOwner: {g.owner}\nMembers: {g.member_count}\nChannels: {len(g.channels)}\nRoles: {len(g.roles)}\nCreated: {g.created_at.strftime('%b %d, %Y')}"
            await message.reply(info)
        elif cmd == 'userinfo':
            user = message.mentions[0] if message.mentions else message.author
            info = f"**👤 {user.display_name}**\nID: {user.id}\nUsername: {user.name}\nJoined Discord: {user.created_at.strftime('%b %d, %Y')}"
            if hasattr(user, 'joined_at') and user.joined_at:
                info += f"\nJoined Server: {user.joined_at.strftime('%b %d, %Y')}"
            await message.reply(info)
        elif cmd == 'roleinfo':
            if not message.guild:
                await message.reply("❌ Only works in a server.")
                return
            if not args:
                await message.reply("❌ Specify a role name or ID.")
                return
            role = None
            try:
                rid = int(args)
                role = message.guild.get_role(rid)
            except:
                role = discord.utils.get(message.guild.roles, name=args)
            if not role:
                await message.reply("❌ Role not found.")
                return
            await message.reply(f"**🎭 Role: {role.name}**\nID: {role.id}\nColor: #{role.color.value:06x}\nMembers: {len(role.members)}\nPosition: {role.position}\nHoisted: {role.hoist}\nMentionable: {role.mentionable}")
        elif cmd == 'emoji':
            if not message.guild:
                await message.reply("❌ Only works in a server.")
                return
            emojis = message.guild.emojis
            if not emojis:
                await message.reply("No custom emojis.")
                return
            lines = [f"{emoji} `:{emoji.name}:`" for emoji in emojis[:30]]
            msg = f"**{len(emojis)} custom emojis:**\n" + "\n".join(lines)
            await self.send_long(message, msg)
        elif cmd == 'weather':
            await message.reply(f"🌤️ Weather for **{args or 'Unknown'}** – placeholder.")
        elif cmd == 'define':
            if not args:
                await message.reply("❌ Give a word to define!")
                return
            async with aiohttp.ClientSession() as session:
                async with session.get(f'https://api.dictionaryapi.dev/api/v2/entries/en/{args}') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        word = data[0]['word']
                        pos = data[0]['meanings'][0]['partOfSpeech']
                        defn = data[0]['meanings'][0]['definitions'][0]['definition']
                        await message.reply(f"📖 **{word}** ({pos})\n{defn}")
                    else:
                        await message.reply("Word not found.")
        elif cmd == 'urban':
            if not args:
                await message.reply("❌ Give a term!")
                return
            async with aiohttp.ClientSession() as session:
                async with session.get(f'https://api.urbandictionary.com/v0/define?term={args}') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data['list']:
                            entry = data['list'][0]
                            await message.reply(f"**{entry['word']}**\n{entry['definition'][:500]}")
                        else:
                            await message.reply("No results.")
                    else:
                        await message.reply("Couldn't fetch.")
        elif cmd == 'translate':
            await message.reply("🌐 Translation placeholder (API key needed).")
        elif cmd == 'shorten':
            await message.reply("🔗 URL shortener placeholder.")
        elif cmd == 'qr':
            await message.reply("📱 QR code generator placeholder.")
        elif cmd == 'timer':
            try:
                sec = int(args)
                await message.reply(f"⏰ Timer set for {sec} seconds!")
                await asyncio.sleep(sec)
                await message.channel.send(f"⏰ **Timer done!** {message.author.mention}")
            except:
                await message.reply("❌ Usage: `.timer 30`")
        elif cmd == 'remind':
            if '|' not in args:
                await message.reply("❌ Usage: `.remind 5 | Drink water`")
                return
            parts = args.split('|', 1)
            try:
                mins = int(parts[0].strip())
                text = parts[1].strip()
                await message.reply(f"⏰ Reminder set for {mins} minute(s)!")
                await asyncio.sleep(mins * 60)
                await message.channel.send(f"⏰ **Reminder:** {text} {message.author.mention}")
            except:
                await message.reply("❌ Invalid minutes.")
        elif cmd == 'poll':
            if '|' not in args:
                await message.reply("❌ Usage: `.poll Q | A | B`")
                return
            parts = [p.strip() for p in args.split('|')]
            if len(parts) < 3:
                await message.reply("❌ Need question and at least 2 options.")
                return
            question = parts[0]
            opts = parts[1:]
            if len(opts) > 10:
                await message.reply("❌ Max 10 options.")
                return
            letters = ['🇦','🇧','🇨','🇩','🇪','🇫','🇬','🇭','🇮','🇯']
            lines = [f"**{question}**"]
            for i, opt in enumerate(opts):
                lines.append(f"{letters[i]} {opt}")
            poll_msg = await message.channel.send("\n".join(lines))
            for i in range(len(opts)):
                await poll_msg.add_reaction(letters[i])
        elif cmd in ('clear', 'purge'):
            count = 10
            if args:
                try:
                    count = min(int(args.split()[0]), 100)
                except:
                    count = 10
            deleted = await self.clear_messages(message.channel, count)
            await message.reply(f'🗑️ Deleted {len(deleted)} messages', delete_after=5)
        elif cmd == 'invite':
            await message.reply("🔗 Invite link: (contact for invite)")
        elif cmd == 'feedback':
            await message.reply(f"✅ Feedback received: *{args or 'empty'}*")
        elif cmd == 'report':
            await message.reply(f"✅ Report submitted: *{args or 'empty'}*")
        elif cmd == 'bug':
            await message.reply(f"🐛 Bug reported: *{args or 'empty'}*")
        else:
            await message.reply(f"❌ Unknown command `{cmd}`.")

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
