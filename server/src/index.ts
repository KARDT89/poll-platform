import * as http from 'node:http';
import 'dotenv/config';
import { createExpressApplication } from './app/index.js';
import { initSocket } from './app/socket/index.js';

async function main() {
  try {
    const server = http.createServer(createExpressApplication());
    const PORT: number = process.env.PORT ? Number(process.env.PORT) : 8080;

    initSocket(server)

    server.listen(PORT, () => {
      console.log(`server is running at http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

main();
