import { ConnectionManager, Credentials } from 'jellyfin-apiclient';
import { getClientName, getOrGenerateClientId } from './client';
import { STORAGE_KEY_LEGACY_SERVERS } from './constants';

const CAPABILITIES = {
    PlayableMediaTypes: ['Audio'],
    SupportedCommands: [''],
    SupportsPersistentIdentifier: false,
    SupportsMediaControl: false,
};
const credentialProvider = new Credentials(STORAGE_KEY_LEGACY_SERVERS);
export const connectionManager = new ConnectionManager(
    credentialProvider,
    APP_NAME,
    APP_VERSION,
    getClientName(),
    getOrGenerateClientId(),
    CAPABILITIES
);
