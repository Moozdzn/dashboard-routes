import { NextApiRequest, NextApiResponse } from 'next'
import type { Society, ResponseError } from '../../../interfaces'
import { getDatabase } from '../../../lib/db'
import ObjectsToCsv from 'objects-to-csv'
import { uid } from 'uid';
import type { Pool } from "mysql2";

export default async function dashboardHandler(
  req: NextApiRequest,
  res: NextApiResponse<{link: string}>
) {
  const { query } = req
  const { name } = query
  const svTag = req.headers['server-tag'] as string;
  
  const pool: Pool = await getDatabase(svTag)
  const society = await new Promise((resolve, reject)  => {
    pool.query(`SELECT * FROM society_employee_statistics WHERE society = '${name}'`, (err, result) => {
      if (err) return reject(err)
      return resolve(result)
    })
  })

  const id = uid()

  new ObjectsToCsv(society).toDisk(`./${id}.csv`)

  return res.status(200).json({ link: `/api/download/${id}.csv` })
}