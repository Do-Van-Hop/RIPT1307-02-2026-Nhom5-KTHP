import React from 'react';
import { Card, Col, Row, Spin, Empty } from 'antd';
import { Column, Pie } from '@ant-design/charts';
import { useQuery } from '@tanstack/react-query';
import * as applicationService from '../../services/applicationService';
const statusMap: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const Statistics: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      const res = await applicationService.getStatistics();
      return res.data;
    },
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  if (!data) return <Empty description="Không có dữ liệu thống kê" />;

  const schoolColumnConfig = {
    data: data.bySchool || [],
    xField: 'schoolName',
    yField: 'count',
    label: {
      position: 'top' as const,
      style: { fill: '#000000' },
    },
    xAxis: { label: { autoRotate: true } },
    meta: { count: { alias: 'Số lượng hồ sơ' } },
  };

  const majorColumnConfig = {
    data: data.byMajor || [],
    xField: 'majorName',
    yField: 'count',
    label: { position: 'top' as const },
    xAxis: { label: { autoRotate: true } },
    meta: { count: { alias: 'Số lượng hồ sơ' } },
    seriesField: 'schoolName',
    isGroup: true,
  };

  const statusPieConfig = {
    data: (data.byStatus || []).map((item: any) => ({
      ...item,
      status: statusMap[item.status] ? statusMap[item.status].text : item.status,
    })),
    angleField: 'count',
    colorField: 'status',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} ({percentage})',
    },
  };
  
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Thống kê</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Số lượng hồ sơ theo Trường">
            {data.bySchool?.length > 0 ? (
              <Column {...schoolColumnConfig} />
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Số lượng hồ sơ theo Ngành">
            {data.byMajor?.length > 0 ? (
              <Column {...majorColumnConfig} />
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tỉ lệ trạng thái hồ sơ">
            {data.byStatus?.length > 0 ? (
              <Pie {...statusPieConfig} />
            ) : (
              <Empty description="Chưa có dữ liệu" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;