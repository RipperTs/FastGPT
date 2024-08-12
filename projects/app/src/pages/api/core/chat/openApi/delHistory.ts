import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { DelHistoryProps } from '@/global/core/chat/api';
import { authChatCrud } from '@/service/support/permission/auth/chat';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { ReadPermissionVal, WritePermissionVal } from '@fastgpt/global/support/permission/constant';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';

/* 删除一条 API 请求生成的历史记录 */
async function handler(req: ApiRequestProps<{}, DelHistoryProps>, res: NextApiResponse) {
  const { chatId } = req.query;

  if (!chatId) {
    return jsonRes(res, {
      code: 422,
      message: 'chatId is required'
    });
  }

  // 从header头中获取身份凭证信息
  const { appId } = await parseHeaderCert({
    req,
    authApiKey: true,
    per: ReadPermissionVal
  });

  await mongoSessionRun(async (session) => {
    await MongoChatItem.deleteMany(
      {
        appId,
        chatId,
        source: ChatSourceEnum.api
      },
      { session }
    );
    await MongoChat.findOneAndRemove(
      {
        appId,
        chatId,
        source: ChatSourceEnum.api
      },
      { session }
    );
  });

  jsonRes(res);
}

export default NextAPI(handler);
