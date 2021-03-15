export class Utils {

    static flatTypes = [String, Number, Boolean, Date]

    public static isDefined(val){
        return val !== null && val !== undefined;
    }

    public static isFlat(val) {
        return !this.isDefined(val) || ~this.flatTypes.indexOf(val.constructor)
    }

    public static truncate(object: any, maxDepth: number, curDepth = 0){
        if (curDepth < maxDepth) {
            const newDepth = curDepth + 1;

            if (this.isFlat(object)) {
                return object;
            } else if (Array.isArray(object)) {
                const newArr: any[] = [];
                object.map(value => {
                    if (this.isFlat(value)) {
                        newArr.push(value);
                    } else {
                        newArr.push(this.truncate(value, maxDepth, newDepth));
                    }
                })
                return newArr;
            } else {
                const newObj = {}
                for (const key in object) {
                    if (this.isFlat(object[key])) {
                        newObj[key] = object[key];
                    } else {
                        newObj[key] = this.truncate(object[key], maxDepth, newDepth);
                    }
                }
                return newObj;
            }
        }

        return;
    }
}
