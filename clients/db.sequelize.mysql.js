import {Sequelize} from 'sequelize';
import fs from 'fs/promises';
import path from 'path';

const caFilePath = path.resolve('./clients/certificates/ca.pem');
const {
  MYSQL_HOST,
  MYSQL_DATABASE,
  MYSQL_PASSWORD,
  MYSQL_USER,
  MYSQL_PORT,
} = process.env;

const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      ca: await fs.readFile(caFilePath),
      rejectUnauthorized: true
    }
  },
  logging: false, // Set to console.log to see SQL queries
});

try {
  await sequelize.authenticate();
  console.log('Database connection established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}
export default sequelize;

