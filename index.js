const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const WELLNESS_GUIDE_LINK = 'https://healyourbodynaturally1.github.io/Holistic-Wellness-Tips/';
const AMAZON_LINK = 'https://amzn.to/4weTAQa';

const PUBLIC_REPLIES = ['Check your DMs! 👇', 'Sent you a message! 📬', 'See what I sent you 👉', 'Slide into your DMs! 💬', 'Message sent! 💌', 'Check your inbox! 📩'];

function getFirstName(name) { return name.split(' ')[0]; }

function getMessage1(firstName) {
  return `Hi ${firstName}! 👋\n\nHere's the detailed Wellness Tips & Guide:\n\n✨ 5 Nutrition Recipes\n✨ Daily Routine\n✨ Movement & Mindfulness\n✨ Sustainable Wellness\n\n${WELLNESS_GUIDE_LINK}\n\nLet me know!`;
}

function getMessage2() {
  return `Hope you're enjoying tips! 💚\n\nHere's what makes difference: combine practices with natural support.\n\nThat's why clients use Serene Herbs Soursop Bitters daily.\n\n🌿 Supports healthy digestion\n🌿 Easy to take daily\n🌿 Works with balanced nutrition\n\nReady? ${AMAZON_LINK}\n\nQuestions? Reply!`;
}

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ WEBHOOK VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post('/webhook', async (req, res) => {
  const body = req.body;
console.log('🔍 WEBHOOK RECEIVED:', JSON.stringify(body, null, 2));
  if (body.object === 'page') {
    for (const entry of body.entry) {
      const changes = entry.changes;
      if (changes) {
        for (const change of changes) {
          if (change.field === 'feed') {
            const value = change.value;
            if (value.comment_id && value.message) {
              const commentText = value.message;
              const commentId = value.comment_id;
              const commenterId = value.from?.id;
              const commenterName = value.from?.name;

              console.log(`📝 Comment: "${commentText}" from ${commenterName}`);

              if (commentText && commentText.toUpperCase().includes('YES')) {
                console.log(`✅ Detected "YES" from ${commenterName}`);

                try {
                  await replyToComment(commentId);
                  if (commenterId) {
                    await sendMessage(commenterId, commenterName, 1);
                    setTimeout(() => {
                      sendMessage(commenterId, commenterName, 2);
                    }, 60000);
                  }
                } catch (error) {
                  console.error('❌ Error:', error);
                }
              }
            }
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

async function replyToComment(commentId) {
  try {
    const randomReply = PUBLIC_REPLIES[Math.floor(Math.random() * PUBLIC_REPLIES.length)];
    await axios.post(`https://graph.facebook.com/v18.0/${commentId}/comments`, {
      message: randomReply,
      access_token: PAGE_ACCESS_TOKEN
    });
    console.log(`✅ Public reply sent: "${randomReply}"`);
  } catch (error) {
    console.error('❌ Error replying:', error);
  }
}

async function sendMessage(userId, userName, messageNumber) {
  try {
    const firstName = getFirstName(userName);
    const messageText = messageNumber === 1 ? getMessage1(firstName) : getMessage2();

    await axios.post(`https://graph.facebook.com/v18.0/me/messages`, {
      recipient: { id: userId },
      message: { text: messageText },
      access_token: PAGE_ACCESS_TOKEN
    });
    console.log(`✅ Message ${messageNumber} sent to ${userName}`);
  } catch (error) {
    console.error(`❌ Error sending message:`, error);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🤖 BOT RUNNING ON PORT ${PORT}\n`);
});
