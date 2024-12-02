import {
    Plugin,
    type App,
} from "siyuan";
import "@/index.scss";
import * as DataQuery from "./core";
import * as Setting from "./setting";

let i18n: I18n;
let app: App;

export default class QueryView extends Plugin {

    async onload() {
        i18n = this.i18n as I18n;
        app = this.app;
        Setting.load(this);
        DataQuery.load(this);
    }

    async onunload() {
        DataQuery.unload(this);
    }
}

export { i18n, app };
