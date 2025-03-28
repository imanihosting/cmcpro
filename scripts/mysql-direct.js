require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateDatabase() {
  console.log('Connecting to database directly using mysql2...');
  
  // Parse the DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }
  
  // Parse the DATABASE_URL to extract connection info
  // Format: mysql://user:password@host:port/database
  const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (!urlMatch) {
    console.error('Invalid DATABASE_URL format');
    return;
  }
  
  const [_, user, password, host, port, database] = urlMatch;
  
  console.log(`Connecting to MySQL database: ${host}:${port}/${database}`);
  
  let connection;
  
  try {
    // Create the connection
    connection = await mysql.createConnection({
      host,
      port: parseInt(port, 10),
      user,
      password,
      database
    });
    
    console.log('Connected to database successfully');
    
    // Check current status
    const [rows] = await connection.execute(
      'SELECT subscriptionStatus, COUNT(*) as count FROM User GROUP BY subscriptionStatus'
    );
    
    console.log('Current subscription status counts:');
    console.table(rows);
    
    // Update PRO to PREMIUM
    const [proResult] = await connection.execute(
      'UPDATE User SET subscriptionStatus = "PREMIUM" WHERE subscriptionStatus = "PRO"'
    );
    
    console.log(`Updated ${proResult.affectedRows} users from PRO to PREMIUM`);
    
    // Update BASIC to PREMIUM
    const [basicResult] = await connection.execute(
      'UPDATE User SET subscriptionStatus = "PREMIUM" WHERE subscriptionStatus = "BASIC"'
    );
    
    console.log(`Updated ${basicResult.affectedRows} users from BASIC to PREMIUM`);
    
    // Update active to PREMIUM
    const [activeResult] = await connection.execute(
      'UPDATE User SET subscriptionStatus = "PREMIUM" WHERE subscriptionStatus = "active"'
    );
    
    console.log(`Updated ${activeResult.affectedRows} users from active to PREMIUM`);
    
    // Check final status
    const [finalRows] = await connection.execute(
      'SELECT subscriptionStatus, COUNT(*) as count FROM User GROUP BY subscriptionStatus'
    );
    
    console.log('Final subscription status counts:');
    console.table(finalRows);
    
    console.log('Database update completed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

updateDatabase(); 