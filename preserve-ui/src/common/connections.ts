import { ConnectionManager, Credentials } from 'jellyfin-apiclient';
import Bowser from 'bowser';
import { v4 as uuidv4 } from 'uuid';

const CAPABILITIES = {
    PlayableMediaTypes: ['Audio'],
    SupportedCommands: [''],
    SupportsPersistentIdentifier: false,
    SupportsMediaControl: false,
};

const savedClientId = window.localStorage.getItem('preserve_client_id');

let clientId = '';
if (window.localStorage && savedClientId) {
    clientId = savedClientId;
} else {
    clientId = uuidv4();
    if (window.localStorage) {
        window.localStorage.setItem('preserve_client_id', clientId);
    }
}

const browserDetails = Bowser.getParser(window.navigator.userAgent).getResult();

const clientName = `${browserDetails.browser.name}/${browserDetails.os.name}`;

const credentialProvider = new Credentials('preserve_auth');
export const connectionManager = new ConnectionManager(
    credentialProvider,
    APP_NAME,
    APP_VERSION,
    clientName,
    clientId,
    CAPABILITIES
);
