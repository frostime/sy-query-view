/**
 * siyuan-skill.skd.ts
 *
 * 单文件 Plugin-owned Skill runtime。
 *
 * 使用：
 *
 *   const skills = createSiYuanSkillRuntime({ pluginName: this.name });
 *
 *   // 唯一写入口：声明、检查 ownership，并按 plugin version 自动同步。
 *   const r = await skills.registerPluginSkill("skills/task");
 *   if (!r.ok) console.error(r.code, r.error);
 *
 *   // 读取任意已安装 Skill：返回目录、文件及文本内容。
 *   const s = await skills.loadSkill("task");
 *
 *   // 精确读文件；二进制资源可显式读取。
 *   const f = await skills.readSkillFile("task", "assets/icon.png", "binary");
 *
 * 路径契约：
 *
 *   skillDir 相对于编译后的 /data/plugins/<pluginName>/。
 *
 *   /data/plugins/my-plugin/
 *   ├── plugin.json
 *   ├── index.js
 *   └── skills/task/
 *       ├── SKILL.md
 *       ├── references/api.md
 *       └── assets/icon.png
 *
 *   registerPluginSkill("skills/task")
 *
 *   source -> /data/plugins/my-plugin/skills/task
 *   target -> /data/storage/ai/agent/skills/task
 *
 *   Skill 名称直接取目录名 task；不再传 name/files。
 *
 * 同步契约：
 *
 *   target 不存在                                      -> installed
 *   target 存在但无本模块 manifest                      -> OWNERSHIP_CONFLICT
 *   manifest.plugin.name !== 当前插件                  -> OWNERSHIP_CONFLICT
 *   manifest.plugin.version === plugin.json.version    -> current
 *   manifest.plugin.version !== plugin.json.version    -> updated
 *
 * 不做 hash、不比较文件、不做 semver；version 只按字符串全等判断。
 * 修改插件内 bundled Skill 后，应 bump plugin.json.version。
 *
 * manifest 与 Skill 共置：
 *
 *   /data/storage/ai/agent/skills/task/
 *   ├── SKILL.md
 *   ├── .siyuan-plugin-skill.json
 *   └── ...
 *
 * plugin version 变化时，整个 target 被视为插件发布物并重新发布。
 * 发布先在 /data/temp 中完成整目录复制和 manifest 写入，再改名为 target：
 * 中断时旧 target 保持完整，或暂时缺失并在下次注册时重新安装，不会留下半成品。
 * 同 version 下 runtime 不触碰 target，也不检测用户修改。
 *
 * 文件边界：
 * - bundle 可以含文本和二进制；
 * - 不跟随 symlink；
 * - source 不允许自带 .siyuan-plugin-skill.json；
 * - loadSkill 默认只解码文本，二进制仍出现在结构中；
 * - readSkillFile(..., "binary") 可读取原始 Uint8Array。
 *
 * public async API 均返回 { ok: boolean, ... }，运行期 I/O 错误不向外 throw。
 * 内部仅使用思源 Kernel 文件 API：getFile、putFile、readDir、removeFile、
 * workspaceCopyFiles、renameFile。
 */

export const PLUGIN_SKILL_MANIFEST = ".siyuan-plugin-skill.json";
export const SIYUAN_SKILLS_ROOT = "/data/storage/ai/agent/skills";

const MANAGED_BY = "siyuan-skill-sdk";
const MANIFEST_VERSION = 1;

export type SkillErrorCode =
  | "INVALID_ARGUMENT" | "PLUGIN_METADATA_INVALID" | "SOURCE_NOT_FOUND"
  | "SKILL_INVALID" | "SYMLINK_UNSUPPORTED" | "OWNERSHIP_CONFLICT"
  | "MANIFEST_INVALID" | "SKILL_NOT_FOUND" | "FILE_NOT_FOUND"
  | "NOT_TEXT_FILE" | "READ_FAILED" | "WRITE_FAILED";

export interface SkillFailure {
  ok: false;
  code: SkillErrorCode;
  error: string;
  skillName?: string;
  path?: string;
}

