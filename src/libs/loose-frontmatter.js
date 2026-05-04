/**
 * @fileoverview Loose YAML Front Matter Parser with Type Recognition for Siyuan Note
 *
 * ==================================================================================
 * 需求背景 (Background)
 * ==================================================================================
 * 思源笔记使用块级编辑器，用户希望在文档开头设置元数据（类似Markdown Front Matter），
 * 但需要更灵活的语法，允许用户手动输入时不必严格遵循YAML规范。同时，为了更好地
 * 利用这些元数据，需要识别value的类型并进行结构化解析。
 *
 * ==================================================================================
 * 设计理念 (Design Philosophy)
 * ==================================================================================
 *
 * ## 1. 两阶段解析策略
 *
 * ### 阶段一：结构解析（O(n)）
 * - 为每行分配角色（separator | empty | paragraph | keyval）
 * - 识别front matter的边界（通过 --- 分隔符）
 * - 提取所有key-value对
 *
 * ### 阶段二：类型识别（O(k)，k为键值对数量）
 * - 对每个value进行类型推断
 * - 将value解析为结构化数据
 *
 * ## 2. 类型系统设计
 *
 * 识别优先级（从高到低）：
 * 1. **link**: Markdown链接 `[anchor](href)`
 * 2. **enum**: 枚举状态 `option1 | **current** | option3`
 * 3. **array**: 数组列表 `item1; item2; item3`
 * 4. **bool**: 布尔值 `true/false/yes/no`
 * 5. **number**: 数值 `42` 或 `3.14`
 * 6. **text**: 默认文本类型
 *
 * ### Enum类型详解
 * - 语法: `option1 | option2 | **current** | option3`
 * - `**` 包裹表示当前激活状态
 * - `|` 周围可以有空格
 * - 每个选项可以是 text, number, bool 类型
 *
 * ### Array类型详解
 * - 语法: `item1; item2; item3`
 * - `;` 分隔元素
 * - 每个元素可以是 text, number, bool 类型
 *
 * ## 3. 容错性设计
 * - 支持中英文冒号（`:` 和 `：`）
 * - 允许键名的Markdown加粗（`**key**`）
 * - 允许键值对之间的空行
 * - 支持键名中包含冒号（如 `Key:with:colon`）
 *
 * ==================================================================================
 *
 * @version 3.0.0
 * @author frostime
 * @updated 2026-01-08
 */

/**
 * 行角色枚举
 * @typedef {'separator' | 'empty' | 'paragraph' | 'keyval'} LineRole
 */

/**
 * Value类型枚举
 * @typedef {'number' | 'text' | 'bool' | 'link' | 'enum' | 'array'} ValueType
 */

/**
 * 基础元素类型
 * @typedef {'text' | 'number' | 'bool'} PrimitiveType
 */

/**
 * Markdown链接数据结构
 * @typedef {Object} LinkData
 * @property {string} anchor - 链接显示文本
 * @property {string} href - 链接地址
 */

/**
 * 枚举状态数据结构
 * @typedef {Object} EnumData
 * @property {string} state - 当前激活状态
 * @property {Array<{value: string | number | boolean, type: PrimitiveType}>} options - 所有选项
 */

/**
 * 数组数据结构
 * @typedef {Array<{value: string | number | boolean, type: PrimitiveType}>} ArrayData
 */

/**
 * Value值结构
 * @typedef {Object} ValueInfo
 * @property {string} raw - 原始字符串
 * @property {ValueType} type - 识别的类型
 * @property {string | number | boolean | LinkData | EnumData | ArrayData} data - 结构化数据
 */

/**
 * 元数据键值对
 * @typedef {Object} MetaKV
 * @property {string} key - 键名
 * @property {ValueInfo} value - 值信息
 */

/**
 * 解析宽松的YAML风格front matter，带类型识别
 *
 * @param {string | null | undefined} content - Markdown文档内容
 * @returns {MetaKV[] | null} 解析结果数组，无有效front matter返回null
 *
 * @example
 * parseLooseYAMLFrontMatter(`
 * Title: 测试文档
 * Priority: 1
 * Status: pending | **active** | done
 * Tags: JavaScript; TypeScript; Node.js
 * ---
 * 正文内容
 * `);
 * // Returns: [
 * //   { key: 'Title', value: { raw: '测试文档', type: 'text', data: '测试文档' } },
 * //   { key: 'Priority', value: { raw: '1', type: 'number', data: 1 } },
 * //   { key: 'Status', value: { raw: '...', type: 'enum', data: { state: 'active', options: [...] } } },
 * //   { key: 'Tags', value: { raw: '...', type: 'array', data: [...] } }
 * // ]
 */
