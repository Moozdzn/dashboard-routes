import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req
    const { id } = query

    const data = fs.readFileSync(`./${id}`);
  
    res.setHeader("content-disposition", `attachment; filename="${id}"`);
    res.setHeader("content-type", "text/csv");
    res.send(data);

    fs.unlinkSync(`./${id}`)
  }
  
  export default handler;