export interface PluginSkillManifest {
  schemaVersion: 1;
  managedBy: "siyuan-skill-sdk";
  plugin: { name: string; version: string };
  skill: { name: string; source: string };
  syncedAt: string;
}

export interface LoadedSkillFile {
  path: string;
  kind: "text" | "binary";
  role: "entry" | "control" | "reference" | "resource" | "script" | "other";
  content?: string;
}

export type RegisterPluginSkillResult =
  | {
      ok: true;
      action: "installed" | "updated" | "current";
      skillName: string;
      pluginVersion: string;
      sourceDir: string;
      targetDir: string;
    }
  | SkillFailure;

export type LoadSkillResult =
  | {
      ok: true;
      skill: {
        name: string;
        root: string;
        directories: string[];
        files: LoadedSkillFile[];
        entry: LoadedSkillFile;
        manifest?: PluginSkillManifest;
      };
    }
  | SkillFailure;

export type ReadSkillFileResult =
  | {
      ok: true;
      skillName: string;
      path: string;
      kind: "text" | "binary";
      content?: string;
      data?: Uint8Array;
    }
  | SkillFailure;

interface DirEntry {
  isDir: boolean;
  isSymlink: boolean;
  name: string;
}

interface ScanResult {
  directories: string[];
  files: string[];
}

interface KernelResult<T> {
  code: number;
  msg: string;
  data: T;
}

const TEXT_EXT = new Set([
  "md","mdx","txt","json","jsonc","yaml","yml","toml","ini","cfg","conf",
  "xml","html","htm","css","scss","less","csv","tsv","js","mjs","cjs","jsx",
  "ts","mts","cts","tsx","py","rb","php","java","kt","kts","go","rs","c","h",
  "cc","cpp","hpp","cs","swift","sh","bash","zsh","fish","ps1","bat","cmd",
  "sql","graphql","gql","vue","svelte","properties","env","gitignore","dockerignore",
]);

export class SiYuanSkillRuntime {
  readonly pluginName: string;
  readonly skillsRoot: string;
  private readonly pluginRoot: string;
  private pluginMeta?: Promise<{ name: string; version: string }>;

  constructor(options: { pluginName: string; skillsRoot?: string }) {
    this.pluginName = oneName(options.pluginName, "pluginName");
    this.pluginRoot = `/data/plugins/${this.pluginName}`;
    this.skillsRoot = dataPath(options.skillsRoot ?? SIYUAN_SKILLS_ROOT, "skillsRoot");
  }

