module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '7140435844:AAGJVRUympF0xh_9kfCCQl4n32mb0zK_Bvo',
  ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(Number) : [346290276],
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '25'),
  BATCH_DELAY: parseInt(process.env.BATCH_DELAY || '1500'),
  BOT_USERNAME: 'gameenergybot',
  BOT_NAME: 'Game Energy Bot',
  BOT_DESCRIPTION: 'Бот для управления рассылками и контентом'
};
