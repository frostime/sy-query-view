import {
    Plugin,
} from "siyuan";
import "@/index.scss";
import * as DataQuery from "./core";
import * as Setting from "./setting";

let i18n: I18n;

export default class QueryView extends Plugin {

    async onload() {
        i18n = this.i18n as I18n;
        Setting.load(this);
        DataQuery.load(this);
    }

    async onunload() {
        DataQuery.unload(this);
    }
}

export { i18n };
