import {InjectedClass} from "./injected-class.model";
import {injectable} from "tsyringe";

export class ResolvedClassModel {
    public constructor(private readonly injectedClass: InjectedClass) {
    }

    public getRandomNumber() {
        return this.injectedClass.randomNumber;
    }
}