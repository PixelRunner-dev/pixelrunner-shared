import type { UUID } from "../types.d.ts";
import type { IAppletDetails, IAppletImage, ICategory } from "./index.ts";

type AppletSchemaTypes =
  | "color"
  | "datetime"
  | "dropdown"
  | "generated"
  | "location"
  | "locationbased"
  | "notification"
  | "oauth2"
  | "photoselect"
  | "text"
  | "onoff"
  | "typeahead";

type AppletConfigurationValues = string | number | boolean | object;

export type IAppletSchemaObject = {
  type: AppletSchemaTypes;
  id: string;
  name: string;
  description: string;
  icon: string;
  default?: AppletConfigurationValues;
  handler?: string;

  // Color
  palette?: string[];

  // Dropdown
  options?: {
    display: string;
    value: AppletConfigurationValues;
  };

  // Generated
  source?: string;

  // OAuth2
  clientId?: string;
  authorizationEndpoint?: string;
  scopes?: string[];

  // Test
  secret?: boolean;
};

export type IAppletSchema = {
  version: string;
  notifications: [];
  schema: IAppletSchemaObject[];
};

export type IAppletViews =
  | "horizontal"
  | "vertical"
  | "full-detail"
  | "preview";

export interface IAppletConfigurations {
  appId: string;
  config: {
    [key: string]: AppletConfigurationValues | AppletConfigurationValues[];
  };
}

export interface IAppletRecord {
  details: IAppletDetails;
  fileName: string;
  packageName: string;
  // schema?: {
  //   [key: string]: AppletSchema;
  // };
}

export interface IInstalledAppletRecord {
  uuid: UUID;
  appliedConfigurations?: IAppletConfigurations;
  isHidden?: boolean;
  isPinned?: boolean;
}

export interface IFullAppletRecord extends IAppletRecord {
  installedApplet?: IInstalledAppletRecord;
}

export interface IApplet extends IAppletRecord {
  defaultImage: IAppletImage;
  categories: ICategory[];
}

export interface IInstalledApplet extends IInstalledAppletRecord {
  image: IAppletImage;
}

export interface IFullApplet extends IApplet {
  installedApplet?: IInstalledApplet;
}
