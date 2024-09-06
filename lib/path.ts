import path from "node:path";

export const formatCSVPath = (fileName: string) => path.join(process.cwd(), "temp", `${fileName}.csv`);