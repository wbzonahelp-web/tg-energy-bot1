const { Telegraf } = require('telegraf');
const config = require('./config');
const adminHandler = require('./handlers/admin');
const userHandler = require('./handlers/user');

// Создаём экземпляр бота
const bot = new Telegraf(config.BOT_TOKEN);

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
});

// Middleware для логирования
bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log('Response time %sms', ms);
});

// Регистрация обработчиков команд
bot.start(userHandler.startCommand);
bot.help(userHandler.helpCommand);
bot.command('about', userHandler.aboutCommand);
bot.command('contacts', userHandler.contactsCommand);

// Админские команды
bot.command('admin', adminHandler.adminCommand);
bot.command('stats', adminHandler.statsCallback);
bot.command('broadcast', adminHandler.broadcastCallback);

// Callback handlers для админа
bot.action('admin_panel', adminHandler.adminPanelCallback);
bot.action('admin_stats', adminHandler.statsCallback);
bot.action('admin_broadcast', adminHandler.broadcastCallback);
bot.action('admin_users', adminHandler.usersCallback);
bot.action('admin_settings', adminHandler.settingsCallback);
bot.action('admin_back', adminHandler.adminBackCallback);
bot.action('admin_refresh', adminHandler.refreshCallback);

// Callback handlers для пользователя
bot.action('user_help', userHandler.helpCallback);
bot.action('user_about', userHandler.aboutCallback);
bot.action('user_contacts', userHandler.contactsCallback);
bot.action('user_back', userHandler.userBackCallback);
bot.action('user_commands', userHandler.commandsCallback);
bot.action('user_faq', userHandler.faqCallback);

// Обработка неизвестных callback queries
bot.on('callback_query', async (ctx) => {
  console.log('Unknown callback:', ctx.callbackQuery.data);
  await ctx.answerCbQuery('⚠️ Неизвестная команда');
});

// Обработка неизвестных команд
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
            [{ text: '📢 Рассылка', callback_data: 'admin_broadcast' }],
            [{ text: '👥 Пользователи', callback_data: 'admin_users' }],
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
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start bot:', err);
    process.exit(1);
  }
}

start();
