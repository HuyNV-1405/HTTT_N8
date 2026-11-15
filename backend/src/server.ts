import { createApp } from './app';
import prisma from './config/prisma';

const PORT = process.env.PORT || 5000;
const app = createApp();

async function startServer() {
  try {
    // Kiểm tra kết nối Database
    await prisma.$connect();
    console.log('✅ Đã kết nối thành công đến cơ sở dữ liệu PostgreSQL!');

    app.listen(PORT, () => {
      console.log(`🚀 WMS Backend Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`📡 Healthcheck API: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Không thể khởi động server hoặc kết nối Database:', error);
    process.exit(1);
  }
}

startServer();

