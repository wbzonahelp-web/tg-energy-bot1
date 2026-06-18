const { Markup } = require('telegraf');
const { Pool } = require('pg');
const config = require('../config');

// Подключение к PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'telegram_bot_db',
  user: process.env.POSTGRES_USER || 'bot_user',
  password: process.env.POSTGRES_PASSWORD || 'SecurePass2024!'
});

// Клавиатура админ-панели
const adminKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📊 Статистика', 'admin_stats')],
  [Markup.button.callback('📢 Рассылка', 'admin_broadcast')],
  [Markup.button.callback('👥 Пользователи', 'admin_users')],
  [Markup.button.callback('⚙️ Настройки', 'admin_settings')],
  [Markup.button.callback('🔄 Обновить', 'admin_refresh')]
]);

// Обработчики команд админа
module.exports = {
  // Команда /admin
  adminCommand: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.reply('⛔ У вас нет доступа к админ-панели.');
    }
    
    await ctx.reply(
      '🔐 *Админ-панель*\n\n' +
      'Добро пожаловать, Администратор!\n\n' +
      'Выберите раздел:',
      {
        parse_mode: 'Markdown',
        ...adminKeyboard
      }
    );
  },
  
  // Обработчик для кнопки "Админ-панель" из главного меню
  adminPanelCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🔐 *Админ-панель*\n\n' +
      'Добро пожаловать, Администратор!\n\n' +
      'Выберите раздел:',
      {
        parse_mode: 'Markdown',
        ...adminKeyboard
      }
    );
  },
  
  // Статистика
  statsCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    try {
      const total = await pool.query('SELECT COUNT(*) FROM users');
      const active = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
      const banned = await pool.query('SELECT COUNT(*) FROM users WHERE is_banned = true');
      const mailings = await pool.query('SELECT COUNT(*) FROM mailings');
      
      const statsText = `
📊 *Статистика бота*

👥 *Пользователи:*
• Всего: *${total.rows[0].count}*
• Активных: *${active.rows[0].count}*
• Заблокировано: *${banned.rows[0].count}*

📨 *Рассылки:*
• Всего рассылок: *${mailings.rows[0].count}*

📅 *Дата:* ${new Date().toLocaleDateString('ru-RU')}
      `;
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(statsText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Обновить', callback_data: 'admin_stats' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }]
          ]
        }
      });
    } catch (err) {
      console.error('Stats error:', err);
      await ctx.answerCbQuery('❌ Ошибка получения статистики');
    }
  },
  
  // Рассылка
  broadcastCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📢 *Меню рассылки*\n\n' +
      'Выберите тип рассылки:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📨 Всем пользователям', callback_data: 'broadcast_all' }],
            [{ text: '🎯 По ID пользователей', callback_data: 'broadcast_by_id' }],
            [{ text: '📊 История рассылок', callback_data: 'broadcast_history' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }]
          ]
        }
      }
    );
  },
  
  // Пользователи
  usersCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '👥 *Управление пользователями*\n\n' +
      'Выберите действие:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Список пользователей', callback_data: 'users_list' }],
            [{ text: '🔍 Поиск пользователя', callback_data: 'users_search' }],
            [{ text: '🚫 Заблокированные', callback_data: 'users_banned' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }]
          ]
        }
      }
    );
  },
  
  // Настройки
  settingsCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '⚙️ *Настройки бота*\n\n' +
      'Текущие настройки:\n\n' +
      `• Имя бота: *${config.BOT_NAME}*\n` +
      `• Username: *@${config.BOT_USERNAME}*\n` +
      `• Размер пакета: *${config.BATCH_SIZE}*\n` +
      `• Задержка: *${config.BATCH_DELAY}ms*\n\n` +
      'Выберите действие:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✏️ Изменить имя', callback_data: 'settings_name' }],
            [{ text: '📦 Размер пакета', callback_data: 'settings_batch' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }]
          ]
        }
      }
    );
  },
  
  // Обновление данных
  refreshCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery('🔄 Данные обновлены');
    // Можно добавить логику обновления данных
  },
  
  // Возврат в админ-панель
  adminBackCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🔐 *Админ-панель*\n\n' +
      'Добро пожаловать, Администратор!\n\n' +
      'Выберите раздел:',
      {
        parse_mode: 'Markdown',
        ...adminKeyboard
      }
    );
  }
};
