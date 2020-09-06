declare module 'jellyfin-apiclient' {
    class Credentials {
        constructor(storageKey: string);
    }

    interface Capabilities {
        PlayableMediaTypes: Array<string>;
        SupportedCommands: Array<string>;
        SupportsPersistentIdentifier: boolean;
        SupportsMediaControl: boolean;
    }

    interface QueryResult<T> {
        Items: Array<T>;
        TotalRecordCount: number;
        StartIndex: number;
    }

    interface Item {
        Id: string;
        Name: string;
        Type: string;
        MediaType: string;
        ServerId: string;
    }

    interface ArtistStub {
        Name: string;
        Id: string;
    }

    interface ImageTags {
        Primary?: string;
    }

    interface Artist extends Item {
        Type: 'MusicArtist';
    }

    interface Album extends Item {
        Artists: Array<string>;
        AlbumArtists: Array<ArtistStub>;
        AlbumArtist: string;
        ArtistItems: Array<ArtistStub>;
        ProductionYear: number;
        ImageTags: ImageTags;
        Type: 'MusicAlbum';
    }

    interface Track extends Item {
        Artists: Array<string>;
        AlbumArtists: Array<ArtistStub>;
        AlbumArtist: string;
        ArtistItems: Array<ArtistStub>;
        AlbumPrimaryImageTag: string;
        ProductionYear: number;
        AlbumId: string;
        Album: string;
        IndexNumber: number;
        ParentIndexNumber: number;
        RunTimeTicks: number;
        Type: 'Audio';
    }

    type AnyItem = Artist | Album | Track;

    enum ConnectionMode {
        Local = 0,
        Remote = 1,
        Manual = 2,
    }

    interface Server {
        Id: string;
        UserId: null | string;
        Name?: string;
        AccessToken: null | string;
        DateLastAccessed?: number;
        LastConnectionMode?: ConnectionMode;
    }

    interface LocalServerInfo {
        LocalAddress?: string;
    }

    interface ManualServerInfo {
        ManualAddress?: string;
    }

    interface RemoteServerInfo {
        RemoteAddress?: string;
    }

    interface ConnectionResult {
        State: string;
    }

    interface FailedConnectionResult extends ConnectionResult {
        State: 'Unavailable';
    }

    interface OutdatedConnectionResult extends ConnectionResult {
        State: 'ServerUpdateNeeded';
        Servers: Array<Server>;
    }

    interface SuccessfulConnectionResult extends ConnectionResult {
        Servers: Array<Server>;
        ApiClient: ApiClient;
    }

    interface LoggedInConnectionResult extends SuccessfulConnectionResult {
        State: 'SignedIn';
        AccessToken: string;
    }

    interface LoggedOutConnectionResult extends SuccessfulConnectionResult {
        State: 'ServerSignIn';
    }

    interface ConnectOptions {
        enableAutoLogin?: boolean;
        enableAutomaticBitrateDetection?: boolean;
        reportCapabilities?: boolean;
        enableWebSocket?: boolean;
    }

    type ServerConnectionResult =
        | OutdatedConnectionResult
        | FailedConnectionResult
        | LoggedInConnectionResult
        | LoggedOutConnectionResult
        | ConnectionResult;

    interface ServerSelectResult extends ConnectionResult {
        State: 'ServerSelection';
        Servers: Array<ServerInfo>;
    }

    type ServersConnectionResult =
        | OutdatedConnectionResult
        | FailedConnectionResult
        | LoggedInConnectionResult
        | LoggedOutConnectionResult
        | ServerSelectResult
        | ConnectionResult;

    type ServerInfo = LocalServerInfo | ManualServerInfo | RemoteServerInfo;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- https://github.com/typescript-eslint/typescript-eslint/issues/1772
    class ConnectionManager {
        constructor(
            credentials: Credentials,
            appName: string,
            appVersion: string,
            clientName: string,
            clientId: string,
            capabilities: Capabilities
        );
        connectToServer(
            info: ServerInfo,
            options?: ConnectOptions
        ): Promise<ServerConnectionResult>;
        connectToServers(
            infos: Array<ServerInfo>,
            options?: ConnectOptions
        ): Promise<ServersConnectionResult>;
        getLastUsedServer(): Server;
        getSavedServers(): Array<ServerInfo>;
        getOrCreateApiClient(serverId: string): ApiClient;
        logout(): Promise<void>;
    }

    interface User {
        Name: string;
        Id: string;
        ServerId: string;
        LastLoginDate: string;
        LastActivityDate: string;
    }

    interface AuthenticateUserResult {
        ServerId: string;
        AccessToken: string;
        User: User;
    }

    interface QueryOptions {
        Limit?: number;
        SortBy?: string;
        SortOrder?: string;
        recursive?: boolean;
        IncludeItemTypes?: string;
        StartIndex?: number;
    }

    class ApiClient {
        accessToken(): string;
        authenticateUserByName(
            username: string,
            password: string
        ): Promise<AuthenticateUserResult>;
        deviceId(): string;
        getCurrentUserId(): string;
        getItems<T extends Item>(
            userId: string,
            options: QueryOptions
        ): Promise<QueryResult<T>>;
        getArtists(
            userId: string,
            options?: QueryOptions
        ): Promise<QueryResult<Artist>>;
        getUrl(
            name: string,
            params?: { [name: string]: string },
            serverAddress?: string
        ): string;
        serverId(): string | undefined;
    }
}