  /** 插件侧唯一写入口：register = ownership check + version reconcile。 */
  async registerPluginSkill(skillDir: string): Promise<RegisterPluginSkillResult> {
    let dir: string, skillName: string;
    try {
      dir = relPath(skillDir, "skillDir");
      skillName = oneName(base(dir), "skillName");
    } catch (e) {
      return fail("INVALID_ARGUMENT", e);
    }

    const sourceDir = join(this.pluginRoot, dir);
    const targetDir = join(this.skillsRoot, skillName);
    const manifestPath = join(targetDir, PLUGIN_SKILL_MANIFEST);
    const stagingRoot = join("/data/temp/siyuan-plugin-skill-sdk", this.pluginName, skillName);
    const stagedSkillDir = join(stagingRoot, skillName);

    let plugin: { name: string; version: string };
    try {
      plugin = await this.getPluginMeta();
    } catch (e) {
      return fail("PLUGIN_METADATA_INVALID", e, undefined, join(this.pluginRoot, "plugin.json"));
    }

    let source: ScanResult;
    try {
      source = await scan(sourceDir);
      if (!source.files.includes("SKILL.md")) {
        return fail("SKILL_INVALID", "Skill source must contain SKILL.md.", skillName, sourceDir);
      }
      if (source.files.includes(PLUGIN_SKILL_MANIFEST)) {
        return fail("SKILL_INVALID", `Source must not contain reserved ${PLUGIN_SKILL_MANIFEST}.`, skillName, sourceDir);
      }
      if (!(await getText(join(sourceDir, "SKILL.md"))).trim()) {
        return fail("SKILL_INVALID", "SKILL.md must not be empty.", skillName, join(sourceDir, "SKILL.md"));
      }
    } catch (e) {
      if (e instanceof SymlinkError) return fail("SYMLINK_UNSUPPORTED", e, skillName, e.path);
      return fail(is404(e) ? "SOURCE_NOT_FOUND" : "READ_FAILED", e, skillName, sourceDir);
    }

    let exists: boolean;
    try {
      exists = await dirExists(targetDir);
    } catch (e) {
      return fail("READ_FAILED", e, skillName, targetDir);
    }

    if (exists) {
      const owned = await this.readManifest(manifestPath);
      // 注意：项目 tsconfig 为 strict:false，`ok` 字面量判别无法窄化，
      // 故用 `in` 操作符做存在性窄化（strict 下两者皆可）。
      if (!("manifest" in owned)) return fail(owned.code, owned.error, skillName, manifestPath);

      const old = owned.manifest;
      if (old.plugin.name !== this.pluginName) {
        return fail("OWNERSHIP_CONFLICT", `Skill "${skillName}" is owned by plugin "${old.plugin.name}".`, skillName, targetDir);
      }
      if (old.skill.name !== skillName) {
        return fail("MANIFEST_INVALID", `Manifest skill name "${old.skill.name}" does not match "${skillName}".`, skillName, manifestPath);
      }

      // 唯一同步判据：插件版本一致即视为已同步（版本变更才重新发布整包）。
      // 开发模式例外：dev 构建注入了 DEV_MODE 环境变量（vite define 编译期替换），
      // 开发期插件版本不变，但 SKILL 内容会频繁修改，因此 dev 下忽略 version 判据，
      // 每次注册都执行一次完整同步。
      const devMode = !!process.env.DEV_MODE;  // vite define 编译期替换为字面量，无运行时 process 依赖
      if (!devMode && old.plugin.version === plugin.version) {
        return { ok: true, action: "current", skillName, pluginVersion: plugin.version, sourceDir, targetDir };
      }
    }

    const manifest: PluginSkillManifest = {
      schemaVersion: 1,
      managedBy: "siyuan-skill-sdk",
      plugin,
      skill: { name: skillName, source: dir },
      syncedAt: new Date().toISOString(),
    };

    try {
      // Kernel 在一次请求中递归复制整个目录。复制和 manifest 都在临时目录完成，
      // 因而插件重载不会在正式 Skill 目录中留下可见的半成品。
      await removeIfExists(stagingRoot);
      await copyWorkspaceFiles([sourceDir], stagingRoot);
      await putText(join(stagedSkillDir, PLUGIN_SKILL_MANIFEST), JSON.stringify(manifest, null, 2) + "\n");

      // renameFile 不覆盖已有路径。先删除旧发布物再改名；若两步间中断，
      // target 只是暂时缺失，下次 register 会按 installed 路径自行恢复。
      await removeIfExists(targetDir);
      await renameFile(stagedSkillDir, targetDir);
      await removeIfExists(stagingRoot);
    } catch (e) {
      // 不清理 target：交换前它仍是完整旧版本，交换后它已是完整新版本。
      try { await removeIfExists(stagingRoot); } catch {}
      return fail("WRITE_FAILED", e, skillName, targetDir);
    }

    return {
      ok: true,
      action: exists ? "updated" : "installed",
      skillName,
      pluginVersion: plugin.version,
      sourceDir,
      targetDir,
    };
  }

