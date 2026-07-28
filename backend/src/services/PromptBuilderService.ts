import { SQLiteAIContextRepository } from '../repositories/SQLiteAIContextRepository';

export interface CompiledPromptDTO {
  templateCode: string;
  version: number;
  systemPrompt: string;
  userPrompt: string;
}

export class PromptBuilderService {
  constructor(private repo: SQLiteAIContextRepository) {}

  public compilePrompt(templateCode: string, userQuery: string, contextPayload: any, evidenceProof: any): CompiledPromptDTO {
    const template = this.repo.getPromptTemplate(templateCode) || {
      id: 1,
      template_code: 'WEALTH_ADVISOR_BASE',
      system_prompt_template: 'You are FamilyWealthOS AI Advisor. Act as an expert SEBI Registered Investment Advisor (RIA) for Indian wealth planning. Respond using deterministic mathematical evidence provided in the context payload.',
      user_prompt_template: 'User Query: {userQuery}\n\nContext Payload:\n{contextPayload}\n\nEvidence Proof:\n{evidenceProof}',
      version: 1,
      is_active: 1
    };

    const userPrompt = template.user_prompt_template
      .replace('{userQuery}', userQuery)
      .replace('{contextPayload}', JSON.stringify(contextPayload, null, 2))
      .replace('{evidenceProof}', JSON.stringify(evidenceProof, null, 2));

    return {
      templateCode: template.template_code,
      version: template.version,
      systemPrompt: template.system_prompt_template,
      userPrompt
    };
  }
}
