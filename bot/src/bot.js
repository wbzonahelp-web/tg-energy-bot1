const { Telegraf } = require('telegraf');
const config = require('./config');
const adminHandler = require('./handlers/admin');
const userHandler = require('./handlers/user');

const bot = new Telegraf(config.BOT_TOKEN);

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});

// Логирование
bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.from?.id}: ${ctx.updateType} - ${ms}ms`);
});

// Основные команды
bot.start(userHandler.startCommand);
bot.help(userHandler.helpCommand);
bot.command('about', userHandler.aboutCommand);
bot.command('contacts', userHandler.contactsCommand);

// Админские команды
bot.command('admin', adminHandler.adminCommand);
bot.command('stats', adminHandler.statsCallback);
bot.command('broadcast', adminHandler.broadcastCallback);

// Команда поиска пользователя
bot.command('find', async (ctx) => {
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('⛔ Нет доступа');
  }
  
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Использование: /find <user_id>');
  }
  
  const userId = args[1];
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'telegram_bot_db',
    user: process.env.POSTGRES_USER || 'bot_user',
    password: process.env.POSTGRES_PASSWORD || 'SecurePass2024!'
  });
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      await ctx.reply(`❌ Пользователь с ID ${userId} не найден`);
    } else {
      const user = result.rows[0];
      const status = user.is_active ? '✅ Активен' : '❌ Неактивен';
      const banned = user.is_banned ? '🚫 Заблокирован' : '✅ Не заблокирован';
      const username = user.username ? `@${user.username}` : '-';
      const date = new Date(user.created_at).toLocaleString('ru-RU');
      
      await ctx.reply(
        `🔍 *Найден пользователь:*\n\n` +
        `• ID: \`${user.user_id}\`\n` +
        `• Username: ${username}\n` +
        `• Имя: ${user.first_name || '-'}\n` +
        `• Статус: ${status}\n` +
        `• Блокировка: ${banned}\n` +
        `• Источник: ${user.source || '-'}\n` +
        `• Добавлен: ${date}`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (err) {
    console.error('Find user error:', err);
    await ctx.reply('❌ Ошибка поиска');
  }
});

// Callback handlers для админа
bot.action('admin_panel', adminHandler.adminPanelCallback);
bot.action('admin_stats', adminHandler.statsCallback);
bot.action('admin_broadcast', adminHandler.broadcastCallback);
bot.action('admin_users', adminHandler.usersCallback);
bot.action('admin_settings', adminHandler.settingsCallback);
bot.action('admin_back', adminHandler.adminBackCallback);
bot.action('admin_refresh', adminHandler.refreshCallback);

// Статистика
bot.action('stats_daily', adminHandler.statsDailyCallback);
bot.action('stats_export', adminHandler.usersExportCallback);

// Пользователи
bot.action('users_search', adminHandler.usersSearchCallback);
bot.action('users_list', adminHandler.usersListCallback);
bot.action('users_banned', adminHandler.usersBannedCallback);
bot.action('users_export', adminHandler.usersExportCallback);

// Рассылки
bot.action('broadcast_new', adminHandler.broadcastNewCallback);
bot.action('broadcast_by_id', adminHandler.broadcastNewCallback);
bot.action('broadcast_history', adminHandler.broadcastHistoryCallback);
bot.action('broadcast_stats', adminHandler.broadcastStatsCallback);

// Настройки
bot.action('settings_refresh', adminHandler.settingsRefreshCallback);

// Callback handlers для пользователя
bot.action('user_help', userHandler.helpCallback);
bot.action('user_about', userHandler.aboutCallback);
bot.action('user_contacts', userHandler.contactsCallback);
bot.action('user_back', userHandler.userBackCallback);
bot.action('user_commands', userHandler.commandsCallback);
bot.action('user_faq', userHandler.faqCallback);

// Обработка неизвестных callback
bot.on('callback_query', async (ctx) => {
  console.log('Unknown callback:', ctx.callbackQuery.data);
  await ctx.answerCbQuery('⚠️ Неизвестная команда');
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
  
  if (isAdmin) {
    await ctx.reply(
      '🔐 *Админ-панель*\n\n' +
      'Выберите раздел:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
            [{ text: '👥 Пользователи', callback_data: 'admin_users' }],
            [{ text: '📢 Рассылки', callback_data: 'admin_broadcast' }],
            [{ text: '⚙️ Настройки', callback_data: 'admin_settings' }]
          ]
        }
      }
    );
  } else {
    await ctx.reply(
      '❓ Не понимаю эту команду.\n\n' +
      'Используйте /help для справки.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ Помощь', callback_data: 'user_help' }]
          ]
        }
      }
    );
  }
});

// Запуск бота
async function start() {
  try {
    console.log('Starting bot...');
    console.log('Admin IDs:', config.ADMIN_IDS);
    
    await bot.launch();
    console.log('✅ Bot started successfully');
    
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start bot:', err);
    process.exit(1);
  }
}

start();
