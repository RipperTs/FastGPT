import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  ModalBody,
  ModalFooter,
  Select,
  Toast,
  useDisclosure
} from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import Avatar from '@fastgpt/web/components/common/Avatar';
import ToolMenu from './ToolMenu';
import type { ChatItemType } from '@fastgpt/global/core/chat/type';
import { useTranslation } from 'next-i18next';

import MyTag from '@fastgpt/web/components/common/Tag/index';
import { useContextSelector } from 'use-context-selector';
import { ChatContext } from '@/web/core/chat/context/chatContext';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { alternativeModel, InitChatResponse } from '@/global/core/chat/api';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import LightRowTabs from '@fastgpt/web/components/common/Tabs/LightRowTabs';
import { useRouter } from 'next/router';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import {
  GetResourceFolderListProps,
  GetResourceListItemResponse
} from '@fastgpt/global/common/parentFolder/type';
import { getMyApps } from '@/web/core/app/api';
import SelectOneResource from '@/components/common/folder/SelectOneResource';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useToast } from '@fastgpt/web/hooks/useToast';

const ChatHeader = ({
  alternativeModelList,
  chatData,
  history,
  showHistory,
  onRoute2AppDetail,
  apps
}: {
  history: ChatItemType[];
  showHistory?: boolean;
  onRoute2AppDetail?: () => void;
  apps?: AppListItemType[];
  chatData: InitChatResponse;
  alternativeModelList?: alternativeModel[];
}) => {
  const isPlugin = chatData.app.type === AppTypeEnum.plugin;
  const { isPc } = useSystem();

  return (
    <>
      {isPc && isPlugin ? null : (
        <Flex
          alignItems={'center'}
          px={[3, 5]}
          minH={['46px', '60px']}
          borderBottom={'sm'}
          color={'myGray.900'}
          fontSize={'sm'}
        >
          {isPc ? (
            <PcHeader
              alternativeModelList={alternativeModelList}
              title={chatData.title}
              chatModels={chatData.app.chatModels}
              history={history}
            />
          ) : (
            <MobileHeader
              apps={apps}
              appId={chatData.appId}
              go2AppDetail={onRoute2AppDetail}
              name={chatData.app.name}
              avatar={chatData.app.avatar}
              showHistory={showHistory}
            />
          )}

          {/* control */}
          {!isPlugin && <ToolMenu history={history} />}
        </Flex>
      )}
    </>
  );
};

