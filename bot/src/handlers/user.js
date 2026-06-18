const { Markup } = require('telegraf');
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'telegram_bot_db',
  user: process.env.POSTGRES_USER || 'bot_user',
  password: process.env.POSTGRES_PASSWORD || 'SecurePass2024!'
});

// Главное меню пользователя
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('📋 Возможности', 'user_features')],
  [Markup.button.callback('❓ FAQ', 'user_faq')],
  [Markup.button.callback('📩 Обратная связь', 'user_feedback')],
  [Markup.button.callback('👤 Мой профиль', 'user_profile')]
]);

module.exports = {
  // /start - Приветственное сообщение
  startCommand: async (ctx) => {
    const userId = ctx.from.id;
    const isAdmin = config.ADMIN_IDS.includes(userId);
    
    // Регистрируем пользователя в базе
    try {
      await pool.query(
        `INSERT INTO users (user_id, username, first_name, last_name, language_code, source) 
         VALUES ($1, $2, $3, $4, $5, 'bot_start') 
         ON CONFLICT (user_id) DO UPDATE SET 
           username = EXCLUDED.username,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           last_message_at = CURRENT_TIMESTAMP`,
        [userId, ctx.from.username, ctx.from.first_name, ctx.from.last_name, ctx.from.language_code]
      );
    } catch (err) {
      console.error('User registration error:', err);
    }
    
    if (isAdmin) {
      return ctx.reply(
        '👋 *Добро пожаловать, Администратор!*\n\n' +
        'Вы имеете полный доступ к боту.\n\n' +
        'Доступные команды:\n' +
        '/admin - Админ-панель\n' +
        '/stats - Статистика\n\n' +
        'Или используйте кнопки ниже:',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔐 Админ-панель', callback_data: 'admin_panel' }],
              [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
              [{ text: '📢 Рассылки', callback_data: 'admin_broadcast' }]
            ]
          }
        }
      );
    }
    
    const userName = ctx.from.first_name || 'друг';
    await ctx.reply(
      `👋 *Привет, ${userName}!*\n\n` +
      `Добро пожаловать в *${config.BOT_NAME}*!\n\n` +
      'Я помогу вам быть в курсе всех новостей и событий.\n\n' +
      'Выберите раздел:',
      {
        parse_mode: 'Markdown',
        ...mainMenu
      }
    );
  },

  // /help - Помощь
  helpCommand: async (ctx) => {
    const isAdmin = config.ADMIN_IDS.includes(ctx.from.id);
    
    let helpText = '❓ *Помощь*\n\n' +
      'Доступные команды:\n\n' +
      '👤 *Для всех пользователей:*\n' +
      '/start - Начать работу с ботом\n' +
      '/help - Показать эту справку\n' +
      '/profile - Мой профиль\n' +
      '/feedback - Отправить сообщение\n';
    
    if (isAdmin) {
      helpText += '\n🔐 *Для администраторов:*\n' +
        '/admin - Админ-панель\n' +
        '/stats - Статистика\n';
    }
    
    await ctx.reply(helpText, { parse_mode: 'Markdown' });
  },

  // /profile - Мой профиль
  profileCommand: async (ctx) => {
    await module.exports.profileCallback(ctx);
  },

  // /feedback - Обратная связь
  feedbackCommand: async (ctx) => {
    await ctx.reply(
      '📩 *Обратная связь*\n\n' +
      'Напишите ваше сообщение, и оно будет передано администратору.\n\n' +
      'Вы можете отправить:\n' +
      '• Вопрос\n' +
      '• Предложение\n' +
      '• Жалобу\n' +
      '• Отзыв\n\n' +
      'Просто напишите текст следующим сообщением:',
      { parse_mode: 'Markdown' }
    );
  },

  // Возможности
  featuresCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📋 *Возможности бота*\n\n' +
      '🔔 *Уведомления*\n' +
      'Получайте актуальные новости и обновления\n\n' +
      '📊 *Информация*\n' +
      'Доступ к полезным данным и статистике\n\n' +
      '📩 *Обратная связь*\n' +
      'Быстрая связь с администрацией\n\n' +
      '👤 *Личный кабинет*\n' +
      'Управление вашими настройками',
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

  // FAQ
  faqCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '❓ *Часто задаваемые вопросы*\n\n' +
      '*В: Как связаться с поддержкой?*\n' +
      'О: Используйте раздел "Обратная связь" или команду /feedback\n\n' +
      '*В: Как быть в курсе новостей?*\n' +
      'О: Оставайтесь подписанным на бота - вы будете получать все уведомления\n\n' +
      '*В: Как изменить настройки?*\n' +
      'О: Перейдите в "Мой профиль" через главное меню\n\n' +
      '*В: Мои данные в безопасности?*\n' +
      'О: Да, мы не передаём ваши данные третьим лицам',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📩 Задать вопрос', callback_data: 'user_feedback' }],
            [{ text: '🔙 Назад', callback_data: 'user_back' }]
          ]
        }
      }
    );
  },

  // Обратная связь - показать форму
  feedbackCallback: async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📩 *Обратная связь*\n\n' +
      'Напишите ваше сообщение, и оно будет передано администратору.\n\n' +
      'Просто отправьте текст следующим сообщением.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Отмена', callback_data: 'user_back' }]
          ]
        }
      }
    );
    
    // Устанавливаем состояние ожидания сообщения
    if (!global.feedbackState) global.feedbackState = {};
    global.feedbackState[ctx.from.id] = true;
  },

  // Мой профиль
  profileCallback: async (ctx) => {
    const userId = ctx.from.id;
    
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [userId]
      );
      
      let profileText = '👤 *Ваш профиль*\n\n';
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const regDate = new Date(user.created_at).toLocaleDateString('ru-RU');
        profileText += `• ID: \`${user.user_id}\`\n`;
        profileText += `• Имя: ${user.first_name || '-'}\n`;
        profileText += `• Username: ${user.username ? '@' + user.username : '-'}\n`;
        profileText += `• Дата регистрации: ${regDate}\n`;
        profileText += `• Статус: ✅ Активен`;
      } else {
        profileText += 'Профиль не найден. Отправьте /start';
      }
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(profileText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'user_back' }]
          ]
        }
      });
    } catch (err) {
      console.error('Profile error:', err);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  },

  // Возврат в главное меню
  userBackCallback: async (ctx) => {
    const userName = ctx.from.first_name || 'друг';
    
    // Убираем состояние ожидания обратной связи
    if (global.feedbackState) {
      delete global.feedbackState[ctx.from.id];
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `👋 *Привет, ${userName}!*\n\n` +
      'Выберите раздел:',
      {
        parse_mode: 'Markdown',
        ...mainMenu
      }
    );
  },

  // Обработка текстовых сообщений (обратная связь)
  handleText: async (ctx) => {
    const userId = ctx.from.id;
    
    // Проверяем, ожидается ли сообщение обратной связи
    if (global.feedbackState && global.feedbackState[userId]) {
      const userMessage = ctx.message.text;
      
      // Отправляем сообщение админу
      for (const adminId of config.ADMIN_IDS) {
        try {
          await ctx.telegram.sendMessage(
            adminId,
            `📩 *Новое сообщение от пользователя*\n\n` +
            `👤 Имя: ${ctx.from.first_name || '-'}\n` +
            `🆔 ID: \`${userId}\`\n` +
            `📛 Username: ${ctx.from.username ? '@' + ctx.from.username : '-'}\n\n` +
            `💬 Сообщение:\n${userMessage}`,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          console.error('Send to admin error:', err);
        }
      }
      
      // Убираем состояние
      delete global.feedbackState[userId];
      
      await ctx.reply(
        '✅ *Сообщение отправлено!*\n\n' +
        'Администратор получит ваше сообщение и ответит при необходимости.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Главное меню', callback_data: 'user_back' }]
            ]
          }
        }
      );
      return true;
    }
    
    return false;
  }
};
