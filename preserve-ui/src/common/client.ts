import Bowser from 'bowser';
import { v4 as uuidv4 } from 'uuid';
const STORAGE_KEY_CLIENT_ID = 'preserve_client_id';

export function getClientName(): string {
    const browserDetails = Bowser.getParser(
        window.navigator.userAgent
    ).getResult();

    return `${browserDetails.browser.name}/${browserDetails.os.name}`;
}

export function getOrGenerateClientId(): string {
    const savedClientId = window.localStorage.getItem(STORAGE_KEY_CLIENT_ID);

    let clientId = '';
    if (window.localStorage && savedClientId) {
        clientId = savedClientId;
    } else {
        clientId = uuidv4();
        if (window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);
        }
    }

    return clientId;
}
