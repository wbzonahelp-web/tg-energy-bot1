const { Markup } = require('telegraf');
const config = require('../config');

// Клавиатура пользователя
const userKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('❓ Помощь', 'user_help')],
  [Markup.button.callback('ℹ️ О боте', 'user_about')],
  [Markup.button.callback('📞 Контакты', 'user_contacts')]
]);

// Обработчики команд пользователя
module.exports = {
  // Команда /start
  startCommand: async (ctx) => {
    const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
    
    if (isAdmin) {
      await ctx.reply(
        '👋 *Добро пожаловать, Администратор!*\n\n' +
        'Вы имеете полный доступ к боту.\n\n' +
        'Доступные команды:\n' +
        '/admin - Админ-панель\n' +
        '/stats - Статистика\n' +
        '/broadcast - Рассылка\n\n' +
        'Или используйте кнопки ниже:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔐 Админ-панель', callback_data: 'admin_panel' }],
              [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
              [{ text: '📢 Рассылка', callback_data: 'admin_broadcast' }]
            ]
          }
        }
      );
    } else {
      await ctx.reply(
        `👋 *Добро пожаловать в ${config.BOT_NAME}!*\n\n` +
        'Я бот, который поможет вам с различными задачами.\n\n' +
        'Выберите раздел:',
        {
          parse_mode: 'Markdown',
          ...userKeyboard
        }
      );
    }
  },
  
  // Помощь
  helpCommand: async (ctx) => {
    await ctx.reply(
      '❓ *Помощь*\n\n' +
      'Доступные команды:\n\n' +
      '👤 *Для всех пользователей:*\n' +
      '/start - Начать работу с ботом\n' +
      '/help - Показать эту справку\n' +
      '/about - О боте\n\n' +
      '🔐 *Для администраторов:*\n' +
      '/admin - Админ-панель\n' +
      '/stats - Статистика\n' +
      '/broadcast - Рассылка\n\n' +
      'Если у вас есть вопросы, свяжитесь с нами.',
      { parse_mode: 'Markdown' }
    );
  },
  
  // О боте
  aboutCommand: async (ctx) => {
    await ctx.reply(
      `ℹ️ *О боте ${config.BOT_NAME}*\n\n` +
      'Этот бот создан для управления рассылками и контентом.\n\n' +
      '*Возможности:*\n' +
      '• Массовые рассылки сообщений\n' +
      '• Управление пользователями\n' +
      '• Статистика и аналитика\n' +
      '• Автоматические уведомления\n\n' +
      '*Разработчик:* @admin\n' +
      '*Версия:* 1.0.0',
      { parse_mode: 'Markdown' }
    );
  },
  
  // Контакты
  contactsCommand: async (ctx) => {
    await ctx.reply(
      '📞 *Контакты*\n\n' +
      'По всем вопросам обращайтесь:\n\n' +
      '📧 Email: support@example.com\n' +
      '📱 Telegram: @admin\n' +
      '🌐 Сайт: https://example.com\n\n' +
      'Мы всегда рады помочь!',
      { parse_mode: 'Markdown' }
    );
  },
  
  // Callback handlers
  helpCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '❓ *Помощь*\n\n' +
      'Выберите раздел:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📖 Команды', callback_data: 'user_commands' }],
            [{ text: '❓ FAQ', callback_data: 'user_faq' }],
            [{ text: '🔙 Назад', callback_data: 'user_back' }]
          ]
        }
      }
    );
  },
  
  aboutCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `ℹ️ *О боте ${config.BOT_NAME}*\n\n` +
      'Этот бот создан для управления рассылками и контентом.\n\n' +
      '*Возможности:*\n' +
      '• Массовые рассылки сообщений\n' +
      '• Управление пользователями\n' +
      '• Статистика и аналитика\n' +
      '• Автоматические уведомления\n\n' +
      '*Разработчик:* @admin\n' +
      '*Версия:* 1.0.0',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'user_back' }]
          ]
        }
      }
    );
  },
  
  contactsCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📞 *Контакты*\n\n' +
      'По всем вопросам обращайтесь:\n\n' +
      '📧 Email: support@example.com\n' +
      '📱 Telegram: @admin\n' +
      '🌐 Сайт: https://example.com\n\n' +
      'Мы всегда рады помочь!',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'user_back' }]
          ]
        }
      }
    );
  },
  
  // Обработчики для подменю помощи
  commandsCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📖 *Список команд*\n\n' +
      '👤 *Для пользователей:*\n' +
      '/start - Начать работу\n' +
      '/help - Справка\n' +
      '/about - О боте\n' +
      '/contacts - Контакты\n\n' +
      '🔐 *Для администраторов:*\n' +
      '/admin - Панель управления\n' +
      '/stats - Статистика\n' +
      '/broadcast - Рассылка',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад к помощи', callback_data: 'user_help' }]
          ]
        }
      }
    );
  },
  
  faqCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '❓ *Часто задаваемые вопросы*\n\n' +
      '❓ *Как связаться с поддержкой?*\n' +
      'Используйте команду /contacts\n\n' +
      '❓ *Как подписаться на рассылку?*\n' +
      'Вы уже подписаны, если видите это сообщение\n\n' +
      '❓ *Как отписаться от рассылки?*\n' +
      'Напишите /stop',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад к помощи', callback_data: 'user_help' }]
          ]
        }
      }
    );
  },
  
  // Возврат в главное меню
  userBackCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `👋 *Добро пожаловать в ${config.BOT_NAME}!*\n\n` +
      'Я бот, который поможет вам с различными задачами.\n\n' +
      'Выберите раздел:',
      {
        parse_mode: 'Markdown',
        ...userKeyboard
      }
    );
  }
};
