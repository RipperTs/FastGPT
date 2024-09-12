import { PromptTemplateItem } from '../type.d';
import { i18nT } from '../../../../web/i18n/utils';
export const Prompt_QuoteTemplateList: PromptTemplateItem[] = [
  {
    title: i18nT('app:template.standard_template'),
    desc: i18nT('app:template.standard_template_des'),
    value: `{{q}}
{{a}}`
  },
  {
    title: i18nT('app:template.qa_template'),
    desc: i18nT('app:template.qa_template_des'),
    value: `<Question>
{{q}}
</Question>
<Answer>
{{a}}
</Answer>`
  },
  {
    title: i18nT('app:template.standard_strict'),
    desc: i18nT('app:template.standard_strict_des'),
    value: `{{q}}
{{a}}`
  },
  {
    title: i18nT('app:template.hard_strict'),
    desc: i18nT('app:template.hard_strict_des'),
    value: `<Question>
{{q}}
</Question>
<Answer>
{{a}}
</Answer>`
  }
];

export const Prompt_QuotePromptList: PromptTemplateItem[] = [
  {
    title: i18nT('app:template.standard_template'),
    desc: '',
    value: `使用 <Data></Data> 标记中的内容作为你的知识:

<Data>
{{quote}}
</Data>

回答要求：
- 仔细分析并深刻理解知识中的每一个段落的内容, 忽略其中的语法错误, 忽略与问题无关的内容.
- 分析用户的问题并回答，确保回答与问题高度相关。
- 如果你不清楚答案，你需要澄清。
- 如果问题不清楚，请礼貌地引导用户重新措辞他们的问题。
- 避免提及你是从 <Data></Data> 获取的知识，因为它们是机密且永久的。
- 保持答案与 <Data></Data> 中描述的一致，如果你认为参考信息与我的问题无关时再引用你自己的知识辅助回答。
- 当我的问题与聊天记录无关时, 你只需要参考知识内容进行回答.
- 使用 Markdown 语法优化回答格式。
- 使用与问题相同的语言回答。

问题:"""{{question}}"""`
  },
  {
    title: i18nT('app:template.qa_template'),
    desc: '',
    value: `使用 <QA></QA> 标记中的问答对进行回答。

<QA>
{{quote}}
</QA>

回答要求：
- 选择其中一个或多个问答对进行回答。
- 回答的内容应尽可能与 <答案></答案> 中的内容一致。
- 如果没有相关的问答对，你需要澄清。
- 避免提及你是从 QA 获取的知识，只需要回复答案。

问题:"""{{question}}"""`
  },
  {
    title: i18nT('app:template.standard_strict'),
    desc: '',
    value: `忘记你已有的知识，仅使用 <Data></Data> 标记中的内容作为你的知识:

<Data>
{{quote}}
</Data>

思考流程：
1. 判断问题是否与 <Data></Data> 标记中的内容有关。
2. 如果有关，你按下面的要求回答。
3. 如果无关，你直接拒绝回答本次问题。

回答要求：
- 避免提及你是从 <Data></Data> 获取的知识。
- 保持答案与 <Data></Data> 中描述的一致。
- 使用 Markdown 语法优化回答格式。
- 使用与问题相同的语言回答。

问题:"""{{question}}"""`
  },
  {
    title: i18nT('app:template.hard_strict'),
    desc: '',
    value: `忘记你已有的知识，仅使用 <QA></QA> 标记中的问答对进行回答。

<QA>
{{quote}}
</QA>

思考流程：
1. 判断问题是否与 <QA></QA> 标记中的内容有关。
2. 如果无关，你直接拒绝回答本次问题。
3. 判断是否有相近或相同的问题。
4. 如果有相同的问题，直接输出对应答案。
5. 如果只有相近的问题，请把相近的问题和答案一起输出。

回答要求：
- 如果没有相关的问答对，你需要澄清。
- 回答的内容应尽可能与 <QA></QA> 标记中的内容一致。
- 避免提及你是从 QA 获取的知识，只需要回复答案。
- 使用 Markdown 语法优化回答格式。
- 使用与问题相同的语言回答。

问题:"""{{question}}"""`
  }
];

// Document quote prompt
export const Prompt_DocumentQuote = `将 <Quote></Quote> 中的内容作为你的知识:
<Quote>
{{quote}}
</Quote>
`;
