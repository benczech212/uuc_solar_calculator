import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API constraints for updating parameters
  const getUpdateFunction = (lockedKeys: string[]): FunctionDeclaration => {
    return {
      name: "updateSolarParams",
      description: "Updates the solar engine parameters based on user request. Do NOT override parameters that the user has explicitly locked.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          panelWattage: { type: Type.INTEGER, description: "Panel wattage in W (100 to 1000)" },
          numberOfPanels: { type: Type.INTEGER, description: "Number of panels (1 to 500)" },
          costPerWatt: { type: Type.NUMBER, description: "Cost per watt in dollars" },
          totalSystemSizeKw: { type: Type.NUMBER, description: "Total system size in kW" },
          totalGrossCost: { type: Type.NUMBER, description: "Total gross cost in dollars" },
          rebates: { type: Type.NUMBER, description: "Tax rebates and credits in dollars" },
          monthlyUsageKwh: { type: Type.INTEGER, description: "Flat monthly power usage in kWh" },
          utilityRate: { type: Type.NUMBER, description: "Utility rate in $/kWh" },
          annualBillIncrease: { type: Type.NUMBER, description: "Annual bill increase percentage" },
          batteryCapacityKwh: { type: Type.NUMBER, description: "Battery capacity in kWh" },
          batteryCostPerKwh: { type: Type.NUMBER, description: "Battery cost in $/kWh" },
          sellBackRate: { type: Type.NUMBER, description: "Sell-back rate in $/kWh" },
          annualMaintenanceCost: { type: Type.NUMBER, description: "Annual maintenance cost in dollars" },
          hasMaintenance: { type: Type.BOOLEAN, description: "Whether maintenance costs should be included" },
          gridRenewablePercentage: { type: Type.NUMBER, description: "Percentage of grid power that comes from renewable sources (0 to 100)" },
          messageDetails: { type: Type.STRING, description: "A conversational message explaining what you changed and why, to show to the user" }
        },
        required: ["messageDetails"]
      }
    };
  };

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, params, lockedKeys, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API Key is missing. Check server configuration." });
      }

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      const contents = [];
      // Combine history 
      if (history && history.length > 0) {
        history.forEach((msg: any) => {
           contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] });
        });
      }
      
      const systemInstruction = `You are the AI Assistant for the UUC Solar ROI Calculator. Your job is to help the user configure their solar parameters or explain the data.
The current parameters are:
${JSON.stringify(params, null, 2)}
The following parameters are LOCKED by the user and you MUST NOT change them: [${lockedKeys.join(", ")}]

When the user asks to change the configuration, call the updateSolarParams function with only the ones that were changed. Do NOT change locked parameters.
Provide a conversational response acknowledging the changes or answering any data-related question.`;

      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [getUpdateFunction(lockedKeys)] }],
        }
      });
      
      let functionCall = null;
      let textResponse = "";
      
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.functionCall && part.functionCall.name === 'updateSolarParams') {
            functionCall = part.functionCall.args;
          } else if (part.text) {
             textResponse += part.text + " ";
          }
        }
      }
      
      res.json({
        text: textResponse.trim() || functionCall?.messageDetails || "Updated.",
        functionCall
      });
      
    } catch (err: any) {
      console.error(err);
      
      const errorMessage = typeof err.message === 'string' ? err.message.toLowerCase() : '';
      if (err.status === 429 || err.status === 'RESOURCE_EXHAUSTED' || errorMessage.includes('quota') || errorMessage.includes('429')) {
         return res.status(429).json({ error: "The AI assistant is currently experiencing high demand and has exceeded its quota limits. Please try again later." });
      }
      
      res.status(500).json({ error: "An unexpected error occurred while processing your request. Please try again." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
