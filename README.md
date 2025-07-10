# WhatsApp Order Parser

A React application that parses WhatsApp group messages to extract and organize order information for small businesses. Built with GROQ AI integration for intelligent parsing.

## Features

- **AI-Powered Parsing**: Uses GROQ API for intelligent message parsing
- **Custom Instructions**: Add your own parsing rules and product definitions to the LLM
- **Fallback Parser**: Built-in parser works without API key
- **Multiple Product Support**: Handles orders with multiple products in a single message
- **Flexible Format Recognition**: Parses various message formats and order structures
- **CSV Export**: Export parsed orders as CSV files
- **Local Storage**: API key and custom prompts are saved locally

## Advanced Parsing Capabilities

- **Multi-line Messages**: Handles messages that span multiple lines
- **Emojis**: Automatically strips emojis from messages
- **Abbreviated Product Names**: Recognizes "Dragon" as "Dragon Fruit"
- **Ellipsis Handling**: Processes messages with "..." or "…"
- **Shared Quantities**: Understands "one kg each" applying to multiple products
- **Flexible House Numbers**: Recognizes various formats (A1-102, B1 324, A3 1319)

## Custom Instructions Feature

The app now includes a custom instructions field where you can:
- Add new products specific to your business
- Define custom parsing rules
- Handle messages in different languages or formats
- Specify unique customer name patterns
- Add special handling for your business needs

Example custom instructions:
```
Also look for these products:
- Tomatoes (variations: tomato, tamatar)
- Potatoes (variations: potato, aloo)
- Onions (variations: onion, pyaz)

Customer names often appear after "Delivered to:" or "For delivery to:"
Some messages may be in Hindi transliteration.
Prices are sometimes mentioned as "Rs" or "₹"
```

## Supported Products (Default)

- Ginger Tea
- Masala Tea / Masala Chai
- Avocado (handles variations: avocado, avacado, avokado)
- Dragon Fruit (also recognizes "Dragon" alone)
- Cardamom

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- GROQ API key (optional, but recommended for better parsing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pkumv1/whatsapp-order-parser.git
cd whatsapp-order-parser
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Getting a GROQ API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create a new API key
4. Copy the key (starts with `gsk_`)
5. Enter it in the app when prompted

## Deployment on Vercel

1. Fork or clone this repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

The app will be automatically deployed and you'll get a URL like `https://your-app-name.vercel.app`

## Usage

1. **Enter API Key** (optional):
   - On first load, enter your GROQ API key
   - Or click "Use Fallback Parser" to proceed without it

2. **Add Custom Instructions** (optional, requires API key):
   - Click "Show" in the Custom Instructions section
   - Add any specific products, parsing rules, or instructions
   - Instructions are automatically saved

3. **Paste WhatsApp Messages**:
   - Copy messages from your WhatsApp group
   - Paste them into the text area
   - Messages should include the timestamp and phone number

4. **Parse Orders**:
   - Click "Parse Messages"
   - Review the extracted order information

5. **Export Data**:
   - Click "Export CSV" to download the orders
   - Import into Excel or Google Sheets for further processing

## Message Format Examples

The parser handles various message formats:

```
Standard format:
[07-07-2025 16:10] +91 96198 82148: Ginger tea 250 gm and masala tea 250gm A1 1023

With ellipsis and shared quantity:
[10-07-2025 13:32] +91 94482 21132: Avacado and Dragon … one kg each . A1-102.

With emoji:
[10-07-2025 06:18] +91 94820 72265: 1 kg Avacado 1kg Dragon fruit B1 324😊

Multi-line message:
[10-07-2025 06:14] +91 90354 83811: 1 kg Avacado
1 kg Dragon fruit 
A3 1319

Complex order:
[09-07-2025 19:10] +91 98442 38802: A4-1215 - 1 kg avokado, 1kg dragon fruit.
```

## Development

### Project Structure

```
whatsapp-order-parser/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js          # Main component with parsing logic
│   ├── App.css         # Styles
│   ├── index.js        # React entry point
│   └── index.css       # Global styles
├── package.json
└── README.md
```

### Adding New Products

To add new products permanently, edit the `commonProducts` array in `src/App.js`:

```javascript
const commonProducts = [
  { regex: /ginger\s*tea/i, name: 'Ginger Tea' },
  { regex: /masala\s*(?:tea|chai)/i, name: 'Masala Tea' },
  // Add your new product here
  { regex: /your\s*product/i, name: 'Your Product' }
];
```

Or use the Custom Instructions feature to add products dynamically without code changes.

## Latest Updates

- **v0.3.0**: Added custom instructions feature
  - Users can now add custom parsing rules
  - Instructions are saved locally
  - Better support for business-specific needs

- **v0.2.0**: Enhanced parser to handle:
  - Multi-line messages
  - Emoji removal
  - Abbreviated product names
  - Ellipsis in messages
  - "One kg each" pattern
  - Flexible house number formats

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue on GitHub or contact the repository owner.