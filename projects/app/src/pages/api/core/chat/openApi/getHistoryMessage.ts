import type {NextApiRequest, NextApiResponse} from 'next';
import {jsonRes} from '@fastgpt/service/common/response';
import {authApp} from '@fastgpt/service/support/permission/app/auth';
import {ChatHistoryResponse, InitChatProps} from '@/global/core/chat/api';
import {MongoChat} from '@fastgpt/service/core/chat/chatSchema';
import {getChatItems} from '@fastgpt/service/core/chat/controller';
import {ChatErrEnum} from '@fastgpt/global/common/error/code/chat';
import {getAppLatestVersion} from '@fastgpt/service/core/app/controller';
import {NextAPI} from '@/service/middleware/entry';
import {ReadPermissionVal} from '@fastgpt/global/support/permission/constant';
import {FlowNodeTypeEnum} from '@fastgpt/global/core/workflow/node/constant';
import {parseHeaderCert} from "@fastgpt/service/support/permission/controller";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ChatHistoryResponse | void> {
  let {chatId, perPage, loadCustomFeedbacks} = req.query as InitChatProps;


  if (!chatId) {
    return jsonRes(res, {
      code: 422,
      message: "You don't have a chat yet"
    });
  }

  // 从header头中获取身份凭证信息
  const {appId} = await parseHeaderCert({
    req,
    authApiKey: true,
    per: ReadPermissionVal
  });

  // 获取应用详情信息
  const [{app, tmbId}, chat] = await Promise.all([
    authApp({
      req,
      authApiKey: true,
      appId,
      per: ReadPermissionVal
    }),
    chatId ? MongoChat.findOne({appId, chatId}) : undefined
  ]);

  // auth chat permission
  if (chat && !app.permission.hasManagePer && String(tmbId) !== String(chat?.tmbId)) {
    throw new Error(ChatErrEnum.unAuthChat);
  }

  // get app and history
  const [{histories}, {nodes}] = await Promise.all([
    getChatItems({
      appId,
      chatId,
      limit: perPage || 30,
      field: `dataId obj value adminFeedback userBadFeedback userGoodFeedback`
    }),
    getAppLatestVersion(app._id, app)
  ]);
  const pluginInputs =
    app?.modules?.find((node) => node.flowNodeType === FlowNodeTypeEnum.pluginInput)?.inputs ?? [];

  return {
    chatId,
    appId,
    title: chat?.title || '新对话',
    userAvatar: undefined,
    history: histories,
  };
}

export default NextAPI(handler);

export const config = {
  api: {
    responseLimit: '10mb'
  }
};
