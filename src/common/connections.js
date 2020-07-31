import { ConnectionManager, Credentials } from 'jellyfin-apiclient';

const CAPABILITIES = {
    PlayableMediaTypes: ['Audio'],
    SupportedCommands: [''],
    SupportsPersistentIdentifier: false,
    SupportsMediaControl: false,
};

const APP_NAME = "Preserve";
const APP_VERSION = "0.1.0";

const credentialProvider = new Credentials("preserve_auth");
export const connectionManager = new ConnectionManager(credentialProvider, APP_NAME, APP_VERSION, "Preserve Client #abcde", "ABCDE", CAPABILITIES);