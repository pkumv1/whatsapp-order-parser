# WhatsApp Order Parser

A React application that parses WhatsApp group messages to extract and organize order information for small businesses. Built with GROQ AI integration for intelligent parsing.

## Features

- **AI-Powered Parsing**: Uses GROQ API for intelligent message parsing
- **Fallback Parser**: Built-in parser works without API key
- **Multiple Product Support**: Handles orders with multiple products in a single message
- **Flexible Format Recognition**: Parses various message formats and order structures
- **CSV Export**: Export parsed orders as CSV files
- **Local API Key Storage**: Secure browser-based storage for API keys

## Supported Products

- Ginger Tea
- Masala Tea / Masala Chai
- Avocado (handles variations: avocado, avacado, avokado)
- Dragon Fruit
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

2. **Paste WhatsApp Messages**:
   - Copy messages from your WhatsApp group
   - Paste them into the text area
   - Messages should include the timestamp and phone number

3. **Parse Orders**:
   - Click "Parse Messages"
   - Review the extracted order information

4. **Export Data**:
   - Click "Export CSV" to download the orders
   - Import into Excel or Google Sheets for further processing

## Message Format Examples

```
[07-07-2025 16:10] +91 96198 82148: Ginger tea 250 gm and masala tea 250gm A1 1023
[09-07-2025 19:10] +91 98442 38802: A4-1215 - 1 kg avokado, 1kg dragon fruit.
[09-07-2025 19:12] +91 96876 89501: 4 pieces of avacado 1 kg of dragon fruit B4 1216
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

To add new products, edit the `commonProducts` array in `src/App.js`:

```javascript
const commonProducts = [
  { regex: /ginger\s*tea/i, name: 'Ginger Tea' },
  { regex: /masala\s*(?:tea|chai)/i, name: 'Masala Tea' },
  // Add your new product here
  { regex: /your\s*product/i, name: 'Your Product' }
];
```

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue on GitHub or contact the repository owner.