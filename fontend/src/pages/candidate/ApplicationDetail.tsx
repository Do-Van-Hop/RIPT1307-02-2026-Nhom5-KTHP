import React from 'react';
import { Card, Descriptions, Tag, Space, Image, Button } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as applicationService from '../../services/applicationService';

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: 'Nháp' },
  SUBMITTED: { color: 'blue', text: 'Đã nộp' },
  PENDING: { color: 'orange', text: 'Chờ duyệt' },
  APPROVED: { color: 'green', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Từ chối' },
};

const ApplicationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['application', Number(id)],
    queryFn: async () => {
      const res = await applicationService.getApplicationById(Number(id));
      return res.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Không tìm thấy hồ sơ</div>;

  const statusInfo = statusMap[data.status] || { color: 'default', text: data.status };

  return (
    <Card
      title={`Hồ sơ #${data.id}`}
      extra={
        <Space>
          {data.status === 'DRAFT' && (
            <Button onClick={() => navigate(`/candidate/applications/${data.id}/edit`)}>Sửa</Button>
          )}
          <Button onClick={() => navigate('/candidate/applications')}>Quay lại</Button>
        </Space>
      }
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Trường">{data.school?.name}</Descriptions.Item>
        <Descriptions.Item label="Ngành">{data.major?.name}</Descriptions.Item>
        <Descriptions.Item label="Tổ hợp">{data.subjectGroup?.name}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Đối tượng ưu tiên">{data.priority}</Descriptions.Item>
        {data.scores && (
          <Descriptions.Item label="Điểm">
            {Object.entries(data.scores).map(([subject, score]) => (
              <div key={subject}>{subject}: {score as number}</div>
            ))}
          </Descriptions.Item>
        )}
        {data.documents?.length > 0 && (
          <Descriptions.Item label="Minh chứng">
            <Space>
              {data.documents.map((doc: { url: string }, idx: number) => (
                <Image key={idx} src={doc.url} width={100} />
              ))}
            </Space>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
};

export default ApplicationDetail;