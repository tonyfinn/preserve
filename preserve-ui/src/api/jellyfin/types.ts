export enum ConnectionMode {
    Local = 0,
    Remote = 1,
    Manual = 2,
}

export interface LegacySavedServer {
    Id: string;
    UserId: null | string;
    Name?: string;
    AccessToken: null | string;
    DateLastAccessed?: number;
    LastConnectionMode?: ConnectionMode;
}

export interface LocalServerInfo {
    LocalAddress?: string;
}

export interface ManualServerInfo {
    ManualAddress?: string;
}

export interface RemoteServerInfo {
    RemoteAddress?: string;
}

export type LegacyServerInfo =
    | LocalServerInfo
    | ManualServerInfo
    | RemoteServerInfo;

export function isRemoteServer(
    serverInfo: LegacyServerInfo
): serverInfo is RemoteServerInfo {
    return (serverInfo as RemoteServerInfo).RemoteAddress !== undefined;
}

export interface ServerDefinition {
    id: string;
    address: string;
    name?: string;
    accessToken?: string;
    userId?: string;
}
