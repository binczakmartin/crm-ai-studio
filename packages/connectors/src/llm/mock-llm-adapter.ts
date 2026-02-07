/**
 * @file Mock LLM Adapter
 * @description A mock implementation of the LlmAdapter interface that produces valid Plan and
 *   Answer objects with real tool execution and citations. Used when no LLM runtime is available.
 * @remarks This adapter does NOT skip evidence-first constraints. It generates deterministic
 *   structured outputs that the pipeline can validate and execute.
 */

import type {
  LlmAdapter,
  LlmPlanRequest,
  LlmAnswerRequest,
} from '@crm-ai/shared';
import type { Plan } from '@crm-ai/shared';
import type { Answer } from '@crm-ai/shared';

/**
 * Mock LLM adapter for local development without a real LLM runtime.
 *
 * Produces valid Plan JSON and grounded Answer objects. Does NOT fabricate data —
 * the Answer is built from real tool results passed in.
 */
export class MockLlmAdapter implements LlmAdapter {
  /**
   * Generate a Plan JSON from the user message.
   * Attempts to detect SQL intent and creates an appropriate plan.
   *
   * @param params - Planning request with user message and context.
   * @returns A valid Plan JSON object.
   */
  async generatePlan(params: LlmPlanRequest): Promise<Plan> {
    const msg = params.userMessage.toLowerCase();

    // Detect RAG/search intent
    if (
      msg.includes('search') ||
      msg.includes('find') ||
      msg.includes('document') ||
      msg.includes('file')
    ) {
      return {
        intent: 'Search documents to answer user question',
        actions: [
          {
            tool: 'rag.search',
            args: { query: params.userMessage, topK: 8 },
            reason: 'Search indexed documents for relevant information',
          },
        ],
        needsClarification: false,
      };
    }

    // Detect compound questions and generate multiple SQL actions
    const sqlQueries = this.generateMockSqlActions(params.userMessage);
    return {
      intent: 'Query database to answer user question',
      actions: sqlQueries.map((q) => ({
        tool: 'sql.query',
        args: { sql: q.sql },
        reason: q.reason,
      })),
      needsClarification: false,
    };
  }

  /**
   * Generate a grounded Answer from tool results.
   * The answer content references ONLY the provided tool results.
   *
   * @param params - Answer request with tool results and verifier report.
   * @returns A valid Answer with citations.
   */
  async generateAnswer(params: LlmAnswerRequest): Promise<Answer> {
    const { toolResults, userMessage } = params;

    if (toolResults.length === 0) {
      return {
        content:
          "I wasn't able to retrieve any data to answer your question. Please check that data sources are configured and try again.",
        citations: [],
        followUps: [
          { text: 'Configure a data source in the Sources page.' },
        ],
      };
    }

    // Build answer from tool results
    const citationParts: string[] = [];
    const citations: Answer['citations'] = [];

    for (let i = 0; i < toolResults.length; i++) {
      const tr = toolResults[i]!;
      const citIdx = i + 1;

      citations.push({
        index: citIdx,
        evidenceId: tr.id,
        evidenceType: 'tool_result',
        label: `Query result (${tr.rowCount ?? 0} rows)`,
      });

      const rowCount = tr.rowCount ?? 0;
      const preview = tr.previewRows;

      if (preview && preview.length > 0) {
        const cols = Object.keys(preview[0]!);
        const rows = preview.slice(0, 10);
        const tableJson = JSON.stringify({ columns: cols, rows });

        citationParts.push(
          `Based on the query results [${citIdx}], I found **${rowCount} row(s)**:\n\n<!-- data-table:${tableJson} -->`,
        );
      } else {
        citationParts.push(
          `Based on the query results [${citIdx}], **${rowCount} row(s)** were returned.`,
        );
      }
    }

    const content = `Here are the results for your question: "${userMessage}"\n\n${citationParts.join('\n\n')}`;

    return { content, citations };
  }

  /**
   * Stream tokens for the final answer (mock: yields chunks of the full answer).
   *
   * @param params - Answer request.
   * @yields String chunks of the answer content.
   */
  async *streamAnswer(params: LlmAnswerRequest): AsyncGenerator<string, void, unknown> {
    const answer = await this.generateAnswer(params);
    // Simulate streaming by yielding word-by-word
    const words = answer.content.split(' ');
    for (const word of words) {
      yield word + ' ';
      // Small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  /**
   * Detect whether the user question has multiple sub-questions and generate
   * one SQL action per logical sub-question.
   *
   * @returns Array of { sql, reason } objects — one per sub-query.
   */
  private generateMockSqlActions(userMessage: string): Array<{ sql: string; reason: string }> {
    const msg = userMessage.toLowerCase();

    // --- Compound question detection ---
    // Split on common conjunctions: "and", "also", "plus", "as well as"
    const parts = msg.split(/\s+(?:and|also|plus|as well as|et|ainsi que)\s+/);
    if (parts.length > 1) {
      // Attempt to generate a separate SQL per sub-question
      const actions: Array<{ sql: string; reason: string }> = [];
      for (const part of parts) {
        const subSql = this.generateSingleSql(part.trim(), msg);
        // Avoid duplicate identical queries
        if (!actions.some((a) => a.sql === subSql)) {
          actions.push({ sql: subSql, reason: `Query for: ${part.trim()}` });
        }
      }
      if (actions.length > 0) return actions;
    }

    // Single question — return one action
    return [{ sql: this.generateSingleSql(msg, msg), reason: 'Execute SQL to retrieve relevant data' }];
  }

  /**
   * Generate a single SQL query based on a (sub-)question.
   *
   * @param subMsg - The lowercase sub-question fragment.
   * @param fullMsg - The full lowercase user message (for broader context matching).
   * @returns SQL string.
   */
  private generateSingleSql(subMsg: string, fullMsg: string): string {
    const msg = subMsg;

    // --- CRM customers ---
    if ((msg.includes('customer') || msg.includes('client')) && (msg.includes('status') || msg.includes('by status'))) {
      return 'SELECT status, COUNT(*) AS count FROM crm_customers GROUP BY status ORDER BY count DESC';
    }
    if ((msg.includes('customer') || msg.includes('client')) && (msg.includes('top') || msg.includes('revenue') || msg.includes('biggest'))) {
      return 'SELECT company_name, industry, country, revenue, employee_count, status FROM crm_customers ORDER BY revenue DESC LIMIT 5';
    }
    if ((msg.includes('customer') || msg.includes('client')) && (msg.includes('how many') || msg.includes('count') || msg.includes('number'))) {
      return 'SELECT COUNT(*) AS total_customers FROM crm_customers';
    }
    if (msg.includes('customer') || msg.includes('client')) {
      return 'SELECT company_name, industry, country, city, revenue, status FROM crm_customers ORDER BY company_name LIMIT 20';
    }

    // --- CRM deals (most specific first) ---
    // Aggregation: total/value/sum
    if (msg.includes('deal') && (msg.includes('total') || msg.includes('value') || msg.includes('sum') || msg.includes('amount')) && msg.includes('negotiation')) {
      return "SELECT COUNT(*) AS deal_count, SUM(d.amount) AS total_value FROM crm_deals d WHERE d.stage = 'negotiation'";
    }
    if (msg.includes('deal') && (msg.includes('total') || msg.includes('value') || msg.includes('sum') || msg.includes('amount')) && msg.includes('proposal')) {
      return "SELECT COUNT(*) AS deal_count, SUM(d.amount) AS total_value FROM crm_deals d WHERE d.stage = 'proposal'";
    }
    if (msg.includes('deal') && (msg.includes('total') || msg.includes('value') || msg.includes('sum') || msg.includes('amount')) && (msg.includes('won') || msg.includes('closed'))) {
      return "SELECT COUNT(*) AS deal_count, SUM(d.amount) AS total_value FROM crm_deals d WHERE d.stage = 'closed_won'";
    }
    // "total amount" or "total value" alone with deals → aggregate by stage
    if ((msg.includes('total') || msg.includes('value') || msg.includes('sum') || msg.includes('amount')) && (msg.includes('deal') || fullMsg.includes('deal'))) {
      return 'SELECT stage, COUNT(*) AS deal_count, SUM(amount) AS total_value FROM crm_deals GROUP BY stage ORDER BY total_value DESC';
    }
    // Listing queries by stage
    if (msg.includes('deal') && msg.includes('negotiation')) {
      return "SELECT d.title, c.company_name, d.amount, d.probability, d.close_date FROM crm_deals d JOIN crm_customers c ON d.customer_id = c.id WHERE d.stage = 'negotiation' ORDER BY d.amount DESC LIMIT 20";
    }
    if ((msg.includes('deal') || msg.includes('which')) && (msg.includes('won') || msg.includes('closed won'))) {
      return "SELECT d.title, c.company_name, d.amount, d.close_date FROM crm_deals d JOIN crm_customers c ON d.customer_id = c.id WHERE d.stage = 'closed_won' ORDER BY d.close_date DESC LIMIT 20";
    }
    if (msg.includes('deal') && (msg.includes('closed') || msg.includes('lost'))) {
      return "SELECT d.title, c.company_name, d.amount, d.close_date FROM crm_deals d JOIN crm_customers c ON d.customer_id = c.id WHERE d.stage = 'closed_won' ORDER BY d.close_date DESC LIMIT 20";
    }
    if (msg.includes('deal') && (msg.includes('open') || msg.includes('pipeline'))) {
      return "SELECT d.title, c.company_name, d.amount, d.stage, d.probability, d.close_date FROM crm_deals d JOIN crm_customers c ON d.customer_id = c.id WHERE d.stage NOT IN ('closed_won', 'closed_lost') ORDER BY d.amount DESC LIMIT 20";
    }
    if (msg.includes('deal')) {
      return 'SELECT d.title, c.company_name, d.amount, d.stage, d.probability, d.close_date FROM crm_deals d JOIN crm_customers c ON d.customer_id = c.id ORDER BY d.amount DESC LIMIT 20';
    }

    // --- "total amount" / "what is the total" without explicit "deal" but full context has deals ---
    if ((msg.includes('total') || msg.includes('amount') || msg.includes('sum')) && fullMsg.includes('deal')) {
      return "SELECT COUNT(*) AS deal_count, SUM(d.amount) AS total_value FROM crm_deals d WHERE d.stage = 'closed_won'";
    }

    // --- CRM contacts ---
    if (msg.includes('contact')) {
      return 'SELECT co.first_name, co.last_name, co.email, co.role, c.company_name FROM crm_contacts co JOIN crm_customers c ON co.customer_id = c.id ORDER BY c.company_name LIMIT 20';
    }

    // --- CRM activities ---
    if (msg.includes('activit') && (msg.includes('upcoming') || msg.includes('week') || msg.includes('pending') || msg.includes('due'))) {
      return "SELECT a.type, a.subject, a.due_date, c.company_name, co.first_name || ' ' || co.last_name AS contact_name FROM crm_activities a JOIN crm_customers c ON a.customer_id = c.id LEFT JOIN crm_contacts co ON a.contact_id = co.id WHERE a.completed = false ORDER BY a.due_date ASC LIMIT 20";
    }
    if (msg.includes('activit')) {
      return "SELECT a.type, a.subject, a.due_date, a.completed, c.company_name FROM crm_activities a JOIN crm_customers c ON a.customer_id = c.id ORDER BY a.created_at DESC LIMIT 20";
    }

    // --- CRM products ---
    if (msg.includes('product') || msg.includes('catalog') || msg.includes('price')) {
      return 'SELECT name, category, price, currency, active FROM crm_products ORDER BY name LIMIT 20';
    }

    // --- Studio meta tables ---
    if (msg.includes('workspace')) {
      return 'SELECT id, name, created_at FROM workspaces LIMIT 20';
    }
    if (msg.includes('source')) {
      return 'SELECT id, name, type, status, created_at FROM sources LIMIT 20';
    }
    if (msg.includes('thread')) {
      return 'SELECT id, title, created_at FROM threads LIMIT 20';
    }

    // --- Generic count ---
    if (msg.includes('how many') || msg.includes('count')) {
      return 'SELECT COUNT(*) AS total FROM crm_customers';
    }

    // Default: show customers overview
    return 'SELECT company_name, industry, country, revenue, status FROM crm_customers ORDER BY revenue DESC LIMIT 10';
  }
}
