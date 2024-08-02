import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authApp } from '@fastgpt/service/support/permission/app/auth';
import {ChatHistoryResponse, InitChatProps, InitChatResponse} from '@/global/core/chat/api.d';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { getChatItems } from '@fastgpt/service/core/chat/controller';
import { ChatErrEnum } from '@fastgpt/global/common/error/code/chat';
import { getAppLatestVersion } from '@fastgpt/service/core/app/controller';
import { NextAPI } from '@/service/middleware/entry';
import {ReadPermissionVal, WritePermissionVal} from '@fastgpt/global/support/permission/constant';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ChatHistoryResponse | void> {
  let { appId, chatId, loadCustomFeedbacks } = req.query as InitChatProps;

  if (!appId) {
    return jsonRes(res, {
      code: 422,
      message: "You don't have an app yet"
    });
  }

  if (!chatId){
    return jsonRes(res, {
      code: 422,
      message: "You don't have a chat yet"
    });
  }

  // auth app permission
  const [{ app, tmbId }, chat] = await Promise.all([
    authApp({
      req,
      authToken: false,
      authApiKey: true,
      appId,
      per: ReadPermissionVal
    }),
    chatId ? MongoChat.findOne({ appId, chatId }) : undefined
  ]);

  // auth chat permission
  if (chat && !app.permission.hasManagePer && String(tmbId) !== String(chat?.tmbId)) {
    throw new Error(ChatErrEnum.unAuthChat);
  }

  // get app and history
  const [{ histories }, { nodes }] = await Promise.all([
    getChatItems({
      appId,
      chatId,
      limit: 30,
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
