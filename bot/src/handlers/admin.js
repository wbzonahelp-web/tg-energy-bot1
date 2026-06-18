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

// Основное меню админ-панели
const adminMainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('📊 Статистика', 'admin_stats')],
  [Markup.button.callback('👥 Пользователи', 'admin_users')],
  [Markup.button.callback('📢 Рассылки', 'admin_broadcast')],
  [Markup.button.callback('⚙️ Настройки', 'admin_settings')],
  [Markup.button.callback('🔄 Обновить', 'admin_refresh')]
]);

module.exports = {
  // Главная админ-панель
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
        ...adminMainMenu
      }
    );
  },

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
        ...adminMainMenu
      }
    );
  },

  // Расширенная статистика
  statsCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Общая статистика
      const total = await pool.query('SELECT COUNT(*) FROM users');
      const active = await pool.query("SELECT COUNT(*) FROM users WHERE is_active = true");
      const banned = await pool.query("SELECT COUNT(*) FROM users WHERE is_banned = true");
      
      // Статистика рассылок
      const mailingsTotal = await pool.query('SELECT COUNT(*) FROM mailings');
      const mailingsToday = await pool.query(
        "SELECT COUNT(*) FROM mailings WHERE created_at::date = $1", [today]
      );
      
      // Статистика отправки
      const sentTotal = await pool.query("SELECT COALESCE(SUM(sent_count), 0) FROM mailings");
      const failedTotal = await pool.query("SELECT COALESCE(SUM(failed_count), 0) FROM mailings");
      
      // Последняя рассылка
      const lastMailing = await pool.query(
        "SELECT id, status, total_users, sent_count, failed_count, created_at FROM mailings ORDER BY id DESC LIMIT 1"
      );
      
      let lastMailingInfo = 'Нет рассылок';
      if (lastMailing.rows.length > 0) {
        const m = lastMailing.rows[0];
        lastMailingInfo = `ID: ${m.id} | ${m.status} | ${m.sent_count}/${m.total_users} | ${new Date(m.created_at).toLocaleDateString('ru-RU')}`;
      }
      
      const statsText = `
📊 *Статистика бота*

👥 *Пользователи:*
• Всего: *${total.rows[0].count}*
• Активных: *${active.rows[0].count}*
• Заблокировано: *${banned.rows[0].count}*

📨 *Рассылки:*
• Всего: *${mailingsTotal.rows[0].count}*
• Сегодня: *${mailingsToday.rows[0].count}*
• Всего отправлено: *${sentTotal.rows[0].count}*
• Ошибок: *${failedTotal.rows[0].count}*

📋 *Последняя рассылка:*
${lastMailingInfo}

📅 *Обновлено:* ${new Date().toLocaleString('ru-RU')}
      `;
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(statsText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📈 Статистика по дням', callback_data: 'stats_daily' }],
            [{ text: '📊 Экспорт отчёта', callback_data: 'stats_export' }],
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

  // Статистика по дням
  statsDailyCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    try {
      const dailyStats = await pool.query(`
        SELECT 
          created_at::date as date,
          COUNT(*) as mailings,
          SUM(total_users) as total_users,
          SUM(sent_count) as sent,
          SUM(failed_count) as failed
        FROM mailings 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY created_at::date
        ORDER BY date DESC
        LIMIT 7
      `);
      
      let dailyText = '📈 *Статистика по дням (7 дней)*\n\n';
      
      if (dailyStats.rows.length === 0) {
        dailyText += 'Нет данных за последние 7 дней';
      } else {
        for (const row of dailyStats.rows) {
          const date = new Date(row.date).toLocaleDateString('ru-RU');
          dailyText += `📅 *${date}:*\n`;
          dailyText += `• Рассылок: ${row.mailings}\n`;
          dailyText += `• Отправлено: ${row.sent}/${row.total_users}\n`;
          dailyText += `• Ошибок: ${row.failed}\n\n`;
        }
      }
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(dailyText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад к статистике', callback_data: 'admin_stats' }]
          ]
        }
      });
    } catch (err) {
      console.error('Daily stats error:', err);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  },

  // Меню пользователей
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
            [{ text: '🔍 Поиск по ID', callback_data: 'users_search' }],
            [{ text: '📋 Список (последние 20)', callback_data: 'users_list' }],
            [{ text: '🚫 Заблокированные', callback_data: 'users_banned' }],
            [{ text: '📤 Экспорт в CSV', callback_data: 'users_export' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }]
          ]
        }
      }
    );
  },

  // Поиск пользователя
  usersSearchCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '🔍 *Поиск пользователя*\n\n' +
      'Введите ID пользователя для поиска:\n\n' +
      'Формат: `/find 123456789`',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'admin_users' }]
          ]
        }
      }
    );
  },

  // Список пользователей
  usersListCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    try {
      const users = await pool.query(
        'SELECT user_id, username, first_name, is_active, created_at FROM users ORDER BY id DESC LIMIT 20'
      );
      
      let usersText = '📋 *Последние 20 пользователей:*\n\n';
      
      for (const user of users.rows) {
        const status = user.is_active ? '✅' : '❌';
        const username = user.username ? `@${user.username}` : '-';
        const date = new Date(user.created_at).toLocaleDateString('ru-RU');
        usersText += `${status} \`${user.user_id}\` | ${username} | ${date}\n`;
      }
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(usersText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'admin_users' }]
          ]
        }
      });
    } catch (err) {
      console.error('Users list error:', err);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  },

  // Заблокированные пользователи
  usersBannedCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    try {
      const banned = await pool.query(
        'SELECT user_id, username, first_name, created_at FROM users WHERE is_banned = true ORDER BY id DESC LIMIT 20'
      );
      
      let bannedText = '🚫 *Заблокированные пользователи:*\n\n';
      
      if (banned.rows.length === 0) {
        bannedText += 'Нет заблокированных пользователей';
      } else {
        for (const user of banned.rows) {
          const username = user.username ? `@${user.username}` : '-';
          const date = new Date(user.created_at).toLocaleDateString('ru-RU');
          bannedText += `❌ \`${user.user_id}\` | ${username} | ${date}\n`;
        }
      }
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(bannedText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'admin_users' }]
          ]
        }
      });
    } catch (err) {
      console.error('Banned users error:', err);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  },

  // Экспорт пользователей
  usersExportCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    try {
      const users = await pool.query('SELECT user_id, username, first_name, is_active FROM users ORDER BY user_id');
      
      let csv = 'user_id,username,first_name,is_active\n';
      for (const user of users.rows) {
        csv += `${user.user_id},"${user.username || ''}","${user.first_name || ''}",${user.is_active}\n`;
      }
      
      const fs = require('fs');
      const filePath = '/tmp/users_export.csv';
      fs.writeFileSync(filePath, csv);
      
      await ctx.answerCbQuery();
      await ctx.replyWithDocument(
        { source: filePath, filename: `users_export_${new Date().toISOString().split('T')[0]}.csv` },
        { caption: '📤 Экспорт пользователей' }
      );
      
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Export error:', err);
      await ctx.answerCbQuery('❌ Ошибка экспорта');
    }
  },

  // Меню рассылок
  broadcastCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📢 *Управление рассылками*\n\n' +
      'Выберите действие:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📨 Новая рассылка', callback_data: 'broadcast_new' }],
            [{ text: '🎯 Рассылка по ID', callback_data: 'broadcast_by_id' }],
            [{ text: '📋 История рассылок', callback_data: 'broadcast_history' }],
            [{ text: '📊 Статистика рассылок', callback_data: 'broadcast_stats' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }]
          ]
        }
      }
    );
  },

  // Новая рассылка
  broadcastNewCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📨 *Новая рассылка*\n\n' +
      'Отправьте сообщение, которое хотите разослать всем пользователям.\n\n' +
      '⚠️ *Внимание:* Сообщение будет отправлено всем активным пользователям!\n\n' +
      'Для отмены нажмите кнопку ниже.',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Отменить', callback_data: 'admin_broadcast' }]
          ]
        }
      }
    );
  },

  // История рассылок
  broadcastHistoryCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    try {
      const history = await pool.query(
        `SELECT id, message_type, status, total_users, sent_count, failed_count, 
                created_at, completed_at 
         FROM mailings 
         ORDER BY id DESC 
         LIMIT 10`
      );
      
      let historyText = '📋 *История рассылок (последние 10):*\n\n';
      
      if (history.rows.length === 0) {
        historyText += 'Нет рассылок';
      } else {
        for (const m of history.rows) {
          const date = new Date(m.created_at).toLocaleString('ru-RU');
          const status = m.status === 'completed' ? '✅' : '⏳';
          historyText += `${status} *ID:* ${m.id}\n`;
          historyText += `   📅 ${date}\n`;
          historyText += `   👥 ${m.sent_count}/${m.total_users} (❌ ${m.failed_count})\n`;
          historyText += `   📝 Тип: ${m.message_type}\n\n`;
        }
      }
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(historyText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'admin_broadcast' }]
          ]
        }
      });
    } catch (err) {
      console.error('Broadcast history error:', err);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  },

  // Статистика рассылок
  broadcastStatsCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    try {
      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'sending' THEN 1 END) as sending,
          COALESCE(SUM(total_users), 0) as total_users,
          COALESCE(SUM(sent_count), 0) as sent,
          COALESCE(SUM(failed_count), 0) as failed
        FROM mailings
      `);
      
      const s = stats.rows[0];
      const successRate = s.total_users > 0 ? ((s.sent / s.total_users) * 100).toFixed(1) : 0;
      
      const statsText = `
