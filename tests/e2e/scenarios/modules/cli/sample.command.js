"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.SampleCommand = void 0;
var tsyringe_1 = require("tsyringe");
var cli_1 = require("@pristine-ts/cli");
var common_1 = require("@pristine-ts/common");
var SampleCommand = /** @class */ (function () {
    function SampleCommand() {
        this.name = "sample";
    }
    SampleCommand.prototype.run = function (args) {
        console.log("should run");
        return Promise.resolve(cli_1.ExitCodeEnum.Success);
    };
    SampleCommand = __decorate([
        (0, common_1.tag)(common_1.ServiceDefinitionTagEnum.Command),
        (0, tsyringe_1.injectable)()
    ], SampleCommand);
    return SampleCommand;
}());
exports.SampleCommand = SampleCommand;
