import { NextApiRequest, NextApiResponse } from 'next'
import type { Society, ResponseError } from '../../../interfaces'
import { getDatabaseSSH } from '../../../lib/db'
import ObjectsToCsv from 'objects-to-csv'
import { uid } from 'uid';

export default async function dashboardHandler(
  req: NextApiRequest,
  res: NextApiResponse<{link: string}>
) {
  const { query } = req
  const { name } = query

  const pool = await getDatabaseSSH()
  const society: Society | ResponseError = await new Promise((resolve, reject)  => {
    pool.query(`SELECT * FROM society_employee_statistics WHERE society = '${name}'`, (err, result) => {
      if (err) return reject(err)
      return resolve(result)
    })
  })

  const id = uid()

  new ObjectsToCsv(society).toDisk(`./${id}.csv`)

  return res.status(200).json({ link: `${process.env.NEXT_PUBLIC_VERCEL_URL}/api/download/${id}.csv` })
}