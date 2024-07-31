import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Drawer, DrawerContent, DrawerOverlay, Flex } from '@chakra-ui/react';
import { streamFetch } from '@/web/common/api/fetch';
import { useShareChatStore } from '@/web/core/chat/storeShareChat';
import SideBar from '@/components/SideBar';
import { GPTMessages2Chats } from '@fastgpt/global/core/chat/adapt';
import { customAlphabet } from 'nanoid';
import ChatBox from '@/components/core/chat/ChatContainer/ChatBox';
import type { StartChatFnProps } from '@/components/core/chat/ChatContainer/type';

import PageContainer from '@/components/PageContainer';
import ChatHeader from './components/ChatHeader';
import ChatHistorySlider from './components/ChatHistorySlider';
import { serviceSideProps } from '@/web/common/utils/i18n';
import { checkChatSupportSelectFileByChatModels } from '@/web/core/chat/utils';
import { useTranslation } from 'next-i18next';
import { delChatRecordById, getChatHistories, getInitOutLinkChatInfo } from '@/web/core/chat/api';
import { getChatTitleFromChatMessage } from '@fastgpt/global/core/chat/utils';
import { ChatStatusEnum } from '@fastgpt/global/core/chat/constants';
import { MongoOutLink } from '@fastgpt/service/support/outLink/schema';
import { OutLinkWithAppType } from '@fastgpt/global/support/outLink/type';
import { addLog } from '@fastgpt/service/common/system/log';
import { connectToDatabase } from '@/service/mongo';
import NextHead from '@/components/common/NextHead';
import { useContextSelector } from 'use-context-selector';
import ChatContextProvider, { ChatContext } from '@/web/core/chat/context/chatContext';
import { alternativeModel, InitChatResponse } from '@/global/core/chat/api';
import { defaultChatData } from '@/global/core/chat/constants';
import { useMount } from 'ahooks';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { useChat } from '@/components/core/chat/ChatContainer/useChat';
import { getNanoid } from '@fastgpt/global/common/string/tools';

import dynamic from 'next/dynamic';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import Permission from '@fastgpt/service/core/chat/Permission';
import Cookies from 'js-cookie';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 12);

const CustomPluginRunBox = dynamic(() => import('./components/CustomPluginRunBox'));

type Props = {
  name: string;
  appName: string;
  appIntro: string;
  appAvatar: string;
  shareId: string;
  authToken: string;
  isLogin: boolean;
  hookUrl: string;
  cardNo?: string | null;
  alternativeModelList?: alternativeModel[];
};

