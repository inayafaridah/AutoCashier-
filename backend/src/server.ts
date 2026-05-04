import app from './app';
import RealtimeVisionService from './services/realtimeVisionService';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AutoCashier backend listening on port ${PORT}`);
  
  // Start the optimized AI scanner background process
  RealtimeVisionService.getInstance().startScanner();
});
