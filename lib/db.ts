
const mysql = require('mysql2');
const Client = require('ssh2').Client;

const DB_OPTIONS = {
    user: process.env.SHARED_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.SHARED_HOST,
    port: process.env.SHARED_PORT,
};
const SSH_OPTIONS = {
    host: process.env.SHARED_HOST,
    port: process.env.SHARED_PORT,
    username: process.env.SHARED_USER,
    password: process.env.SSH_PASSWORD
};

let pools = {
    'EN-pub': null,
    'PT-pub': null,
}

let pool = null;
let database_ssh = null;

const ssh = new Client();

const createPool = (stream) => {
  pool || (pool = mysql.createPool(Object.assign(DB_OPTIONS, { stream })))
  return pool;
}

const databaseSSH = () => new Promise((resolve, reject) => {
  ssh.on('ready', () => {
    ssh.forwardOut(
      // source address, this can usually be any valid address
      '127.0.0.1',
      // source port, this can be any valid port number
      12345,
      // destination address (localhost here refers to the SSH server)
      'localhost',
      // destination port
      3306,
      (err, stream) => {
        if (err) return reject(err);

        try {
          const pool = createPool(stream);
          return resolve(pool);
        } catch (e) {
          return reject(e);
        }
      });
  }).connect(SSH_OPTIONS);
})

export const getDatabaseSSH = () => {
  if (database_ssh) return Promise.resolve(database_ssh);

  return databaseSSH()
    .then(connection => {
      database_ssh = connection;
      return database_ssh;
    })
    .catch(err => {
      database_ssh = null;
      throw err;
    });
}