const OutLink = ({ appName, appIntro, appAvatar, cardNo, alternativeModelList }: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    shareId = '',
    chatId = '',
    showHistory = '1',
    showHead = '1',
    authToken,
    ...customVariables
  } = router.query as {
    shareId: string;
    chatId: string;
    showHistory: '0' | '1';
    showHead: '0' | '1';
    authToken: string;
    [key: string]: string;
  };
  const { isPc } = useSystem();
  const initSign = useRef(false);
  const [isEmbed, setIdEmbed] = useState(true);

  const [chatData, setChatData] = useState<InitChatResponse>(defaultChatData);
  const appId = chatData.appId;

  const { localUId } = useShareChatStore();
  const outLinkUid: string = cardNo || authToken || localUId;

  const {
    loadHistories,
    onUpdateHistory,
    onClearHistories,
    onDelHistory,
    isOpenSlider,
    onCloseSlider,
    forbidLoadChat,
    onChangeChatId
  } = useContextSelector(ChatContext, (v) => v);

  const {
    ChatBoxRef,
    chatRecords,
    setChatRecords,
    variablesForm,
    pluginRunTab,
    setPluginRunTab,
    resetChatRecords
  } = useChat();

  const startChat = useCallback(
    async ({ messages, controller, generatingMessage, variables }: StartChatFnProps) => {
      const completionChatId = chatId || getNanoid();
      const histories = messages.slice(-1);

      //post message to report chat start
      window.top?.postMessage(
        {
          type: 'shareChatStart',
          data: {
            question: histories[0]?.content
          }
        },
        '*'
      );

      const { responseText, responseData } = await streamFetch({
        data: {
          messages: histories,
          variables: {
            ...variables,
            ...customVariables
          },
          shareId,
          chatId: completionChatId,
          appType: chatData.app.type,
          outLinkUid
        },
        onMessage: generatingMessage,
        abortCtrl: controller
      });

      const newTitle = getChatTitleFromChatMessage(GPTMessages2Chats(histories)[0]);

      // new chat
      if (completionChatId !== chatId) {
        onChangeChatId(completionChatId, true);
      }
      loadHistories();

      // update chat window
      setChatData((state) => ({
        ...state,
        title: newTitle
      }));

      // hook message
      window.top?.postMessage(
        {
          type: 'shareChatFinish',
          data: {
            question: histories[0]?.content,
            answer: responseText
          }
        },
        '*'
      );

      return { responseText, responseData, isNewChat: forbidLoadChat.current };
    },
    [
      chatId,
      customVariables,
      shareId,
      chatData.app.type,
      outLinkUid,
      forbidLoadChat,
      onChangeChatId,
      loadHistories
    ]
  );

  const { loading } = useRequest2(
    async () => {
      if (!shareId || !outLinkUid || forbidLoadChat.current) return;

      const res = await getInitOutLinkChatInfo({
        chatId,
        shareId,
        outLinkUid
      });
      setChatData(res);

      const history = res.history.map((item) => ({
        ...item,
        dataId: item.dataId || nanoid(),
        status: ChatStatusEnum.finish
      }));

      resetChatRecords({
        records: history,
        variables: res.variables
      });
    },
    {
      manual: false,
      refreshDeps: [shareId, outLinkUid, chatId],
      onSuccess() {
        // send init message
        if (!initSign.current) {
          initSign.current = true;
          if (window !== top) {
            window.top?.postMessage({ type: 'shareChatReady' }, '*');
          }
        }
      },
      onError(e: any) {
        console.log(e);
        if (chatId) {
          onChangeChatId('');
        }
      },
      onFinally() {
        forbidLoadChat.current = false;
      }
    }
  );

  // window init
  useMount(() => {
    setIdEmbed(window !== top);
  });

  return (
    <>
      <NextHead title={appName} desc={appIntro} icon={appAvatar} />

      <PageContainer
        isLoading={loading}
        {...(isEmbed
          ? { p: '0 !important', insertProps: { borderRadius: '0', boxShadow: 'none' } }
          : { p: [0, 5] })}
      >
        <Flex h={'100%'} flexDirection={['column', 'row']}>
          {showHistory === '1' &&
            ((children: React.ReactNode) => {
              return isPc ? (
                <SideBar>{children}</SideBar>
              ) : (
                <Drawer
                  isOpen={isOpenSlider}
                  placement="left"
                  autoFocus={false}
                  size={'xs'}
                  onClose={onCloseSlider}
                >
                  <DrawerOverlay backgroundColor={'rgba(255,255,255,0.5)'} />
                  <DrawerContent maxWidth={'75vw'} boxShadow={'2px 0 10px rgba(0,0,0,0.15)'}>
                    {children}
                  </DrawerContent>
                </Drawer>
              );
            })(
              <ChatHistorySlider
                appName={chatData.app.name}
                appAvatar={chatData.app.avatar}
                confirmClearText={t('common:core.chat.Confirm to clear share chat history')}
                onDelHistory={({ chatId }) =>
                  onDelHistory({ appId: chatData.appId, chatId, shareId, outLinkUid })
                }
                onClearHistory={() => {
                  onClearHistories({ shareId, outLinkUid });
                }}
                onSetHistoryTop={(e) => {
                  onUpdateHistory({
                    ...e,
                    appId: chatData.appId,
                    shareId,
                    outLinkUid
                  });
                }}
                onSetCustomTitle={(e) => {
                  onUpdateHistory({
                    appId: chatData.appId,
                    chatId: e.chatId,
                    customTitle: e.title,
                    shareId,
                    outLinkUid
                  });
                }}
              />
            )}

          {/* chat container */}
          <Flex
            position={'relative'}
            h={[0, '100%']}
            w={['100%', 0]}
            flex={'1 0 0'}
            flexDirection={'column'}
          >
            {/* header */}
            {showHead === '1' ? (
              <ChatHeader
                alternativeModelList={alternativeModelList}
                chatData={chatData}
                history={chatData.history}
                showHistory={showHistory === '1'}
              />
            ) : null}
            {/* chat box */}
            <Box flex={1} bg={'white'}>
              {chatData.app.type === AppTypeEnum.plugin ? (
                <CustomPluginRunBox
                  pluginInputs={chatData.app.pluginInputs}
                  variablesForm={variablesForm}
                  histories={chatRecords}
                  setHistories={setChatRecords}
                  appId={chatData.appId}
                  tab={pluginRunTab}
                  setTab={setPluginRunTab}
                  onNewChat={() => onChangeChatId(getNanoid())}
                  onStartChat={startChat}
                />
              ) : (
                <ChatBox
                  ref={ChatBoxRef}
                  chatHistories={chatRecords}
                  setChatHistories={setChatRecords}
                  variablesForm={variablesForm}
                  appAvatar={chatData.app.avatar}
                  userAvatar={chatData.userAvatar}
                  chatConfig={chatData.app?.chatConfig}
                  showFileSelector={checkChatSupportSelectFileByChatModels(chatData.app.chatModels)}
                  feedbackType={'user'}
                  onStartChat={startChat}
                  onDelMessage={({ contentId }) =>
                    delChatRecordById({
                      contentId,
                      appId: chatData.appId,
                      chatId,
                      shareId,
                      outLinkUid
                    })
                  }
                  appId={chatData.appId}
                  chatId={chatId}
                  shareId={shareId}
                  outLinkUid={outLinkUid}
                />
              )}
            </Box>
          </Flex>
        </Flex>
      </PageContainer>
    </>
  );
};