📊 *Статистика рассылок*

📨 *Всего рассылок:* ${s.total}
• Завершено: ${s.completed}
• В процессе: ${s.sending}

👥 *Отправка сообщений:*
• Всего получателей: ${s.total_users}
• Успешно: ${s.sent}
• Ошибок: ${s.failed}
• Процент успеха: ${successRate}%

📅 *Обновлено:* ${new Date().toLocaleString('ru-RU')}
      `;
      
      await ctx.answerCbQuery();
      await ctx.editMessageText(statsText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'admin_broadcast' }]
          ]
        }
      });
    } catch (err) {
      console.error('Broadcast stats error:', err);
      await ctx.answerCbQuery('❌ Ошибка');
    }
  },

  // Настройки
  settingsCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '⚙️ *Настройки бота*\n\n' +
      `• Имя: *${config.BOT_NAME}*\n` +
      `• Username: *@${config.BOT_USERNAME}*\n` +
      `• Размер пакета: *${config.BATCH_SIZE}*\n` +
      `• Задержка: *${config.BATCH_DELAY}ms*\n` +
      `• Админы: *${config.ADMIN_IDS.join(', ')}*\n\n` +
      'Выберите действие:',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Обновить настройки', callback_data: 'settings_refresh' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }]
          ]
        }
      }
    );
  },

  // Обновление настроек
  settingsRefreshCallback: async (ctx) => {
    if (!config.ADMIN_IDS.includes(ctx.from.id)) {
      return ctx.answerCbQuery('⛔ Нет доступа');
    }
    
    // Перечитываем конфиг
    delete require.cache[require.resolve('../config')];
    const newConfig = require('../config');
    
    await ctx.answerCbQuery('✅ Настройки обновлены');
    await ctx.editMessageText(
      '⚙️ *Настройки обновлены*\n\n' +
      `• Имя: *${newConfig.BOT_NAME}*\n` +
      `• Username: *@${newConfig.BOT_USERNAME}*\n` +
      `• Размер пакета: *${newConfig.BATCH_SIZE}*\n` +
      `• Задержка: *${newConfig.BATCH_DELAY}ms*\n` +
      `• Админы: *${newConfig.ADMIN_IDS.join(', ')}*`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад к настройкам', callback_data: 'admin_settings' }]
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
  },

  // Возврат в главное меню
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
        ...adminMainMenu
      }
    );
  }
};
