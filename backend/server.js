import 'dotenv/config';
import app from './src/app.js';
import './src/db/pool.js';
import { logger } from './src/utils/logger.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`VAKVIC backend running on port ${PORT}`);
});
