import React from 'react';
import { Card, Table, Tag, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import tsrequest from '../../services/tsrequest';

const Results: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['myResults'],
    queryFn: async () => {
      const res = await tsrequest.get('/applications/my-results');
      return res.data;
    },
    retry: false,
  });

  const columns = [
    { title: 'Trường', dataIndex: 'schoolName', key: 'school' },
    { title: 'Ngành', dataIndex: 'majorName', key: 'major' },
    { title: 'Tổng điểm', dataIndex: 'totalScore', key: 'score' },
    {
      title: 'Kết quả',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={result === 'PASS' ? 'green' : 'red'}>
          {result === 'PASS' ? 'Đỗ' : 'Trượt'}
        </Tag>
      ),
    },
  ];

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <Card title="Kết quả xét tuyển">
        <Empty description="Chưa có kết quả nào" />
      </Card>
    );
  }

  return (
    <Card title="Kết quả xét tuyển">
      <Table dataSource={data || []} columns={columns} rowKey="id" loading={isLoading} />
    </Card>
  );
};

export default Results;