const Render = (props: Props) => {
  const { shareId, authToken, isLogin, hookUrl } = props;
  const [hasPermission, setHasPermission] = useState(true);

  // 获取cookie的值
  let cardNo = Cookies.get('card_no') || '';
  // 判断是否登录并初始化登录权限
  const initPermissions = async () => {
    if (!isLogin || cardNo) {
      setHasPermission(true);
      return;
    }
    if (!authToken && isLogin) {
      const result = await Permission.initPermissions(
        window.location.href,
        hookUrl,
        'know:answerjin:view'
      );
      if (result.code !== 200) {
        setHasPermission(false);
        // @ts-ignore
        window.location.href = result.redirectUrl;
        return;
      }
      // @ts-ignore
      Cookies.set('card_no', result.username, { expires: 30 });
      // @ts-ignore
      cardNo = result.username;
      setHasPermission(true);
    }
  };

  useEffect(() => {
    initPermissions();
  }, []);

  const { localUId } = useShareChatStore();
  const outLinkUid: string = cardNo || authToken || localUId;

  const { data: histories = [], runAsync: loadHistories } = useRequest2(
    () => (shareId && outLinkUid ? getChatHistories({ shareId, outLinkUid }) : Promise.resolve([])),
    {
      manual: false,
      refreshDeps: [shareId, outLinkUid]
    }
  );

  return hasPermission ? (
    <ChatContextProvider histories={histories} loadHistories={loadHistories}>
      <OutLink {...props} cardNo={cardNo} />;
    </ChatContextProvider>
  ) : (
    <></>
  );
};

export default Render;

export async function getServerSideProps(context: any) {
  const shareId = context?.query?.shareId || '';
  const authToken = context?.query?.authToken || '';

  // 查询当前分享的app信息及分享链接配置信息
  const app = await (async () => {
    try {
      await connectToDatabase();
      const app = (await MongoOutLink.findOne(
        {
          shareId
        },
        'appId limit name isLogin'
      )
        .populate('appId', 'name avatar intro')
        .lean()) as OutLinkWithAppType;
      return app;
    } catch (error) {
      addLog.error('getServerSideProps', error);
      return undefined;
    }
  })();

  // 获取备选模型列表
  const alternativeModelList = await (async () => {
    try {
      await connectToDatabase();
      const app = (await MongoOutLink.aggregate([
        { $match: { alternativeModel: true } },
        {
          $group: {
            _id: '$appId',
            apps: { $push: '$$ROOT' },
            shareId: { $first: '$shareId' },
            name: { $first: '$name' }
          }
        },
        {
          $lookup: {
            from: 'apps', // Assuming the collection name for apps is 'apps'
            localField: '_id',
            foreignField: '_id',
            as: 'appDetails'
          }
        },
        { $unwind: '$appDetails' },
        {
          $project: {
            _id: 0,
            appId: { $toString: '$_id' },
            appName: '$appDetails.name',
            appAvatar: '$appDetails.avatar',
            appIntro: '$appDetails.intro',
            shareId: 1,
            name: 1
          }
        }
      ])) as alternativeModel[];

      // 排除掉 shareId 为当前分享的app
      const result = app.filter((item) => item.shareId !== shareId);
      console.log('alternativeModelList', result);
      return result;
    } catch (error) {
      addLog.error('alternativeModelList', error);
      return [];
    }
  })();

  return {
    props: {
      name: app?.name ?? 'name',
      appName: app?.appId?.name ?? 'name',
      appAvatar: app?.appId?.avatar ?? '',
      appIntro: app?.appId?.intro ?? 'intro',
      shareId: shareId ?? '',
      authToken: authToken ?? '',
      isLogin: app?.isLogin ?? false,
      hookUrl: app?.limit?.hookUrl ?? '',
      alternativeModelList,
      ...(await serviceSideProps(context, ['file']))
    }
  };
}
