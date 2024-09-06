import type { NextApiRequest, NextApiResponse } from "next";
import { getPoolConnection } from "../../../lib/db";
import ObjectsToCsv from "objects-to-csv";
import ms from "ms";
import type { RowDataPacket } from "mysql2";
import { AliveFiles } from "../../../lib/cache";
import { formatCSVPath } from "../../../lib/path";

interface Role {
	name: string;
	label: string;
}

type Job = {
	name: string;
	role: string;
};

type dbCharacter = {
	citizenid: string;
	charinfo: string;
	job: string;
	otherJobs: string;
	lastCompleted: string;
	lastDuty: string;
	lastReset: string;
	tasks: number;
	timeOnDuty: number;
};

type Character = {
	citizenid: string;
	charinfo: {
		firstname: string;
		lastname: string;
		phone: string;
		iban: string;
	};
	job: Job;
	otherJobs: Job[];
	lastCompleted: string;
	lastDuty: string;
	lastReset: string;
	tasks: number;
	timeOnDuty: number;
};

const dateFormats = {
	"EN-pub": "%m-%d-%Y %H:%i:%s",
	"PT-pub": "%d-%m-%Y %H:%i:%s",
	"PT-priv": "%d-%m-%Y %H:%i:%s",
};

export default async function dashboardHandler(req: NextApiRequest, res: NextApiResponse<{ link: string }>) {
	const { query } = req;
	const { name, svtag } = query as { name: string; svtag: string };

	if (!name) {
		return res.status(400).json({
			link: "",
		});
	}

	if (!AliveFiles.get(name)) {
		const dateFormat = dateFormats[svtag as string] ?? dateFormats["EN-pub"];

		const conn = await getPoolConnection();

		const [roles] = await conn.query<Role[] & RowDataPacket[][]>("SELECT name, label FROM society_roles WHERE society = ?", [name]);
		const [characters] = await conn.query<dbCharacter[] & RowDataPacket[][]>(
			`
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
        society_employee_statistics.citizenid = players.citizenid`,
			[name]
		);

		conn.release();

		const society = [];

		for (const character of characters) {
			const charinfo = JSON.parse(character.charinfo) as Character["charinfo"];
			let job = JSON.parse(character.job) as Character["job"];
			if (job.name !== name) {
				const otherJobs = JSON.parse(character.otherJobs) as Character["otherJobs"];
				job = otherJobs.find((job: Job) => job.name === name);
			}

			if (job) {
				const role = roles.find((role: Role) => role.name === job.role);

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
				});
			}
		}

    const csv = new ObjectsToCsv(society);

		await csv.toDisk(formatCSVPath(name));

		AliveFiles.set(name, Date.now() + 1000 * 60 * 60 );
    console.log(`${name} has been cached`);
	} else {
    console.log(`${name} in cache`)
  }

	return res.status(200).json({ link: `/api/download/${name}.csv` });
}