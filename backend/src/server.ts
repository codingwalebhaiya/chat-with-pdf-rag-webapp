
import app from "./index.js"
import prisma from "./config/database.js"

const PORT = process.env.PORT || 3001;

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing server...');
  
  try {
    await prisma.$disconnect();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
});

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled Promise Rejection:', error);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});