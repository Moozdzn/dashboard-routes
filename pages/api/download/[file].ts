import type { NextApiRequest, NextApiResponse } from "next";
import { createReadStream, unlink, constants, access } from "node:fs";
import { AliveFiles } from "../../../lib/cache";
import { formatCSVPath } from "../../../lib/path";

async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { query } = req;
	const { file } = query as { file: string };

	if (!file) {
		return res.status(400).json({ error: "missing parameters" });
	}

	const [fileName] = file.split(".");

	console.log(`Downloading ${fileName}..`, file);

	if (!fileName || !AliveFiles.has(fileName)) {
		return res.status(400).json({
			error: "file not found",
		});
	}

	const filePath = formatCSVPath(fileName);

	const fileStream = createReadStream(filePath);

	res.setHeader("content-disposition", `attachment; filename="${file}"`);
	res.setHeader("content-type", "text/csv");

	fileStream.pipe(res);

	fileStream.on("error", () => {
		res.end();
	});

	fileStream.on("end", () => {
		res.end();

		if (Date.now() > AliveFiles.get(fileName)) {
			access(filePath, constants.F_OK, (err) => {
				if (err) return console.log(err);

				AliveFiles.delete(fileName); 

				unlink(filePath, (err) => {
					if (err) return console.log(err);
					console.log(`${fileName}.csv file deleted`);
				});
			});
		}
	});
}

export default handler;
