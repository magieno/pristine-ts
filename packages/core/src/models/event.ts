import { v4 as uuidv4 } from 'uuid';

/**
 * This model defines what an Event is in the Pristine library.
 * Once an event parsed, this should be the only object that will be handle inside the library.
 */
export class Event<Payload> {
    public id: string = uuidv4();
    constructor(public type: string, public payload: Payload, id?: string) {
      if(id) {
        this.id = id;
      }
    }
}