const MobileDrawer = ({
  onCloseDrawer,
  appId,
  apps
}: {
  onCloseDrawer: () => void;
  appId: string;
  apps?: AppListItemType[];
}) => {
  enum TabEnum {
    recently = 'recently',
    app = 'app'
  }

  const { t } = useTranslation();
  const { isPc } = useSystem();
  const router = useRouter();
  const isTeamChat = router.pathname === '/chat/team';
  const [currentTab, setCurrentTab] = useState<TabEnum>(TabEnum.recently);
  const getAppList = useCallback(async ({ parentId }: GetResourceFolderListProps) => {
    return getMyApps({ parentId }).then((res) =>
      res.map<GetResourceListItemResponse>((item) => ({
        id: item._id,
        name: item.name,
        avatar: item.avatar,
        isFolder: item.type === AppTypeEnum.folder
      }))
    );
  }, []);
  const { onChangeAppId } = useContextSelector(ChatContext, (v) => v);
  return (
    <>
      <Box
        position={'absolute'}
        top={'45px'}
        w={'100vw'}
        h={'calc(100% - 45px)'}
        background={'rgba(0, 0, 0, 0.2)'}
        left={0}
        zIndex={5}
        onClick={() => {
          onCloseDrawer();
        }}
      >
        {/* menu */}
        <Box
          w={'100vw'}
          px={[2, 5]}
          padding={2}
          onClick={(e) => e.stopPropagation()}
          background={'white'}
          position={'relative'}
        >
          {!isPc && appId && (
            <LightRowTabs<TabEnum>
              flex={'1 0 0'}
              width={isTeamChat ? '30%' : '60%'}
              mr={10}
              inlineStyles={{
                px: 1
              }}
              list={[
                ...(isTeamChat
                  ? [{ label: t('common:all_apps'), value: TabEnum.recently }]
                  : [
                      { label: t('common:core.chat.Recent use'), value: TabEnum.recently },
                      { label: t('common:all_apps'), value: TabEnum.app }
                    ])
              ]}
              value={currentTab}
              onChange={setCurrentTab}
            />
          )}
        </Box>
        <Box
          width={'100vw'}
          height={'auto'}
          minH={'10vh'}
          maxH={'60vh'}
          overflow={'auto'}
          background={'white'}
          zIndex={3}
          onClick={(e) => e.stopPropagation()}
          borderRadius={'0 0 10px 10px'}
          position={'relative'}
          padding={3}
          pt={0}
          pb={4}
        >
          {/* history */}
          {currentTab === TabEnum.recently && (
            <>
              {Array.isArray(apps) &&
                apps.map((item) => (
                  <Flex justify={'center'} key={item._id}>
                    <Flex
                      py={2.5}
                      px={2}
                      width={'100%'}
                      borderRadius={'md'}
                      alignItems={'center'}
                      {...(item._id === appId
                        ? {
                            backgroundColor: 'primary.50 !important',
                            color: 'primary.600'
                          }
                        : {
                            onClick: () => onChangeAppId(item._id)
                          })}
                    >
                      <Avatar src={item.avatar} w={'24px'} />
                      <Box ml={2} className={'textEllipsis'}>
                        {item.name}
                      </Box>
                    </Flex>
                  </Flex>
                ))}
            </>
          )}
          {currentTab === TabEnum.app && !isPc && (
            <>
              <SelectOneResource
                value={appId}
                onSelect={(id) => {
                  if (!id) return;
                  onChangeAppId(id);
                }}
                server={getAppList}
              />
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

// 选择模型弹层
const SelectModelModal = ({
  alternativeModelList,
  isOpen,
  onClose
}: {
  alternativeModelList?: alternativeModel[];
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [value, setValue] = useState<string>('');
  const router = useRouter();

  if (!alternativeModelList || alternativeModelList.length === 0) {
    return;
  }

  const submit = () => {
    if (!value) {
      toast({
        status: 'warning',
        title: '请选择应用模型'
      });
      return;
    }
    const shareId = value;
    setValue('');
    onClose();
    router.push(`/chat/share?shareId=${shareId}`);
  };

  return (
    <MyModal
      isOpen={isOpen}
      iconSrc="core/workflow/inputType/selectLLM"
      onClose={onClose}
      maxW={['90vw', '700px']}
      title={'切换应用模型'}
    >
      <ModalBody py={4} pb={10}>
        <Select
          placeholder="请选择应用模型"
          onChange={(e) => {
            setValue(e.target.value);
          }}
        >
          {alternativeModelList.map((item) => (
            <option key={item.shareId} value={item.shareId}>
              {item.appName}
            </option>
          ))}
        </Select>
      </ModalBody>
      <ModalFooter>
        <Button variant={'whiteBase'} mr={3} onClick={onClose}>
          {t('common:common.Close')}
        </Button>
        <Button onClick={submit}>{t('common:common.Confirm')}</Button>
      </ModalFooter>
    </MyModal>
  );
};

const MobileHeader = ({
  showHistory,
  go2AppDetail,
  name,
  avatar,
  appId,
  apps
}: {
  showHistory?: boolean;
  go2AppDetail?: () => void;
  avatar: string;
  name: string;
  apps?: AppListItemType[];
  appId: string;
}) => {
  const { isPc } = useSystem();
  const router = useRouter();
  const onOpenSlider = useContextSelector(ChatContext, (v) => v.onOpenSlider);
  const { isOpen: isOpenDrawer, onToggle: toggleDrawer, onClose: onCloseDrawer } = useDisclosure();
  const isShareChat = router.pathname === '/chat/share';

  return (
    <>
      {showHistory && (
        <MyIcon name={'menu'} w={'20px'} h={'20px'} color={'myGray.900'} onClick={onOpenSlider} />
      )}
      <Flex px={3} alignItems={'center'} flex={'1 0 0'} w={0} justifyContent={'center'}>
        <Avatar src={avatar} w={'16px'} />
        <Box ml={1} className="textEllipsis" onClick={go2AppDetail}>
          {name}
        </Box>
        {isShareChat ? null : (
          <MyIcon
            _active={{ transform: 'scale(0.9)' }}
            name={'core/chat/chevronSelector'}
            w={'20px'}
            h={'20px'}
            color={isOpenDrawer ? 'primary.600' : 'myGray.900'}
            onClick={toggleDrawer}
          />
        )}
      </Flex>
      {!isPc && isOpenDrawer && !isShareChat && (
        <MobileDrawer apps={apps} appId={appId} onCloseDrawer={onCloseDrawer} />
      )}
    </>
  );
};

const PcHeader = ({
  alternativeModelList,
  title,
  chatModels,
  history
}: {
  title: string;
  chatModels?: string[];
  history: ChatItemType[];
  alternativeModelList?: alternativeModel[];
}) => {
  const { t } = useTranslation();
  const [isOpenSelectModelModal, setOpenSelectModelModal] = useState(false);

  const onOpen = () => {
    setOpenSelectModelModal(true);
  };
  const onClose = () => {
    setOpenSelectModelModal(false);
  };

  return (
    <>
      <Box mr={3} maxW={'160px'} className="textEllipsis" color={'myGray.1000'}>
        {title}
      </Box>
      <MyTag>
        <MyIcon name={'history'} w={'14px'} />
        <Box ml={1}>
          {history.length === 0
            ? t('common:core.chat.New Chat')
            : t('common:core.chat.History Amount', { amount: history.length })}
        </Box>
      </MyTag>
      {/* 当前模型名称 */}
      {!!chatModels && chatModels.length > 0 && (
        <MyTooltip label="使用的 AI 模型, 点击可切换其他应用和模型">
          <MyTag ml={2} colorSchema={'green'}>
            <MyIcon name={'core/chat/chatModelTag'} w={'14px'} />
            <Box ml={1} maxW={'200px'} cursor="pointer" className="textEllipsis" onClick={onOpen}>
              {chatModels.join(',')}
            </Box>
          </MyTag>
        </MyTooltip>
      )}
      <Box flex={1} />
      <SelectModelModal
        alternativeModelList={alternativeModelList}
        isOpen={isOpenSelectModelModal}
        onClose={() => {
          isOpenSelectModelModal && onClose();
        }}
      />
    </>
  );
};

export default ChatHeader;