  /** 读取任意已安装 Skill 的结构；默认同时加载可识别的 UTF-8 文本。 */
  async loadSkill(
    skillName: string,
    options: { loadTextContent?: boolean } = {},
  ): Promise<LoadSkillResult> {
    let name: string;
    try { name = oneName(skillName, "skillName"); }
    catch (e) { return fail("INVALID_ARGUMENT", e); }

    const root = join(this.skillsRoot, name);
    let found: ScanResult;

    try { found = await scan(root); }
    catch (e) {
      if (e instanceof SymlinkError) return fail("SYMLINK_UNSUPPORTED", e, name, e.path);
      return fail(is404(e) ? "SKILL_NOT_FOUND" : "READ_FAILED", e, name, root);
    }

    if (!found.files.includes("SKILL.md")) {
      return fail("SKILL_INVALID", "Installed Skill does not contain SKILL.md.", name, root);
    }

    const files: LoadedSkillFile[] = [];
    try {
      for (const path of found.files) {
        const kind = isText(path) ? "text" : "binary";
        files.push({
          path,
          kind,
          role: role(path),
          content: kind === "text" && (options.loadTextContent ?? true)
            ? await getText(join(root, path))
            : undefined,
        });
      }
    } catch (e) {
      return fail("READ_FAILED", e, name, root);
    }

    const entry = files.find(f => f.path === "SKILL.md")!;
    const mf = files.find(f => f.path === PLUGIN_SKILL_MANIFEST)?.content;
    const parsed = mf ? parseManifest(mf) : undefined;

    return {
      ok: true,
      skill: {
        name,
        root,
        directories: found.directories,
        files,
        entry,
        manifest: parsed?.ok ? parsed.manifest : undefined,
      },
    };
  }

  /** 精确读取单个文件。mode=auto 按扩展名区分文本/二进制。 */
  async readSkillFile(
    skillName: string,
    file: string,
    mode: "auto" | "text" | "binary" = "auto",
  ): Promise<ReadSkillFileResult> {
    let name: string, relative: string;
    try {
      name = oneName(skillName, "skillName");
      relative = relPath(file, "file");
    } catch (e) {
      return fail("INVALID_ARGUMENT", e);
    }

    const path = join(this.skillsRoot, name, relative);
    let bytes: Uint8Array;
    try { bytes = await getBytes(path); }
    catch (e) { return fail(is404(e) ? "FILE_NOT_FOUND" : "READ_FAILED", e, name, path); }

    const kind = mode === "auto" ? (isText(relative) ? "text" : "binary") : mode;
    if (kind === "binary") {
      return { ok: true, skillName: name, path: relative, kind: "binary", data: bytes };
    }

    try {
      return { ok: true, skillName: name, path: relative, kind: "text", content: decode(bytes) };
    } catch {
      return fail("NOT_TEXT_FILE", `File "${relative}" is not valid UTF-8 text.`, name, path);
    }
  }

  private async getPluginMeta(): Promise<{ name: string; version: string }> {
    if (!this.pluginMeta) {
      this.pluginMeta = (async () => {
        const json = JSON.parse(await getText(join(this.pluginRoot, "plugin.json"))) as unknown;
        if (!obj(json)) throw new Error("plugin.json must be an object.");
        if (typeof json.name !== "string" || !json.name) throw new Error("plugin.json.name is invalid.");
        if (json.name !== this.pluginName) throw new Error(`plugin.json.name "${json.name}" != "${this.pluginName}".`);
        if (typeof json.version !== "string" || !json.version) throw new Error("plugin.json.version is invalid.");
        return { name: json.name, version: json.version };
      })();
    }
    return this.pluginMeta;
  }

  private async readManifest(path: string): Promise<
    | { ok: true; manifest: PluginSkillManifest }
    | { ok: false; code: "OWNERSHIP_CONFLICT" | "MANIFEST_INVALID"; error: string }
  > {
    let text: string;
    try { text = await getText(path); }
    catch (e) {
      return is404(e)
        ? { ok: false, code: "OWNERSHIP_CONFLICT", error: `Target exists without ${PLUGIN_SKILL_MANIFEST}; refusing takeover.` }
        : { ok: false, code: "MANIFEST_INVALID", error: msg(e) };
    }

    const parsed = parseManifest(text);
    return "manifest" in parsed ? parsed : { ok: false, code: "MANIFEST_INVALID", error: parsed.error };
  }
}

