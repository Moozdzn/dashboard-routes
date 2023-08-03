import { NextApiRequest, NextApiResponse } from "next";
import type { Society, ResponseError } from "../../../interfaces";
import { getDatabaseSSH } from "../../../lib/db";
import ObjectsToCsv from "objects-to-csv";
import { uid } from "uid";

export default async function dashboardHandler(
  req: NextApiRequest,
  res: NextApiResponse<{ link: string }>
) {
  const { query } = req;
  const { name, from, to } = query;

  const pool = await getDatabaseSSH();

  let query_string = `SELECT type, message, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') as date FROM society_logs WHERE society = '${name}'`;

  const validFrom = Number(from)
  if (validFrom && validFrom > 0) {
    query_string += ` AND timestamp > '${new Date(validFrom).toISOString().slice(0, 19).replace('T', ' ')}'`;
  }

  const validTo = Number(to)
  if (validTo && validTo > 0) {
    query_string += ` AND timestamp < '${new Date(validTo).toISOString().slice(0, 19).replace('T', ' ')}'`;
  }

  const society: Society | ResponseError = await new Promise(
    (resolve, reject) => {
      pool.query(query_string, (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      });
    }
  );

  const id = uid();

  new ObjectsToCsv(society).toDisk(`./${id}.csv`);

  return res
    .status(200)
    .json({
      link: `/api/download/${id}.csv`,
    });
}
