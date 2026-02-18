/**
 * ZETSUBO-BOT v3.0 - MAIN FILE
 * 300+ FEATURES
 * Free & Open Source - Dilarang Jual Beli!
 */

const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');
const config = require('./config');

// LOGGER
const logger = P({ level: 'silent' });

// BANNER
console.log(chalk.cyan(`
╔══════════════════════════════════════════╗
║                                          ║
║     🤖 ZETSUBO-BOT v${config.version}              ║
║     300+ FEATURES                        ║
║     Free & Open Source                   ║
║                                          ║
║     ⚠️  DILARANG JUAL BELI!              ║
║                                          ║
╚══════════════════════════════════════════╝
`));

// LOAD COMMANDS
const commands = new Map();
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js')).sort();

console.log(chalk.blue('\n📂 Loading commands...'));
let totalCmds = 0;

for (const file of commandFiles) {
    try {
        const cmd = require(`./commands/${file}`);
        if (cmd.commands) {
            Object.keys(cmd.commands).forEach(key => {
                commands.set(key.toLowerCase(), cmd.commands[key]);
                totalCmds++;
            });
            console.log(chalk.green(`✅ ${file}`));
        }
    } catch (err) {
        console.log(chalk.red(`❌ ${file}: ${err.message}`));
    }
}

console.log(chalk.blue(`\n📊 Total Commands: ${totalCmds}\n`));

// PAIRING INPUT
const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

// INIT DATABASE
if (!fs.existsSync('./database')) fs.mkdirSync('./database');
if (!fs.existsSync(config.database.users)) fs.writeFileSync(config.database.users, '[]');
if (!fs.existsSync(config.database.store)) fs.writeFileSync(config.database.store, '[]');
if (!fs.existsSync(config.database.settings)) fs.writeFileSync(config.database.settings, '{}');

// START BOT
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    console.log(chalk.cyan(`📦 Baileys v${version.join('.')}`));

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: process.argv.includes('--qr'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        browser: Browsers.ubuntu('Chrome'),
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true
    });

    // PAIRING CODE
    if (!sock.authState.creds.registered && process.argv.includes('--pairing')) {
        console.log(chalk.yellow('\n📱 PAIRING CODE MODE\n'));
        
        let phoneNumber = config.pairing.phoneNumber;
        if (!phoneNumber) {
            phoneNumber = await question(chalk.cyan('📞 Nomor WhatsApp (62xxx): '));
        }
        
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        if (!phoneNumber.startsWith('62')) {
            console.log(chalk.red('❌ Nomor harus 62 (Indonesia)'));
            process.exit(1);
        }

        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(chalk.green('\n✅ PAIRING CODE:'));
            console.log(chalk.bgWhite(chalk.black(`\n     ${code}     \n`)));
            console.log(chalk.cyan('1. WhatsApp → Perangkat Tertaut'));
            console.log(chalk.cyan('2. Pilih "Tautkan dengan nomor telepon"'));
            console.log(chalk.cyan('3. Masukkan kode di atas\n'));
        } catch (err) {
            console.log(chalk.red(`❌ Error: ${err.message}`));
            process.exit(1);
        }
    }

    // CONNECTION
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'connecting') {
            console.log(chalk.yellow('🔄 Connecting...'));
        }
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(chalk.red(`❌ Closed (${statusCode})`));
            
            if (shouldReconnect) {
                console.log(chalk.yellow('🔄 Reconnecting...'));
                setTimeout(startBot, 5000);
            }
        } else if (connection === 'open') {
            console.log(chalk.green(`\n✅ ${config.botName} Connected!`));
            console.log(chalk.cyan(`👤 ${sock.user.id.split(':')[0]}\n`));
            
            // Notify owner
            for (const owner of config.ownerNumber) {
                await sock.sendMessage(owner, {
                    text: `🤖 *${config.botName} Online!*\n📅 ${new Date().toLocaleString()}\n⚠️ Dilarang jual beli script ini!`
                }).catch(() => {});
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // MESSAGE HANDLER
    const msgCooldown = new Map();
    
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const body = msg.message?.conversation || 
                    msg.message?.extendedTextMessage?.text || 
                    msg.message?.imageMessage?.caption || 
                    msg.message?.videoMessage?.caption || '';

        const prefix = config.prefix.find(p => body.startsWith(p));
        if (!prefix) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const sender = msg.key.participant || msg.key.remoteJid;
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        // ANTI SPAM
        if (config.options.antiSpam) {
            const now = Date.now();
            const lastCmd = msgCooldown.get(sender) || 0;
            if (now - lastCmd < config.options.cooldown) return;
            msgCooldown.set(sender, now);
        }

        // EXECUTE COMMAND
        if (commands.has(command)) {
            try {
                console.log(chalk.magenta(`📥 ${command} | ${sender.split('@')[0]}`));
                await commands.get(command)(sock, msg, args, { from, sender, isGroup, body });
            } catch (error) {
                console.error(chalk.red(`❌ ${command}:`), error);
                await sock.sendMessage(from, { 
                    text: config.messages.error 
                }, { quoted: msg });
            }
        }
    });

    // GROUP PARTICIPANTS
    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        
        if (action === 'add') {
            for (const p of participants) {
                await sock.sendMessage(id, {
                    text: `👋 Selamat datang @${p.split('@')[0]}!\n\nKetik *.menu* untuk melihat fitur.`,
                    mentions: [p]
                });
            }
        }
    });

    // AUTO READ
    if (config.options.autoRead) {
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.key.fromMe) await sock.readMessages([msg.key]);
        });
    }
}

// GRACEFUL SHUTDOWN
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down...'));
    process.exit(0);
});

// RUN
const mode = process.argv.includes('--pairing') ? 'PAIRING' : 
             process.argv.includes('--qr') ? 'QR' : 'DEFAULT';

console.log(chalk.blue(`\n🚀 Starting in ${mode} mode...\n`));

startBot().catch(err => {
    console.error(chalk.red('❌ Fatal:'), err);
    process.exit(1);
});
