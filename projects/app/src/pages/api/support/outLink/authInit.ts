import {NextAPI} from '@/service/middleware/entry';
import type {AuthOutLinkInitProps, AuthOutLinkResponse} from "@fastgpt/global/support/outLink/api";
import {ApiRequestProps} from "@fastgpt/service/type/next";
import type {NextApiResponse} from "next";

async function handler(
  req: ApiRequestProps<AuthOutLinkInitProps>,
  res: NextApiResponse<any>
): Promise<AuthOutLinkResponse> {

  const { outLinkUid, tokenUrl } = req.body;
  console.log(outLinkUid, tokenUrl);
  return Promise.resolve({ uid: outLinkUid });

}

export default NextAPI(handler);
