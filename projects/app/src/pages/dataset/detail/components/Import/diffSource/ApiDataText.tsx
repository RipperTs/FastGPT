import React, { useEffect } from 'react';

import { useTranslation } from 'next-i18next';
import { useForm } from 'react-hook-form';
import {Box, Textarea} from '@chakra-ui/react';
import { useContextSelector } from 'use-context-selector';
import { DatasetImportContext } from '../Context';
import { DatasetPageContext } from '@/web/core/dataset/context/datasetPageContext';

const CustomTet = () => {
  return <CustomTextInput />;
};

export default React.memo(CustomTet);

const CustomTextInput = () => {
  const { datasetDetail, loadDatasetDetail } = useContextSelector(DatasetPageContext, (v) => v);
  const { sources, goToNext, setSources } = useContextSelector(DatasetImportContext, (v) => v);
  const { register, reset, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      value: ''
    }
  });

  useEffect(() => {
    const source = sources[0];
    if (source) {
      reset({
        name: source.sourceName,
        value: source.rawText
      });
    }
  }, []);

  return (
    <Box maxW={['100%', '800px']}>
      <Box display={['block', 'flex']} alignItems={'center'} mt={10}>
        <Box flex={'0 0 120px'} fontSize={'sm'}>
          请求接口
        </Box>
        <Box bg="myGray.50" width="100%" padding={2} borderRadius={6} fontSize={14} color="#aaa">
          http://&lt;Base URL&gt;/api/core/dataset/collection/create/apiData
        </Box>
      </Box>
      <Box display={['block', 'flex']} alignItems={'flex-start'} mt={5}>
        <Box flex={'0 0 120px'} fontSize={'sm'}>
          请求方法
        </Box>
        <Box bg="myGray.50" width="100%" padding={2} borderRadius={6} fontSize={14} color="#aaa">
          POST
        </Box>
      </Box>
      <Box display={['block', 'flex']} alignItems={'flex-start'} mt={5}>
        <Box flex={'0 0 120px'} fontSize={'sm'}>
          Header头
        </Box>
        <Box bg="myGray.50" width="100%" padding={2} borderRadius={6} fontSize={14} color="#aaa">
          <Box>Authorization: Bearer &lt;Api Key&gt;</Box>
          <Box>Content-Type: application/json</Box>
        </Box>
      </Box>
      <Box display={['block', 'flex']} alignItems={'flex-start'} mt={5}>
        <Box flex={'0 0 120px'} fontSize={'sm'}>
          请求参数
        </Box>
        <Textarea
          flex={'1 0 0'}
          w={'100%'}
          rows={12}
          disabled
          value={`{
    "trainingType": "chunk",
    "datasetId": "668c81297f373d5483056650",
    "chunkSize": 400,
    "chunkSBoxlitter": "\\n",
    "qaPromBoxt": "<Context></Context> 标记中是一段文本，学习和分析它，并整理学习成果：\\n- 提出问题并给出每个问题的答案。\\n- 答案需详细完整，尽可能保留原文描述。\\n- 答案可以包含普通文字、链接、代码、表格、公示、媒体链接等 Markdown 元素。\\n- 最多提出 30 个问题。\\n",
    "name": "API测试",
    "text": "1. 高炉操作优化n场景描述：...."
}`}
          bg={'myGray.50'}
        />
      </Box>
      <Box display={['block', 'flex']} alignItems={'flex-start'} mt={5}>
        <Box flex={'0 0 120px'} fontSize={'sm'}>
          CURL示例
        </Box>
        <Box bg="myGray.50" width="100%" padding={2} borderRadius={6} fontSize={14} color="#aaa">
          {`
          curl --location 'http://localhost:3000/api/core/dataset/collection/create/apiData' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer ak-fcMKGVA14ll7y3kjQSfWukyXvbtXNWY7qNBGlYIeHkaDtntYjqAkJ609mwRi' \\
--data '{
    "trainingType": "chunk",
    "datasetId": "668c81297f373d5483056650",
    "chunkSize": 400,
    "chunkSBoxlitter": "\\n",
    "qaPromBoxt": "<Context></Context> 标记中是一段文本，学习和分析它，并整理学习成果：\\n- 提出问题并给出每个问题的答案。\\n- 答案需详细完整，尽可能保留原文描述。\\n- 答案可以包含普通文字、链接、代码、表格、公示、媒体链接等 Markdown 元素。\\n- 最多提出 30 个问题。\\n",
    "name": "API测试",
    "text": "1. 高炉操作优化n场景描述：...."
}'
          `}
        </Box>
      </Box>
    </Box>
  );
};
