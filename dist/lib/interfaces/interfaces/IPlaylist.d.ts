import type { UUID } from "../types.d.ts";
import type { IInstalledApplet } from "./index.ts";

export interface IPlaylist {
  uuid: UUID;
  name: string;
  applets: IInstalledApplet[];
  dateCreated: Date;
  dateModified?: Date;
}
