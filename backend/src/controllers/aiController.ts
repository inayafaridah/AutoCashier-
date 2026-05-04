import { Request, Response } from 'express';
import * as aiService from '../services/aiService';
import * as overviewService from '../services/overviewService';
import * as productService from '../services/productService';

export async function getInsight(req: Request, res: Response) {
  try {
    const { prompt, contextType, location_id = 'ALL' } = req.body;

    if (!prompt) {
      return res.status(400).json({ status: 'error', error: 'Prompt is required' });
    }

    let context = null;

    // Fetch relevant context based on contextType
    if (contextType === 'inventory') {
      const products = await productService.getAllProducts();
      context = { products: products.data, location: location_id };
    } else if (contextType === 'overview') {
      const overview = await overviewService.getOverviewData({ location_id, timeframe: 'weekly' });
      context = { overview: overview.data, location: location_id };
    }

    const result = await aiService.generateAIInsight(prompt, context);

    if (!result.ok) {
      return res.status(500).json({ status: 'error', error: result.error });
    }

    return res.json({ status: 'success', data: result.text });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
}

export async function getAutoAnalysis(req: Request, res: Response) {
  try {
    const { location_id = 'ALL' } = req.body;

    const overview = await overviewService.getOverviewData({ location_id, timeframe: 'weekly' });
    const products = await productService.getAllProducts();
    
    const context = {
      location: location_id === 'ALL' ? 'Global Network' : `Branch ID: ${location_id}`,
      overview: overview.data,
      inventory: products.data
    };

    const prompt = `Perform a strategic analysis for ${location_id === 'ALL' ? 'the entire network' : 'branch ' + location_id}. 
    Provide an executive summary, detected anomalies, and actionable advice based on the provided business data.
    Tone: Professional, Insightful, and Action-Oriented.`;

    const result = await aiService.generateAIInsight(prompt, context);

    if (!result.ok) {
      return res.status(500).json({ status: 'error', error: result.error });
    }

    return res.json({ status: 'success', data: result.text });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
}
