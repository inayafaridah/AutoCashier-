import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AutoCashier backend listening on port ${PORT}`);
});
