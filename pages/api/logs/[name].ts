import type { NextApiRequest, NextApiResponse } from "next";
import ObjectsToCsv from "objects-to-csv";
import { uid } from "uid";
import { getPoolConnection } from "../../../lib/db";
import { AliveFiles } from "../../../lib/cache";

export default async function dashboardHandler(
  req: NextApiRequest,
  res: NextApiResponse<{ link: string }>
) {
  const { query } = req;
  const { name, from, to, svtag } = query as { name: string; from: string; to: string; svtag: string };

  const key = `log-${name}-${from}-${to}`;

  const conn = await getPoolConnection();

  let query_string = `SELECT type, message, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') as date FROM society_logs WHERE society = '${name}'`;

  const validFrom = Number(from)
  if (validFrom && validFrom > 0) {
    query_string += ` AND timestamp > '${new Date(validFrom).toISOString().slice(0, 19).replace('T', ' ')}'`;
  }

  const validTo = Number(to)
  if (validTo && validTo > 0) {
    query_string += ` AND timestamp < '${new Date(validTo).toISOString().slice(0, 19).replace('T', ' ')}'`;
  }

  const [society] = await conn.query(query_string);
  conn.release()

  const id = uid();

  new ObjectsToCsv(society).toDisk(`./${key}.csv`);

  AliveFiles.set(key, Date.now() + 1000 * 60 * 60) 

  return res.status(200).json({
		link: `/api/download/${key}.csv`,
  });
}
