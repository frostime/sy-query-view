import { ILute, setLute } from "@/utils/lute";

let lute: ILute = null;

export const initLute = () => {
    if (lute) return;
    lute = setLute({});
}

export const getLute = () => {
    return lute;
}
