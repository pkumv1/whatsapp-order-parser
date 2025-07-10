import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, Download, Trash2, Key, AlertCircle, FileText, Save, Check } from 'lucide-react';
import './App.css';

const WhatsAppOrderParser = () => {
  const [messages, setMessages] = useState('');
  const [parsedOrders, setParsedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Load API key and custom prompt from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key');
    const savedPrompt = localStorage.getItem('custom_prompt');
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySaved(true);
    }
    if (savedPrompt) {
      setCustomPrompt(savedPrompt);
    }
  }, []);

  // Save API key to localStorage
  const saveApiKey = () => {
    if (!apiKey.trim()) {
      setApiKeyError('Please enter a valid API key');
      return;
    }
    localStorage.setItem('groq_api_key', apiKey);
    setApiKeyError('');
    setApiKeySaved(true);
    
    // Show saved indicator
    setTimeout(() => {
      setApiKeySaved(false);
    }, 3000);
  };

  // Clear API key
  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('groq_api_key');
    setApiKeySaved(false);
  };

  // Save custom prompt to localStorage
  const saveCustomPrompt = () => {
    localStorage.setItem('custom_prompt', customPrompt);
    setPromptSaved(true);
    
    // Show saved indicator for 3 seconds
    setTimeout(() => {
      setPromptSaved(false);
    }, 3000);
  };

  // Parse with GROQ API
  const parseWithGroq = async (messageText) => {
    const baseSystemPrompt = `You are an order parser for a WhatsApp fruit and vegetable business. 
Extract orders from WhatsApp messages and return structured JSON data.

Each message follows pattern: [Date Time] Phone: Order details
Note: Some messages may span multiple lines. A new message starts with a timestamp in square brackets.

Products to look for:
- Ginger Tea (variations: ginger tea, Ginger tea)
- Masala Tea (variations: masala tea, masala chai, Masala Chai)
- Avocado (variations: avocado, avacado, avokado, Avacado)
- Dragon Fruit (variations: dragon fruit, Dragon fruit, dragon, Dragon)
- Cardamom

Special parsing rules:
1. "Dragon" alone refers to "Dragon Fruit"
2. "one kg each" or "1 kg each" means 1 kg for each product mentioned
3. Handle ellipsis (..., …) in messages
4. Ignore emojis
5. Multi-line messages: content continues until the next timestamp
6. If quantity is mentioned once for multiple products (e.g., "Avocado and Dragon fruit one kg each"), apply that quantity to each product

Extract:
- Date (DD-MM-YYYY format from square brackets)
- Time (HH:MM format from square brackets)
- Phone number (extract the full number after the time)
- Customer name (if mentioned after "for" or at end after dash)
- House number (format like A1-102, B1-324, A3-1319, etc. - may have hyphen or space)
- Products ordered (handle multiple products per message)
- Quantity for each product
- Unit (gm, kg, pieces)

Important: 
- If a message contains multiple products, create separate entries for each product with the same customer details.
- When "each" is used with quantity, apply that quantity to all mentioned products.
- Be flexible with house number formats (A1 102, A1-102, B1 324, etc.)`;

    // Append custom prompt if provided
    const systemPrompt = customPrompt.trim() 
      ? `${baseSystemPrompt}\n\nAdditional Instructions:\n${customPrompt}`
      : baseSystemPrompt;

    const finalSystemPrompt = `${systemPrompt}

Return a JSON object with an "orders" array where each order has these fields:
{
  "orders": [
    {
      "date": "DD-MM-YYYY",
      "time": "HH:MM",
      "phone": "+91XXXXXXXXXX",
      "customerName": "Name or Unknown",
      "houseNumber": "A1-1023 or Not specified",
      "product": "Product Name",
      "quantity": 250,
      "unit": "gm"
    }
  ]
}`;

    const userPrompt = `Parse these WhatsApp orders and return structured JSON:\n\n${messageText}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', // Updated to currently supported model
          messages: [
            { role: 'system', content: finalSystemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('GROQ API Error Response:', errorData);
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your GROQ API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 400 && errorData.includes('model_decommissioned')) {
          throw new Error('The AI model has been updated. Please refresh the page and try again.');
        } else {
          throw new Error(`API Error: ${response.status} - ${errorData}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from GROQ API');
      }
      
      const result = JSON.parse(data.choices[0].message.content);
      
      // Add price and amount fields (you can customize these)
      const ordersWithPricing = result.orders.map(order => ({
        ...order,
        pricePerUnit: 0,
        amount: 0
      }));
      
      return ordersWithPricing;
    } catch (error) {
      console.error('GROQ API Error:', error);
      throw error;
    }
  };

  // Helper function to remove emojis
  const removeEmojis = (text) => {
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };

  // Helper function to parse multi-line messages
  const parseMultiLineMessages = (text) => {
    // Split by newline but keep empty lines to track message boundaries
    const lines = text.split('\n');
    const messages = [];
    let currentMessage = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const messageMatch = line.match(/\[(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2})\]\s+(\+\d+\s+\d+\s+\d+):\s*(.+)/);
      
      if (messageMatch) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }
        // Start new message
        currentMessage = {
          date: messageMatch[1],
          time: messageMatch[2],
          phone: messageMatch[3],
          content: messageMatch[4]
        };
      } else if (currentMessage && line.trim()) {
        // Continue previous message (multi-line)
        currentMessage.content += ' ' + line.trim();
      }
    }
    
    // Don't forget the last message
    if (currentMessage) {
      messages.push(currentMessage);
    }
    
    return messages;
  };

  // Fallback parser (when no API key or API fails)
  const fallbackParser = (messageText) => {
    const messages = parseMultiLineMessages(messageText);
    const orders = [];
    
    for (const message of messages) {
      const { date, time, phone, content: rawContent } = message;
      
      // Remove emojis and clean content
      const content = removeEmojis(rawContent);
      
      const namePatterns = [
        /for\s+([A-Za-z]+)\s+[A-Z]\d/i,
        /[–-]\s*([A-Za-z]+)$/,
        /Good\s+morning\s+([A-Za-z]+)/i
      ];
      
      let customerName = '';
      for (const pattern of namePatterns) {
        const nameMatch = content.match(pattern);
        if (nameMatch) {
          customerName = nameMatch[1];
          break;
        }
      }
      
      // More flexible house number pattern
      const housePattern = /([A-Z]\d+[\s-]?\d+)/;
      const houseMatch = content.match(housePattern);
      const houseNumber = houseMatch ? houseMatch[1].replace(/\s+/, '-') : '';
      
      const products = [];
      
      let cleanContent = content
        .replace(houseNumber, '')
        .replace(/Good\s+morning\s+\w+\s*,?/i, '')
        .replace(/Book\s+/i, '')
        .replace(/for\s+\w+/i, '')
        .replace(/When\s+can\s+I\s+collect.*$/i, '')
        .replace(/Will\s+collect.*$/i, '')
        .replace(/[….]+/g, '') // Remove ellipsis
        .trim();
      
      // Extended product patterns with abbreviations
      const commonProducts = [
        { regex: /ginger\s*tea/i, name: 'Ginger Tea' },
        { regex: /masala\s*(?:tea|chai)/i, name: 'Masala Tea' },
        { regex: /(?:avocado|avacado|avokado)/i, name: 'Avocado' },
        { regex: /(?:dragon\s*fruit|dragon\s+(?!fruit))/i, name: 'Dragon Fruit' },
        { regex: /cardamom/i, name: 'Cardamom' }
      ];
      
      // Check for "X and Y ... one kg each" pattern
      const eachPattern = /(.+?)\s+and\s+(.+?)\s*[….]?\s*one\s+kg\s+each/i;
      const eachMatch = cleanContent.match(eachPattern);
      
      if (eachMatch) {
        // Handle "each" pattern
        const product1 = eachMatch[1].trim();
        const product2 = eachMatch[2].trim();
        
        for (const { regex, name } of commonProducts) {
          if (regex.test(product1) || (name === 'Dragon Fruit' && /dragon/i.test(product1))) {
            products.push({
              product: name,
              quantity: 1,
              unit: 'kg',
              pricePerUnit: 0,
              amount: 0
            });
          }
          if (regex.test(product2) || (name === 'Dragon Fruit' && /dragon/i.test(product2))) {
            products.push({
              product: name,
              quantity: 1,
              unit: 'kg',
              pricePerUnit: 0,
              amount: 0
            });
          }
        }
      } else {
        // Regular parsing
        for (const { regex, name } of commonProducts) {
          if (regex.test(cleanContent) || (name === 'Dragon Fruit' && /\bdragon\b/i.test(cleanContent))) {
            const quantityPatterns = [
              new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(kg|gm|gms|g|piece|pieces|pcs)?\\s*(?:of\\s+)?${regex.source}`, 'i'),
              new RegExp(`${regex.source}\\s*[-–]?\\s*(\\d+(?:\\.\\d+)?)\\s*(kg|gm|gms|g|piece|pieces|pcs)?`, 'i'),
              new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(kg|gm|gms|g|piece|pieces|pcs)?\\s*${regex.source}`, 'i')
            ];
            
            // Special pattern for abbreviated Dragon
            if (name === 'Dragon Fruit') {
              quantityPatterns.push(
                /(\d+(?:\.\d+)?)\s*(kg|gm|gms|g)?\s*dragon\b/i,
                /dragon\s*fruit?\s*(\d+(?:\.\d+)?)\s*(kg|gm|gms|g)?/i
              );
            }
            
            let quantity = '';
            let unit = '';
            
            for (const pattern of quantityPatterns) {
              const match = cleanContent.match(pattern);
              if (match) {
                if (match[1] && match[1].match(/\d/)) {
                  quantity = match[1];
                  unit = match[2] || '';
                } else if (match[2] && match[2].match(/\d/)) {
                  quantity = match[2];
                  unit = match[3] || '';
                }
                break;
              }
            }
            
            if (!quantity && name === 'Avocado') {
              const piecesMatch = cleanContent.match(/(\d+)\s*(?:piece|pieces|pcs)/i);
              if (piecesMatch) {
                quantity = piecesMatch[1];
                unit = 'pieces';
              }
            }
            
            if (unit) {
              unit = unit.toLowerCase();
              if (unit === 'gm' || unit === 'gms' || unit === 'g') {
                unit = 'gm';
              } else if (unit === 'piece' || unit === 'pcs') {
                unit = 'pieces';
              }
            }
            
            if (quantity) {
              // Avoid duplicate products
              const alreadyAdded = products.some(p => p.product === name);
              if (!alreadyAdded) {
                products.push({
                  product: name,
                  quantity: parseFloat(quantity),
                  unit: unit || (name === 'Avocado' ? 'pieces' : 'gm'),
                  pricePerUnit: 0,
                  amount: 0
                });
              }
            }
          }
        }
      }
      
      if (products.length > 0) {
        products.forEach(product => {
          orders.push({
            date,
            time,
            phone: phone.replace(/\s+/g, ''),
            customerName: customerName || 'Unknown',
            houseNumber: houseNumber || 'Not specified',
            product: product.product,
            quantity: product.quantity,
            unit: product.unit,
            pricePerUnit: product.pricePerUnit,
            amount: product.amount
          });
        });
      }
    }
    
    return orders;
  };

  const handleParse = async () => {
    if (!messages.trim()) {
      alert('Please paste WhatsApp messages to parse');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let parsed;
      
      if (apiKey) {
        try {
          parsed = await parseWithGroq(messages);
        } catch (error) {
          console.error('GROQ API failed, using fallback parser:', error);
          // Show more specific error message
          const errorMessage = error.message || 'GROQ API failed. Using fallback parser.';
          alert(errorMessage + '\n\nUsing fallback parser instead.');
          parsed = fallbackParser(messages);
        }
      } else {
        parsed = fallbackParser(messages);
      }
      
      setParsedOrders(parsed);
    } catch (error) {
      console.error('Error parsing messages:', error);
      alert('Error parsing messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages('');
    setParsedOrders([]);
  };

  const exportToCSV = () => {
    if (parsedOrders.length === 0) {
      alert('No orders to export');
      return;
    }

    const headers = ['Date', 'Time', 'Phone Number', 'Customer Name', 'House Number', 'Product', 'Quantity', 'Unit', 'Price per Unit', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...parsedOrders.map(order => 
        [
          order.date,
          order.time,
          order.phone,
          order.customerName,
          order.houseNumber,
          order.product,
          order.quantity,
          order.unit,
          order.pricePerUnit,
          order.amount
        ].map(field => `"${field}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">WhatsApp Order Parser</h1>
          <p className="text-gray-600">Transform your WhatsApp group messages into organized order data</p>
        </div>

        {/* API Key Section - Always visible */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Key className="text-green-600 mr-2" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">GROQ API Key (Optional)</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Enter your GROQ API key for AI-powered parsing. Get one from{' '}
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              console.groq.com
            </a>
          </p>
          
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              {apiKeySaved ? <Check size={20} className="mr-2" /> : <Save size={20} className="mr-2" />}
              {apiKeySaved ? 'Saved' : 'Save'}
            </button>
            {apiKey && (
              <button
                onClick={clearApiKey}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          
          {apiKeyError && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <AlertCircle size={16} className="mr-1" />
              {apiKeyError}
            </p>
          )}
          
          {apiKey && !apiKeyError && (
            <p className="text-green-600 text-sm mt-2">
              ✓ API key configured. AI parsing enabled.
            </p>
          )}
          
          <p className="text-amber-600 text-sm mt-2">
            Note: Using llama3-8b-8192 model (updated from deprecated mixtral-8x7b)
          </p>
        </div>

        {/* Custom Prompt Section - Always visible when API key is present */}
        {apiKey && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="text-green-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Custom Instructions (Optional)</h2>
              </div>
              <button
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showCustomPrompt ? 'Hide' : 'Show'}
              </button>
            </div>
            
            {showCustomPrompt && (
              <div>
                <p className="text-gray-600 mb-4">
                  Add custom instructions to help the AI better understand your specific products, formats, or parsing rules.
                </p>
                
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Example: Also look for products like Tomatoes, Potatoes, Onions. Customer names often appear after 'Delivered to:'. Handle messages in Hindi transliteration..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm mb-2"
                />
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={saveCustomPrompt}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    {promptSaved ? <Check size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
                    {promptSaved ? 'Saved' : 'Save Instructions'}
                  </button>
                  
                  {customPrompt && (
                    <p className="text-green-600 text-sm">
                      {customPrompt.length} characters • Active
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <MessageSquare className="text-green-600 mr-2" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Paste WhatsApp Messages</h2>
          </div>
          <p className="text-gray-600 mb-4">Copy and paste your WhatsApp group messages here to parse order information</p>
          
          <textarea
            value={messages}
            onChange={(e) => setMessages(e.target.value)}
            placeholder="Paste your WhatsApp messages here... Example: [07-07-2025 16:10] +91 96198 82148: Ginger tea 250 gm and masala tea 250gm A1 1023"
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm"
          />
          
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleParse}
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              <Sparkles className="mr-2" size={20} />
              {isLoading ? 'Parsing...' : `Parse Messages ${apiKey ? '(AI)' : '(Fallback)'}`}
            </button>
            
            <button
              onClick={handleClear}
              className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Trash2 className="mr-2" size={20} />
              Clear All
            </button>
          </div>
        </div>

        {/* Results Section */}
        {parsedOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Parsed Orders ({parsedOrders.length})</h2>
              <button
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="mr-2" size={20} />
                Export CSV
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Time</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Customer</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">House #</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedOrders.map((order, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{order.date}</td>
                      <td className="border border-gray-300 px-4 py-2">{order.time}</td>
                      <td className="border border-gray-300 px-4 py-2">{order.phone}</td>
                      <td className="border border-gray-300 px-4 py-2">{order.customerName}</td>
                      <td className="border border-gray-300 px-4 py-2">{order.houseNumber}</td>
                      <td className="border border-gray-300 px-4 py-2">{order.product}</td>
                      <td className="border border-gray-300 px-4 py-2">{order.quantity}</td>
                      <td className="border border-gray-300 px-4 py-2">{order.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppOrderParser;