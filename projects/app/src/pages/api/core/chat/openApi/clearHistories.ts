import type {NextApiRequest, NextApiResponse} from 'next';
import {jsonRes} from '@fastgpt/service/common/response';
import {connectToDatabase} from '@/service/mongo';
import {MongoChat} from '@fastgpt/service/core/chat/chatSchema';
import {MongoChatItem} from '@fastgpt/service/core/chat/chatItemSchema';
import {ClearHistoriesProps} from '@/global/core/chat/api';
import {ChatSourceEnum} from '@fastgpt/global/core/chat/constants';
import {parseHeaderCert} from "@fastgpt/service/support/permission/controller";
import {ReadPermissionVal} from "@fastgpt/global/support/permission/constant";

/* 清空所有 API 请求的历史记录 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const {outLinkUid} = req.query as ClearHistoriesProps;

    if (!outLinkUid) {
      return jsonRes(res, {
        code: 422,
        message: 'outLinkUid is required'
      });
    }

    // 从header头中获取身份凭证信息
    const {appId, tmbId} = await parseHeaderCert({
      req,
      authApiKey: true,
      per: ReadPermissionVal
    });

    let chatAppId = appId;

    const match = await (async () => {
      return {
        tmbId,
        appId,
        source: ChatSourceEnum.api
      };
    })();

    // find chatIds
    const list = await MongoChat.find(match, 'chatId').lean();
    const idList = list.map((item) => item.chatId);

    await MongoChatItem.deleteMany({
      appId: chatAppId,
      chatId: {$in: idList}
    });
    await MongoChat.deleteMany({
      appId: chatAppId,
      chatId: {$in: idList}
    });

    jsonRes(res);
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
