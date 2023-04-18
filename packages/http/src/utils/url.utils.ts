import { URL } from 'url';

export class UrlUtils {
    static appendLocationHeaderToUrl(url: URL, locationHeader: string): URL {
        if(locationHeader.startsWith("/")) {
            url.pathname = locationHeader;
            return url;
        }

        return new URL(locationHeader);
    }
}