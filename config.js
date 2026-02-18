/**
 * ZETSUBO-BOT v3.0 CONFIGURATION
 * 300+ FEATURES - FREE & OPEN SOURCE
 * License: GPL-3.0 - DILARANG JUAL BELI!
 */

const config = {
    // BOT INFO
    botName: "Zetsubo-Bot",
    version: "3.0.0",
    ownerName: "Zetsubo Owner",
    ownerNumber: ["6281234567890@s.whatsapp.net"], // ⚠️ GANTI NOMOR INI!
    
    // SETTINGS
    prefix: [".", "!", "#", "/", "z!"],
    pairing: {
        enabled: true,
        phoneNumber: "" // Auto-fill atau kosongkan
    },
    
    // API KEYS (Optional - fitur tetap jalan tanpa ini)
    apiKeys: {
        openai: "", // sk-xxx untuk ChatGPT
        gemini: "", // Google Gemini API
        removebg: "", // Remove.bg API
        imgbb: "" // IMGBB API key
    },
    
    // PAYMENT
    payment: {
        qris: "https://i.imgur.com/example.jpg",
        dana: "081234567890",
        gopay: "081234567890",
        ovo: "081234567890",
        shopeepay: "081234567890",
        bca: "1234567890",
        bri: "1234567890"
    },
    
    // LIMITS
    limits: {
        free: 50,
        premium: 500,
        vip: 9999
    },
    
    // DATABASE
    database: {
        users: "./database/users.json",
        store: "./database/store.json",
        settings: "./database/settings.json"
    },
    
    // OPTIONS
    options: {
        autoRead: true,
        autoTyping: false,
        autoRecord: false,
        antiSpam: true,
        cooldown: 3000
    },
    
    // MESSAGES
    messages: {
        wait: "⏳ *Tunggu sebentar...*",
        error: "❌ *Terjadi kesalahan!*",
        limit: "⚠️ *Limit habis!* Ketik *.buylimit* atau *.claim*",
        admin: "❌ *Khusus admin grup!*",
        owner: "❌ *Khusus owner bot!*",
        premium: "💎 *Khusus user premium!* Ketik *.sewa*",
        group: "❌ *Khusus dalam grup!*"
    }
};

// VALIDATION
if (config.ownerNumber[0] === "6281234567890@s.whatsapp.net") {
    console.warn("\x1b[33m⚠️  WARNING: Ganti ownerNumber di config.js!\x1b[0m");
}

module.exports = config;
