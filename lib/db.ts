import { createPool } from "mysql2";
import type { Pool } from "mysql2";
const Client = require("ssh2").Client;

const SV_TAGS: Record<string, {ssh?: any, db: any}> = {
  "EN-pub": {
    ssh: {
      host: process.env.EN_SSH_HOST,
      port: process.env.EN_SSH_PORT,
      username: process.env.SHARED_USER,
      password: process.env.EN_SSH_PASSWORD,
    },
    db: {
      host: process.env.EN_SSH_HOST,
      port: process.env.EN_SSH_PORT,
      user: process.env.SHARED_USER,
      password: process.env.EN_DB_PASSWORD,
      database: process.env.EN_DB_NAME,
    },
  },
  "PT-pub": {
    db: {
      host: process.env.PT_PUB_HOST,
      port: process.env.PT_PUB_PORT,
      user: process.env.SHARED_USER,
      password: "",
      database: 'altf4',
    },
  },
  "PT-priv": {
    db: {
      host: process.env.PT_PUB_HOST,
      port: process.env.PT_PUB_PORT,
      user: process.env.SHARED_USER,
      password: "",
      database: 'altf4_privado',
    },
  },
};

const pools = {};

const ssh = new Client();

const database = (svtag: keyof typeof SV_TAGS): Promise<Pool> =>
  new Promise((resolve, reject) => {
    if (SV_TAGS[svtag].ssh) {
        ssh.on("ready", () => {
            ssh.forwardOut(
            // source address, this can usually be any valid address
            "127.0.0.1",
            // source port, this can be any valid port number
            12345,
            // destination address (localhost here refers to the SSH server)
            "localhost",
            // destination port
            3306,
            (err, stream) => {
                if (err) return reject(err);

                try {
                    const pool = createPool(Object.assign(SV_TAGS[svtag].db, {stream}));
                    return resolve(pool);
                } catch (e) {
                    return reject(e);
                }
            }
            );
        }).connect(SV_TAGS[svtag].ssh);
    } else {
        try {
            const pool = createPool(SV_TAGS[svtag].db);
            return resolve(pool);
        } catch (e) {
            return reject(e);
        }
    }
  });

export const getDatabase = (svtag: keyof typeof SV_TAGS): Promise<Pool> => {
  if (pools[svtag]) return Promise.resolve(pools[svtag]);

  return database(svtag)
    .then((connection) => {
        pools[svtag] = connection;
        return connection;
    })
    .catch((err) => {
        throw err;
    });
};
