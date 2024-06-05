export interface MysqlConfig {
    uniqueKeyname: string,
    host: string,
    port: number,
    user: string,
    password: string,
    connectionLimit: number,
    debug: boolean,
    database: string,
}