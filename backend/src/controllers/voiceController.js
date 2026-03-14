const pool = require('../config/db');

/**
 * POST /api/voice/process
 * Body: { transcript: "two chocolate ice cream and one vanilla cone" }
 *   OR  multipart form-data with audio file (for Whisper integration later)
 *
 * For now, parses plain transcript text into structured order items
 * matching against the menu_items table.
 */
const processVoiceOrder = async (req, res) => {
  try {
    // Accept either raw transcript text or a file (placeholder for Whisper)
    const transcript = req.body.transcript || '';
    if (!transcript) {
      return res.status(400).json({
        success: false,
        message: 'No transcript provided. Pass { transcript: "..." } in the request body.',
      });
    }

    // Fetch all available menu items
    const menuResult = await pool.query(
      'SELECT id, name, price FROM menu_items WHERE is_available = true'
    );
    const menuItems = menuResult.rows;

    // Parse transcript into items using keyword matching
    const parsedItems = parseTranscript(transcript.toLowerCase(), menuItems);

    if (!parsedItems.length) {
      return res.status(422).json({
        success: false,
        message: 'Could not match any menu items from the transcript.',
        transcript,
      });
    }

    res.json({
      success: true,
      transcript,
      items: parsedItems,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Simple NLP parser: matches quantity keywords and menu item names.
 * Example: "two chocolate ice cream and one vanilla cone"
 * → [{ menu_item_id, name, qty: 2 }, { menu_item_id, name, qty: 1 }]
 */
function parseTranscript(transcript, menuItems) {
  const numberWords = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };

  const results = [];

  for (const item of menuItems) {
    const itemName = item.name.toLowerCase();
    if (transcript.includes(itemName)) {
      // Try to find a number before the item name
      const regex = new RegExp(
        `(\\d+|${Object.keys(numberWords).join('|')})\\s+${itemName.replace(/\s+/g, '\\s+')}`,
        'i'
      );
      const match = transcript.match(regex);
      let qty = 1;
      if (match) {
        const numStr = match[1].toLowerCase();
        qty = numberWords[numStr] ?? parseInt(numStr) ?? 1;
      }
      results.push({ menu_item_id: item.id, name: item.name, qty, unit_price: item.price });
    }
  }

  return results;
}

module.exports = { processVoiceOrder };