export function createSiYuanSkillRuntime(
  options: { pluginName: string; skillsRoot?: string },
): SiYuanSkillRuntime {
  return new SiYuanSkillRuntime(options);
}

/* ----- scan -------------------------------------------------------------- */

class SymlinkError extends Error {
  constructor(readonly path: string) {
    super(`Symlink is not supported in Skill bundle: ${path}`);
  }
}

async function scan(root: string): Promise<ScanResult> {
  const directories: string[] = [], files: string[] = [];

  async function walk(abs: string, rel: string): Promise<void> {
    for (const e of await readDir(abs)) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      const a = join(abs, e.name);
      if (e.isSymlink) throw new SymlinkError(a);
      if (e.isDir) {
        directories.push(r); // parent 一定先于 child，可直接用于创建目标目录。
        await walk(a, r);
      } else {
        files.push(r);
      }
    }
  }

  await walk(root, "");
  return { directories, files };
}

/* ----- manifest ---------------------------------------------------------- */

function parseManifest(text: string):
  | { ok: true; manifest: PluginSkillManifest }
  | { ok: false; error: string } {
  let v: unknown;
  try { v = JSON.parse(text); }
  catch (e) { return { ok: false, error: `Invalid manifest JSON: ${msg(e)}` }; }

  if (!obj(v) || v.schemaVersion !== MANIFEST_VERSION || v.managedBy !== MANAGED_BY) {
    return { ok: false, error: "Unsupported or foreign Skill manifest." };
  }
  if (!obj(v.plugin) || !obj(v.skill)) return { ok: false, error: "Invalid manifest plugin/skill." };

  const p = v.plugin, s = v.skill;
  if (typeof p.name !== "string" || !p.name || typeof p.version !== "string" || !p.version) {
    return { ok: false, error: "Invalid manifest plugin." };
  }
  if (typeof s.name !== "string" || !s.name || typeof s.source !== "string" || !s.source) {
    return { ok: false, error: "Invalid manifest skill." };
  }
  if (typeof v.syncedAt !== "string" || !v.syncedAt) return { ok: false, error: "Invalid manifest syncedAt." };

  return {
    ok: true,
    manifest: {
      schemaVersion: 1,
      managedBy: "siyuan-skill-sdk",
      plugin: { name: p.name, version: p.version },
      skill: { name: s.name, source: s.source },
      syncedAt: v.syncedAt,
    },
  };
}

/* ----- SiYuan kernel file adapter --------------------------------------- */

class KernelError extends Error {
  constructor(readonly code: number, message: string) { super(message); }
}

async function readDir(path: string): Promise<DirEntry[]> {
  const data = await post<DirEntry[]>("/api/file/readDir", { path });
  if (!Array.isArray(data)) throw new Error(`Invalid readDir response: ${path}`);
  return data;
}

async function dirExists(path: string): Promise<boolean> {
  try { await readDir(path); return true; }
  catch (e) { if (is404(e)) return false; throw e; }
}

async function getBytes(path: string): Promise<Uint8Array> {
  const r = await fetch("/api/file/getFile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  if (r.status === 200) return new Uint8Array(await r.arrayBuffer());

  let code = r.status, text = `getFile failed: ${path}`;
  try {
    const x = await r.json() as Partial<KernelResult<unknown>>;
    if (typeof x.code === "number") code = x.code;
    if (typeof x.msg === "string" && x.msg) text = x.msg;
  } catch {}
  throw new KernelError(code, text);
}

async function getText(path: string): Promise<string> {
  return decode(await getBytes(path));
}

async function putBytes(path: string, bytes: Uint8Array): Promise<void> {
  const f = new FormData();
  f.append("path", path);
  f.append("isDir", "false");
  f.append("modTime", now());
  f.append("file", new Blob([bytes]), base(path));
  await postForm("/api/file/putFile", f);
}

async function putText(path: string, text: string): Promise<void> {
  await putBytes(path, new TextEncoder().encode(text));
}

async function copyWorkspaceFiles(srcs: string[], destDir: string): Promise<void> {
  await post("/api/file/workspaceCopyFiles", { srcs, destDir });
}

async function renameFile(path: string, newPath: string): Promise<void> {
  await post("/api/file/renameFile", { path, newPath });
}

async function removeIfExists(path: string): Promise<void> {
  try { await post("/api/file/removeFile", { path }); }
  catch (e) { if (!is404(e)) throw e; }
}

async function post<T = unknown>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let x: Partial<KernelResult<T>>;
  try { x = await r.json() as Partial<KernelResult<T>>; }
  catch { throw new KernelError(r.status, `${url} returned invalid JSON.`); }

  if (!r.ok || x.code !== 0) {
    throw new KernelError(
      typeof x.code === "number" ? x.code : r.status,
      typeof x.msg === "string" && x.msg ? x.msg : `${url} failed.`,
    );
  }
  return x.data as T;
}

