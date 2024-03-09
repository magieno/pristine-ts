import {injectable, inject} from "tsyringe";
import {HttpModuleKeyname} from "../http.module.keyname";
import http, {IncomingMessage, Server} from "http";
import fs from "fs";
import path from "path";
import url from "url";
import {LogHandlerInterface} from "@pristine-ts/logging";

@injectable()
export class FileHttpServer {
    private server?: Server;

    constructor(@inject(`%${HttpModuleKeyname}.http-server.file.address%`) private readonly address: string,
                @inject(`%${HttpModuleKeyname}.http-server.file.port%`) private readonly port: number,
                @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
                ) {
    }

    private getPort(): number {
        if(this.port) {
            return this.port;
        }

        // Will bind to an open port if you specify 0.
        return 0;
    }

    async start(directory: string, port?: number, address?: string, listeningCallback?: (port?: number, address?: string) => void, requestCallback?:(req: IncomingMessage) => void) {
        port = port ?? this.getPort();
        address = address ?? this.address;

        return new Promise<void>((resolve, reject) => {
            this.server = http.createServer( (req: IncomingMessage, res) => {
                if(req.url === undefined)  {
                    this.logHandler.error("URL undefined, skipping.", {req, directory, port, address})
                    return;
                }

                requestCallback?.(req);

                this.logHandler.info("Request received: " + req.url, {req, directory, port, address});

                // parse URL
                const parsedUrl = url.parse(req.url);
                // extract URL path
                let pathname = path.join(directory, `${parsedUrl.pathname}`);
                // based on the URL path, extract the file extension. e.g. .js, .doc, ...
                const ext = path.parse(pathname).ext;
                // maps file extension to MIME typere
                const map: {[key in string]: string} = {
                    ".aac": "audio/aac",
                    ".abw": "application/x-abiword",
                    ".arc": "application/x-freearc",
                    ".avi": "video/x-msvideo",
                    ".azw": "application/vnd.amazon.ebook",
                    ".bin": "application/octet-stream",
                    ".bmp": "image/bmp",
                    ".bz": "application/x-bzip",
                    ".bz2": "application/x-bzip2",
                    ".csh": "application/x-csh",
                    ".css": "text/css",
                    ".csv": "text/csv",
                    ".doc": "application/msword",
                    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ".eot": "application/vnd.ms-fontobject",
                    ".epub": "application/epub+zip",
                    ".gif": "image/gif",
                    ".htm": "text/html",
                    ".html": "text/html",
                    ".ico": "image/vnd.microsoft.icon",
                    ".ics": "text/calendar",
                    ".jar": "application/java-archive",
                    ".jpeg": "image/jpeg",
                    ".jpg": "image/jpeg",
                    ".js": "text/javascript",
                    ".json": "application/json",
                    ".jsonld": "application/ld+json",
                    ".mid": "audio/midi",
                    ".midi": "audio/midi",
                    ".mjs": "text/javascript",
                    ".mp3": "audio/mpeg",
                    ".mp4": "video/mp4",
                    ".mpeg": "video/mpeg",
                    ".mpkg": "application/vnd.apple.installer+xml",
                    ".odp": "application/vnd.oasis.opendocument.presentation",
                    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
                    ".odt": "application/vnd.oasis.opendocument.text",
                    ".oga": "audio/ogg",
                    ".ogv": "video/ogg",
                    ".ogx": "application/ogg",
                    ".otf": "font/otf",
                    ".png": "image/png",
                    ".pdf": "application/pdf",
                    ".php": "application/php",
                    ".ppt": "application/vnd.ms-powerpoint",
                    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    ".rar": "application/vnd.rar",
                    ".rtf": "application/rtf",
                    ".sh": "application/x-sh",
                    ".svg": "image/svg+xml",
                    ".swf": "application/x-shockwave-flash",
                    ".tar": "application/x-tar",
                    ".tif": "image/tiff",
                    ".tiff": "image/tiff",
                    ".ts": "video/mp2t",
                    ".ttf": "font/ttf",
                    ".txt": "text/plain",
                    ".vsd": "application/vnd.visio",
                    ".wav": "audio/wav",
                    ".weba": "audio/webm",
                    ".webm": "video/webm",
                    ".webp": "image/webp",
                    ".woff": "font/woff",
                    ".woff2": "font/woff2",
                    ".xhtml": "application/xhtml+xml",
                    ".xls": "application/vnd.ms-excel",
                    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ".xml": "application/xml",
                    ".xul": "application/vnd.mozilla.xul+xml",
                    ".zip": "application/zip",
                    ".3gp": "video/3gpp",
                    ".3g2": "video/3gpp2",
                    ".7z": "application/x-7z-compressed"
                };

                fs.exists(pathname, function (exist) {
                    if(!exist) {
                        // if the file is not found, return 404
                        res.statusCode = 404;
                        res.end(`File ${pathname} not found!`);
                        return;
                    }

                    // if is a directory search for index file matching the extension
                    if (fs.statSync(pathname).isDirectory()) pathname += 'index' + ext;

                    // read file from file system
                    fs.readFile(pathname, function(err, data){
                        if(err){
                            res.statusCode = 500;
                            res.end(`Error getting the file: ${err}.`);
                        } else {
                            // if the file is found, set Content-type and send data
                            res.setHeader('Content-type', map[ext] ?? 'text/plain' );
                            res.end(data);
                        }
                    });
                });

            }).listen(port, address, () => {
                this.logHandler.info("Server started on port: " + port);

                listeningCallback?.(port, address);
            }).on('close', () =>{
                return resolve();
            });
        });
    }

    async stop() {
        return new Promise<void>((resolve, reject) => {
            if(this.server) {
                this.server.close(() => {
                    this.logHandler.info("Server stopped.");
                    return resolve();
                });
            }
            else {
                return resolve();
            }
        });
    }
}