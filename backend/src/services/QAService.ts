import { getDatabase } from '../utils/database.js';
import { getAIClient } from './AIClient.js';
import { getKBService } from './KBService.js';

interface SourceRef {
  id: number;
  title: string;
  type: 'note' | 'file';
  snippet: string;
}

export interface QAAnswer {
  answer: string;
  sources: Array<{
    id: number;
    title: string;
    type: 'note' | 'file';
  }>;
}

const MAX_CONTEXT_ITEMS = 6;
const MAX_SNIPPET_LEN = 400;

export class QAService {

  async ask(question: string): Promise<QAAnswer> {
    const aiClient = getAIClient();
    const kbService = getKBService();
    const db = getDatabase();

    // 1. Search note pages (keyword match on individual words)
    const noteSources = this.searchNotes(db, question);

    // 2. Search knowledge files (vector + keyword)
    let kbSources: SourceRef[] = [];
    try {
      const kbResults = await kbService.search(question, { limit: 5, minScore: 0.2 });
      kbSources = kbResults.map(r => ({
        id: r.file.id,
        title: r.file.name || '未命名文件',
        type: 'file' as const,
        snippet: (r.file.content_markdown || r.file.summary || '').substring(0, MAX_SNIPPET_LEN),
      }));
    } catch (e) {
      console.error('KB search failed:', e);
    }

    // 3. Merge and deduplicate sources
    const allSources = [...noteSources, ...kbSources].slice(0, MAX_CONTEXT_ITEMS);

    // 4. Build context
    const contextParts = allSources.map((s, i) => {
      const sourceLabel = s.type === 'note' ? '笔记页' : '知识库文件';
      return `[来源${i + 1}: ${sourceLabel} - ${s.title}]\n${s.snippet}`;
    });
    const context = contextParts.join('\n\n');

    // 5. Try AI chat, fallback to search-only summary
    let answer: string;
    if (allSources.length === 0) {
      answer = '未找到相关信息，请补充资料后重试。';
    } else {
      answer = await this.generateAnswer(aiClient, question, context);
      if (!answer || answer.startsWith('[AI')) {
        answer = this.fallbackAnswer(question, allSources);
      }
    }

    const sources = allSources.map(s => ({
      id: s.id,
      title: s.title,
      type: s.type,
    }));

    return { answer, sources };
  }

  private async generateAnswer(
    aiClient: ReturnType<typeof getAIClient>,
    question: string,
    context: string
  ): Promise<string> {
    try {
      const result = await aiClient.chatComplete(
        [
          {
            role: 'system',
            content: '你是一个智能问答助手。根据以下参考资料回答用户的问题。如果参考资料中没有足够信息，请如实告知，不要编造。在回答中引用参考来源时使用 [来源N] 标注。回答简洁准确，不超过 500 字。',
          },
          {
            role: 'user',
            content: `参考资料：\n\n${context}\n\n用户问题：${question}`,
          },
        ],
        { max_tokens: 800, temperature: 0.5 }
      );
      return result || '';
    } catch (error) {
      console.error('QA chat completion failed:', (error as any)?.message);
      return '';
    }
  }

  private fallbackAnswer(question: string, sources: SourceRef[]): string {
    const lines = [
      `[离线模式] 基于你的笔记和知识库检索到 ${sources.length} 条相关内容，摘要如下：`,
      '',
    ];
    sources.forEach((s, i) => {
      const label = s.type === 'note' ? '笔记页' : '知识库文件';
      const preview = s.snippet.replace(/\n/g, ' ').substring(0, 120);
      lines.push(`${i + 1}. [${label}] ${s.title}：${preview}${s.snippet.length > 120 ? '...' : ''}`);
    });
    lines.push('');
    lines.push('配置有效的 AI 模型后可获得智能生成的回答。');
    return lines.join('\n');
  }

  private searchNotes(db: ReturnType<typeof getDatabase>, query: string): SourceRef[] {
    const words = query
      .split(/[\s,，。！？、；：""''【】（）\(\)\[\]{}]+/)
      .filter(w => w.length > 0);

    if (words.length === 0) return [];

    const clause = words.map(() => '(np.title LIKE ? OR np.plain_text LIKE ?)').join(' OR ');
    const params: string[] = [];
    words.forEach(w => {
      const term = `%${w}%`;
      params.push(term, term);
    });
    params.push(MAX_CONTEXT_ITEMS);

    const stmt = db.prepare(`
      SELECT np.id, np.title, np.plain_text, np.note_id, n.name as note_name
      FROM note_pages np
      JOIN notes n ON n.id = np.note_id
      WHERE ${clause}
      LIMIT ?
    `);

    const rows = stmt.all(...params) as Array<{
      id: number; title: string | null; plain_text: string | null; note_name: string;
    }>;

    return rows.map(row => ({
      id: row.id,
      title: row.title || '无标题',
      type: 'note' as const,
      snippet: (row.plain_text || '').substring(0, MAX_SNIPPET_LEN),
    }));
  }
}

let qaServiceInstance: QAService | null = null;

export function getQAService(): QAService {
  if (!qaServiceInstance) {
    qaServiceInstance = new QAService();
  }
  return qaServiceInstance;
}
