export class ConsoleReadlineOptions {
    showCharactersOnTyping: boolean = true;

    constructor(options: Partial<ConsoleReadlineOptions>) {
        this.showCharactersOnTyping = options.showCharactersOnTyping ?? this.showCharactersOnTyping;
    }
}