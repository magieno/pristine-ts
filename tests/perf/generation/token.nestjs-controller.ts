import { Controller, Get, Post, Put, Patch, Delete, Param, Body } from '@nestjs/common';

@Controller("/api/1.0")
export class __TOKEN_CAPITALIZED__Controller {
    constructor() {
    }

    @Get("/__TOKEN_PLURAL__")
    public list() {
    }

    @Post("/__TOKEN_PLURAL__")
    public add(@Body() body: any) {
    }

    @Get("/__TOKEN_PLURAL__/:id")
    public get(@Param("id") id: string) {
    }

    @Put("/__TOKEN_PLURAL__/:id")
    public update(@Body() body: any, @Param("id") id: string) {
    }

    @Patch("/__TOKEN_PLURAL__/:id")
    public partialUpdate(@Body() body: any, @Param("id") id: string) {
    }

    @Delete("/__TOKEN_PLURAL__/:id")
    public delete(@Param("id") id: string) {
    }
}
