import { NextApiRequest, NextApiResponse } from 'next'
import { getDatabase } from '../../../lib/db'
import ObjectsToCsv from 'objects-to-csv'
import { uid } from 'uid';
import ms from 'ms'

interface Role {
  name: string,
  label: string,
}

type Job = {
  name: string,
  role: string,
}

type Character = {
  citizenid: string,
  charinfo: {
    firstname: string,
    lastname: string,
    phone: string,
    iban: string,
  },
  job: Job,
  otherJobs: Job[],
  lastCompleted: string,
  lastDuty: string,
  lastReset: string,
  tasks: number,
  timeOnDuty: number,
}

const dateFormats = {
  ['EN-pub']: '%m-%d-%Y %H:%i:%s',
  ['PT-pub']: '%d-%m-%Y %H:%i:%s',
  ['PT-priv']: '%d-%m-%Y %H:%i:%s',
}

export default async function dashboardHandler(
  req: NextApiRequest,
  res: NextApiResponse<{link: string}>
) {
  const { query } = req
  const { name, svtag } = query
  
  const pool = await getDatabase(svtag as string)
  const promisePoolRoles = pool.promise()
  const promisePoolPlayers = pool.promise()

  const dateFormat = dateFormats[svtag as string] || '%Y-%m-%d %H:%i:%s'
  const resultRole = await promisePoolRoles.query(`SELECT name, label FROM society_roles WHERE society = ?`, [name])
  const resultCharacters = await promisePoolPlayers.query(`
    SELECT 
      society_employee_statistics.citizenid, 
      players.charinfo AS charinfo,
      players.job AS job,
      players.otherJobs AS otherJobs,
      DATE_FORMAT(society_employee_statistics.lastCompleted, '${dateFormat}') as lastCompleted,
      DATE_FORMAT(society_employee_statistics.lastDuty, '${dateFormat}') as lastDuty,
      DATE_FORMAT(society_employee_statistics.lastReset, '${dateFormat}') as lastReset,
      society_employee_statistics.amount as tasks,
      society_employee_statistics.dutyTime as timeOnDuty
    FROM 
      society_employee_statistics 
    INNER JOIN
      players
    WHERE
      society = ?
    AND
      society_employee_statistics.citizenid = players.citizenid`, [name]
  ) 
      
  const roles = resultRole[0] as unknown as Role[]
  const characters = resultCharacters[0] as unknown as Character[]

  const society = []

  characters.forEach((character: any) => {
    character = character as Character
    const charinfo = JSON.parse(character.charinfo)
    let job = JSON.parse(character.job)
    if (job.name !== name) {
      const otherJobs = JSON.parse(character.otherJobs)
      job = otherJobs.find((job: any) => job.name === name)
    }

    if (!job) return

    const role = roles.find((role: any) => role.name === job.role) as unknown as Role

    society.push({
      citizenid: character.citizenid,
      name: `${charinfo.firstname} ${charinfo.lastname}`,
      phone: charinfo.phone,
      iban: charinfo.iban,
      role: role.label,
      lastCompleted: character.lastCompleted,
      lastDuty: character.lastDuty,
      lastReset: character.lastReset,
      tasks: character.tasks,
      timeOnDuty: ms(character.timeOnDuty),
    })
  })

  const id = uid()

  new ObjectsToCsv(society).toDisk(`./${id}.csv`)

  return res.status(200).json({ link: `/api/download/${id}.csv` })
}