async function postForm(url: string, form: FormData): Promise<void> {
  const r = await fetch(url, { method: "POST", body: form });
  let x: Partial<KernelResult<unknown>>;
  try { x = await r.json() as Partial<KernelResult<unknown>>; }
  catch { throw new KernelError(r.status, `${url} returned invalid JSON.`); }

  if (!r.ok || x.code !== 0) {
    throw new KernelError(
      typeof x.code === "number" ? x.code : r.status,
      typeof x.msg === "string" && x.msg ? x.msg : `${url} failed.`,
    );
  }
}

/* ----- small helpers ----------------------------------------------------- */

function role(path: string): LoadedSkillFile["role"] {
  if (path === "SKILL.md") return "entry";
  if (path === PLUGIN_SKILL_MANIFEST) return "control";
  const r = path.split("/")[0]?.toLowerCase();
  if (["references","reference","docs","documentation"].includes(r)) return "reference";
  if (["resources","resource","assets"].includes(r)) return "resource";
  if (["scripts","script"].includes(r)) return "script";
  return "other";
}

function isText(path: string): boolean {
  const n = base(path);
  if (n === "SKILL.md" || n === PLUGIN_SKILL_MANIFEST || n === "README" || n.startsWith("README.")) return true;
  const i = n.lastIndexOf(".");
  return i >= 0 && TEXT_EXT.has(n.slice(i + 1).toLowerCase());
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function relPath(value: string, field: string): string {
  const v = String(value ?? "").trim().replace(/\\/g, "/");
  if (!v || v.startsWith("/")) throw new Error(`${field} must be a relative path.`);
  const parts = v.split("/").filter(Boolean);
  parts.forEach(p => segment(p, field));
  return parts.join("/");
}

function oneName(value: string, field: string): string {
  const v = String(value ?? "").trim();
  if (!v || v.includes("/") || v.includes("\\")) throw new Error(`${field} must be one path segment.`);
  segment(v, field);
  return v;
}

function dataPath(value: string, field: string): string {
  const v = String(value ?? "").trim().replace(/\\/g, "/");
  if (!v.startsWith("/data/")) throw new Error(`${field} must be under /data/.`);
  const parts = v.split("/").filter(Boolean);
  parts.forEach(p => segment(p, field));
  return "/" + parts.join("/");
}

function segment(v: string, field: string): void {
  if (!v || v === "." || v === ".." || v.includes("\0")) throw new Error(`${field} contains invalid path segment.`);
}

function join(...parts: string[]): string {
  const v = parts.filter(Boolean).join("/").replace(/\\/g, "/").replace(/\/+/g, "/");
  return v.startsWith("/") ? v : "/" + v;
}

function base(path: string): string {
  const v = path.replace(/\\/g, "/").replace(/\/+$/, "");
  return v.slice(v.lastIndexOf("/") + 1);
}

function now(): string {
  return String(Date.now());
}

function is404(e: unknown): boolean {
  return e instanceof KernelError && e.code === 404;
}

function obj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function msg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return String(e); }
}

function fail(
  code: SkillErrorCode,
  error: unknown,
  skillName?: string,
  path?: string,
): SkillFailure {
  return { ok: false, code, error: msg(error), skillName, path };
}