export function parseLooseYAMLFrontMatter(content) {
  // 输入验证
  if (!content || typeof content !== 'string') {
    return null;
  }

  const lines = content.split('\n');

  // ========== 阶段一：结构解析 ==========
  const roles = assignRoles(lines);
  const rawPairs = extractRawPairs(lines, roles);

  if (rawPairs === null) {
    return null;
  }

  // ========== 阶段二：类型识别 ==========
  return rawPairs.map(pair => ({
    key: pair.key,
    value: recognizeValueType(pair.value)
  }));
}

/**
 * 第一次扫描：为每行分配角色
 *
 * @param {string[]} lines - 文档行数组
 * @returns {LineRole[]} 角色数组
 */
function assignRoles(lines) {
  return lines.map(line => {
    const trimmed = line.trim();

    if (trimmed === '---') {
      return 'separator';
    }

    if (trimmed === '') {
      return 'empty';
    }

    // Key-Value行：包含冒号分隔符
    if (trimmed.includes(':') || trimmed.includes('：')) {
      return 'keyval';
    }

    return 'paragraph';
  });
}

/**
 * 提取原始键值对（未进行类型识别）
 *
 * @param {string[]} lines - 文档行数组
 * @param {LineRole[]} roles - 角色数组
 * @returns {{key: string, value: string}[] | null} 原始键值对数组
 */
function extractRawPairs(lines, roles) {
  // 找到所有separator的索引
  const separatorIndices = [];
  for (let i = 0; i < roles.length; i++) {
    if (roles[i] === 'separator') {
      separatorIndices.push(i);
    }
  }

  if (separatorIndices.length === 0) {
    return null;
  }

  const pairs = [];

  if (separatorIndices.length >= 2) {
    const firstSep = separatorIndices[0];
    const secondSep = separatorIndices[1];

    const beforeFirst = roles.slice(0, firstSep);
    const hasContentBeforeFirst = beforeFirst.some(r => r === 'paragraph' || r === 'keyval');

    if (hasContentBeforeFirst) {
      // Preamble格式：单行文本 + --- + key-value + ---
      extractTitle(lines, roles, 0, firstSep, pairs);
      parseKeyValuePairs(lines, roles, firstSep + 1, secondSep, pairs);
    } else {
      // 标准格式：--- + key-value + ---
      parseKeyValuePairs(lines, roles, firstSep + 1, secondSep, pairs);
    }
  } else {
    const sepIndex = separatorIndices[0];

    const beforeSep = roles.slice(0, sepIndex);
    const hasContent = beforeSep.some(r => r !== 'empty');

    if (!hasContent) {
      return [];
    }

    // 简单格式：key-value + ---
    parseKeyValuePairs(lines, roles, 0, sepIndex, pairs);
  }

  return pairs;
}

/**
 * 提取标题（作为特殊的key-value对）
 *
 * @param {string[]} lines - 文档行数组
 * @param {LineRole[]} roles - 角色数组
 * @param {number} start - 起始索引
 * @param {number} end - 结束索引
 * @param {{key: string, value: string}[]} pairs - 结果数组
 */
function extractTitle(lines, roles, start, end, pairs) {
  for (let i = start; i < end; i++) {
    if (roles[i] === 'paragraph') {
      const trimmed = lines[i].trim();
      if (trimmed) {
        pairs.push({ key: 'title', value: trimmed });
        return;
      }
    }
  }
}

/**
 * 解析key-value对
 *
 * @param {string[]} lines - 文档行数组
 * @param {LineRole[]} roles - 角色数组
 * @param {number} start - 起始索引
 * @param {number} end - 结束索引
 * @param {{key: string, value: string}[]} pairs - 结果数组
 */
function parseKeyValuePairs(lines, roles, start, end, pairs) {
  for (let i = start; i < end; i++) {
    if (roles[i] === 'keyval') {
      const trimmed = lines[i].trim();

      // 查找分隔符：优先 `: ` > `：` > `:`
      let separatorIndex = -1;
      let separatorLength = 1;

      separatorIndex = trimmed.indexOf(': ');
      if (separatorIndex !== -1) {
        separatorLength = 2;
      } else {
        separatorIndex = trimmed.indexOf('：');
        if (separatorIndex !== -1) {
          separatorLength = 1;
        } else {
          separatorIndex = trimmed.indexOf(':');
          if (separatorIndex !== -1) {
            separatorLength = 1;
          }
        }
      }

      if (separatorIndex === -1) continue;

      let rawKey = trimmed.substring(0, separatorIndex);
      let value = trimmed.substring(separatorIndex + separatorLength);

      // 处理key的**包裹
      rawKey = rawKey.trim();
      if (rawKey.startsWith('**') && rawKey.endsWith('**') && rawKey.length > 4) {
        rawKey = rawKey.substring(2, rawKey.length - 2);
      }

      value = value.trim();

      if (rawKey) {
        pairs.push({ key: rawKey, value });
      }
    }
  }
}

/**
 * 识别value的类型并进行结构化解析
 *
 * @param {string} rawValue - 原始value字符串
 * @returns {ValueInfo} 类型化的value信息
 */
