describe("Event Pipeline", () => {
    // todo: write these unit tests.

    it('should properly call the preMapping Interceptors and passed the intercepted event to the Event Parsers', async () => {

    })

    it('should properly call the postMapping Interceptors after the Event Parsers are called and before the Event Dispatcher is being called', async () => {

    })

    it('should properly call the EventDispatcher in "sequential" order when the event parser returns "sequential".', async () => {

    })

    it('should properly call the EventDispatcher in "parallel" order when the event parser returns "parallel".', async () => {

    })

    it("should call the preResponseMapping Interceptors, and pass the intercepted EventResponse to the Event Parsers", async () => {

    })

    it("should call the postResponseMapping Interceptors before returning the final response", async () => {

    })

    it("should throw an error when no EventParsers support the event", async () => {

    })

    it("should throw an error if there are no events returned by any mappers", async () => {

    })
})
