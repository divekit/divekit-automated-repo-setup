import { IndividualSelectionCollection } from "../content_variation/selections/IndividualSelectionCollection";
import { IndividualVariation } from "../content_variation/IndividualVariation";

export class IndividualRepository {

    constructor (public id?: string,
        public members?: string[],
        public individualSelectionCollection?: IndividualSelectionCollection,
        public individualVariation?: IndividualVariation) { }

    public compareMembers(otherMembers: string[] | undefined): boolean {
        if (!(this.members && otherMembers)) {
            return false;
        }

        if (this.members.length != otherMembers.length) {
            return false;
        }

        for (let i = 0; i < this.members.length; i++) {
            if (this.members[i] != otherMembers[i]) {
                return false;
            }
        }

        return true;
    }

    public getMembersList(): string {
        let nameList = "";
        
        if (this.members) {
            for (let i = 0; i < this.members.length; i++) {
                nameList = nameList + this.members[i];
                if (i != this.members.length - 1) {
                    nameList = nameList + ", ";
                }
            }
        }

        return nameList;
    }
}