function recognizeValueType(rawValue) {
  // 1. 识别 link 类型：[anchor](href)
  const linkMatch = rawValue.match(/^\[(.+?)\]\((.+?)\)$/);
  if (linkMatch) {
    return {
      raw: rawValue,
      type: 'link',
      data: {
        anchor: linkMatch[1],
        href: linkMatch[2]
      }
    };
  }

  // 2. 识别 enum 类型：包含 | 分隔符
  if (rawValue.includes('|')) {
    return parseEnumValue(rawValue);
  }

  // 3. 识别 array 类型：包含 ; 分隔符
  if (rawValue.includes(';')) {
    return parseArrayValue(rawValue);
  }

  // 4. 识别 bool 类型
  const lowerValue = rawValue.toLowerCase().trim();
  if (lowerValue === 'true' || lowerValue === 'false' ||
      lowerValue === 'yes' || lowerValue === 'no') {
    return {
      raw: rawValue,
      type: 'bool',
      data: lowerValue === 'true' || lowerValue === 'yes'
    };
  }

  // 5. 识别 number 类型
  const numValue = Number(rawValue);
  if (!isNaN(numValue) && rawValue.trim() !== '') {
    return {
      raw: rawValue,
      type: 'number',
      data: numValue
    };
  }

  // 6. 默认 text 类型
  return {
    raw: rawValue,
    type: 'text',
    data: rawValue
  };
}

/**
 * 解析枚举类型value
 *
 * @param {string} rawValue - 原始value字符串
 * @returns {ValueInfo} 枚举类型的value信息
 */
function parseEnumValue(rawValue) {
  const segments = rawValue.split('|').map(s => s.trim());
  let currentState = null;
  const options = [];

  for (const seg of segments) {
    // 检查是否为当前状态（被 ** 包裹）
    const isCurrent = seg.startsWith('**') && seg.endsWith('**') && seg.length > 4;
    const cleanValue = isCurrent ? seg.substring(2, seg.length - 2) : seg;

    const parsed = parsePrimitiveValue(cleanValue);
    options.push(parsed);

    if (isCurrent) {
      currentState = parsed.value;
    }
  }

  return {
    raw: rawValue,
    type: 'enum',
    data: {
      state: currentState,
      options
    }
  };
}

/**
 * 解析数组类型value
 *
 * @param {string} rawValue - 原始value字符串
 * @returns {ValueInfo} 数组类型的value信息
 */
function parseArrayValue(rawValue) {
  const items = rawValue.split(';').map(s => s.trim()).filter(s => s !== '');
  const parsedItems = items.map(item => parsePrimitiveValue(item));

  return {
    raw: rawValue,
    type: 'array',
    data: parsedItems
  };
}

/**
 * 解析基础类型值（text, number, bool）
 *
 * @param {string} value - 值字符串
 * @returns {{value: string | number | boolean, type: PrimitiveType}} 解析结果
 */
function parsePrimitiveValue(value) {
  const trimmed = value.trim();

  // 检查 bool
  const lowerValue = trimmed.toLowerCase();
  if (lowerValue === 'true' || lowerValue === 'false' ||
      lowerValue === 'yes' || lowerValue === 'no') {
    return {
      value: lowerValue === 'true' || lowerValue === 'yes',
      type: 'bool'
    };
  }

  // 检查 number
  const numValue = Number(trimmed);
  if (!isNaN(numValue) && trimmed !== '') {
    return {
      value: numValue,
      type: 'number'
    };
  }

  // 默认 text
  return {
    value: trimmed,
    type: 'text'
  };
}

// ==================== 类型守卫函数 ====================

/**
 * 类型守卫：判断是否为文本类型
 * @param {ValueInfo} value - Value信息
 * @returns {boolean}
 */
export function isTextValue(value) {
  return value.type === 'text';
}

/**
 * 类型守卫：判断是否为数字类型
 * @param {ValueInfo} value - Value信息
 * @returns {boolean}
 */
export function isNumberValue(value) {
  return value.type === 'number';
}

/**
 * 类型守卫：判断是否为布尔类型
 * @param {ValueInfo} value - Value信息
 * @returns {boolean}
 */
export function isBoolValue(value) {
  return value.type === 'bool';
}

/**
 * 类型守卫：判断是否为链接类型
 * @param {ValueInfo} value - Value信息
 * @returns {boolean}
 */
export function isLinkValue(value) {
  return value.type === 'link';
}

/**
 * 类型守卫：判断是否为枚举类型
 * @param {ValueInfo} value - Value信息
 * @returns {boolean}
 */
export function isEnumValue(value) {
  return value.type === 'enum';
}

/**
 * 类型守卫：判断是否为数组类型
 * @param {ValueInfo} value - Value信息
 * @returns {boolean}
 */
export function isArrayValue(value) {
  return value.type === 'array';
}
