import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON body
  app.use(express.json({ limit: '10mb' }));

  // Lazy-initialize Gemini SDK to avoid crashing on startup if the API key is not yet set
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not defined in Secrets.');
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // API Endpoint: AI CFO Report Generator
  app.post('/api/ai-cfo', async (req, res) => {
    try {
      const {
        products = [],
        logs = [],
        expenses = [],
        staff = [],
        totalInventoryValue = 0,
        totalRevenue = 0,
        totalExpenses = 0,
        netProfit = 0,
        totalKgsBought = 0,
        totalKgsSold = 0,
        staffSalariesVal = 0,
        loggedExpensesVal = 0,
        stockPurchaseExpenses = 0,
        language = 'English',
        timelineLabel = 'All-Time',
        startDate = '',
        endDate = ''
      } = req.body;

      const ai = getGeminiClient();

      const prompt = `You are StockFlow AI's expert Chief Financial Officer (CFO) for Sri Mallikarjuna Industries. 
Analyze the following business metrics, inventory status, staff details, and expenses ledger for the SPECIFIED TIMELINE: "${timelineLabel}" ${startDate && endDate ? `(From: ${startDate} To: ${endDate})` : ''}.
Provide a detailed, highly structured CFO Review specifically focusing on this timeframe. Make sure you reference the exact kilograms bought and sold, the staff salaries, and other expenses in your response.

Include:
1. Executive Summary: A concise health check of the business during this timeline.
2. Revenue & Expenses Audit: Assess cash flow of this specific period, highlighting high spending or low sales. Explain how much was spent on raw stock purchase vs other operating costs and staff salaries.
3. Inventory & Operations Analysis: Identify how many kilograms were bought versus sold. Assess low stock, overstocked items, and staff attendance efficiency during this period.
4. Actionable CFO Recommendations: 3 specific, concrete strategies (styled with bullet points) tailored for this timeline to minimize leaks, improve margins, or boost profits.

Output your full report in ${language === 'Telugu' ? 'Telugu (తెలుగు భాషలో)' : 'English'}.
Use clear Markdown formatting with headings, bold text, and clean lists. Avoid referencing system variables or raw code.

Timeline Context: ${timelineLabel} ${startDate && endDate ? `(From ${startDate} to ${endDate})` : ''}
Current Business Ledger Metrics for this timeline:
- Currency: Indian Rupee (₹)
- Period Total Revenue: ₹${totalRevenue}
- Period Total Expenses: ₹${totalExpenses} (Stock Purchase: ₹${stockPurchaseExpenses}, Staff Salaries: ₹${staffSalariesVal}, Other Expenses: ₹${loggedExpensesVal})
- Period Net Profit/Loss: ₹${netProfit}
- Snapshot Total Inventory Asset Value: ₹${totalInventoryValue}
- Volume Bought (IN): ${totalKgsBought} kg
- Volume Sold (OUT): ${totalKgsSold} kg

Active Inventory:
${products.length === 0 ? 'No products registered.' : JSON.stringify(products.map((p: any) => ({ name: p.name, stockKg: p.stock, cost: p.costPerKg, status: p.status })))}

Expenses Records of this period:
${expenses.length === 0 ? 'No expenses registered.' : JSON.stringify(expenses)}

Staff & Attendance:
${staff.length === 0 ? 'No staff registered.' : JSON.stringify(staff)}

Recent System Activities of this period:
${logs.length === 0 ? 'No activities recorded.' : JSON.stringify(logs.slice(0, 10).map((l: any) => l.message))}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      });

      const reportText = response.text || 'CFO report generation yielded no output.';
      res.json({ report: reportText });
    } catch (err: any) {
      console.error('Error generating AI CFO report:', err);
      res.status(500).json({ error: err.message || 'Failed to generate report' });
    }
  });

  // Serve Vite or Static files depending on environment
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
});
