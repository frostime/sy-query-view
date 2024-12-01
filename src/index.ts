import {
    Plugin,
} from "siyuan";
import "@/index.scss";
import * as DataQuery from "./data-query";
import * as Setting from "./setting";

export let i18n;

export default class QueryView extends Plugin {

    async onload() {
        i18n = this.i18n;
        Setting.load(this);
        DataQuery.load(this);
    }

    async onunload() {
        DataQuery.unload(this);
    }
}
