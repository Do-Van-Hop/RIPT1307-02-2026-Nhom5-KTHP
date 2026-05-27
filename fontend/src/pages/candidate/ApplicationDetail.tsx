import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Tag, Image, Button, Spin, Typography, Tooltip, Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  IdcardOutlined,
  BankOutlined,
  BookOutlined,
  AppstoreOutlined,
  StarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import * as applicationService from '../../services/applicationService';
import * as catalogService from '../../services/catalogService';

const { Text, Title } = Typography;

// Mapping priority number → display text
const priorityMap: Record<number, string> = {
  1: 'KV1',
  2: 'KV2',
  3: 'KV2-NT',
  4: 'KV3',
};

const statusMap: Record<string, { color: string; text: string; tagColor: string; bg: string; dot: string }> = {
  DRAFT:     { color: '#8B716D', text: 'Nháp',      tagColor: 'default', bg: 'bg-gray-50',   dot: 'bg-gray-400' },
  SUBMITTED: { color: '#1890ff', text: 'Đã nộp',    tagColor: 'blue',    bg: 'bg-blue-50',   dot: 'bg-blue-500' },
  PENDING:   { color: '#fa8c16', text: 'Chờ duyệt', tagColor: 'orange',  bg: 'bg-orange-50', dot: 'bg-orange-500' },
  APPROVED:  { color: '#52c41a', text: 'Đã duyệt',  tagColor: 'success', bg: 'bg-green-50',  dot: '#52c41a' },
  REJECTED:  { color: '#f5222d', text: 'Từ chối',   tagColor: 'error',   bg: 'bg-red-50',    dot: '#f5222d' },
};

// Reusable info row
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: string;
}> = ({ icon, label, value, accent = '#B30000' }) => (
  <div className="flex items-start gap-3 py-3.5 border-b border-gray-50 last:border-0">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ backgroundColor: `${accent}15` }}
    >
      <span style={{ color: accent }} className="text-sm">{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <Text className="text-xs text-gray-400 font-semibold uppercase tracking-widest block mb-0.5">
        {label}
      </Text>
      <div className="text-sm font-medium text-gray-800 break-words">{value}</div>
    </div>
  </div>
);

// Section card with accent line
const SectionCard: React.FC<{
  title: string;
  accent: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, accent, icon, children }) => (
  <Card
    className="rounded-2xl shadow-sm bg-white"
    styles={{ body: { padding: '4px 20px 16px' } }}
    title={
      <div className="flex items-center gap-2 py-0.5">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accent }} />
        <span className="font-semibold text-gray-800 text-base">{title}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
    }
  >
    {children}
  </Card>
);

const ApplicationDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch application
  const { data: application, isLoading } = useQuery({
    queryKey: ['application', Number(id)],
    queryFn: async () => (await applicationService.getApplicationById(Number(id))).data,
    enabled: !!id,
  });

  // Fetch catalogs
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => (await catalogService.getSchools()).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subjectGroups } = useQuery({
    queryKey: ['subjectGroups'],
    queryFn: async () => (await catalogService.getSubjectGroups()).data,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all majors for mapping
  const { data: allMajorsData } = useQuery({
    queryKey: ['allMajorsForCandidateDetail'],
    queryFn: async () => {
      const schoolsRes = await catalogService.getSchools();
      const schoolList = schoolsRes.data as { id: number; name: string }[];
      const majorsPromises = schoolList.map(school =>
        catalogService.getMajorsBySchool(school.id).then(res => res.data as any[])
      );
      const majorsArrays = await Promise.all(majorsPromises);
      const allMajors = majorsArrays.flat();
      const majorMap = new Map<number, string>();
      allMajors.forEach(m => majorMap.set(m.id, m.name));
      return { list: allMajors, map: majorMap };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!application,
  });

  const schoolMap = new Map<number, string>((schools ?? []).map((s: any) => [s.id, s.name] as [number, string]));
  const subjectGroupMap = new Map<number, string>((subjectGroups ?? []).map((sg: any) => [sg.id, sg.name] as [number, string]));
  const majorMap = allMajorsData?.map || new Map<number, string>();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <ExclamationCircleOutlined className="text-4xl text-gray-300" />
        <Text className="text-gray-400">Không tìm thấy hồ sơ</Text>
        <Button onClick={() => navigate('/candidate/applications')} className="!rounded-xl">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const statusInfo = statusMap[application.status] || { color: '#8B716D', text: application.status, tagColor: 'default', bg: 'bg-gray-50', dot: 'bg-gray-400' };
  const priorityText = priorityMap[application.priority] || 'Không xác định';
  const scoreEntries = application.scores ? Object.entries(application.scores) : [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Tooltip title="Quay lại danh sách">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/candidate/applications')}
              className="!rounded-xl !border-gray-200 !text-gray-500 hover:!border-[#B30000] hover:!text-[#B30000]"
            />
          </Tooltip>
          <div>
            <div className="flex items-center gap-2">
              <Title level={2} className="!mb-0 !text-gray-900 !font-bold tracking-tight">
                Hồ sơ
              </Title>
              <Text className="text-2xl font-bold text-[#B30000]">#{application.id}</Text>
            </div>
            <Text className="text-gray-400 text-sm">Chi tiết thông tin hồ sơ tuyển sinh</Text>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tag
            color={statusInfo.tagColor}
            className="!text-sm !font-semibold !px-4 !py-1 !rounded-full !m-0"
          >
            {statusInfo.text}
          </Tag>
          {application.status === 'DRAFT' && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/candidate/applications/${application.id}/edit`)}
              className="!rounded-xl !bg-[#B30000] !border-[#B30000] hover:!bg-[#E60000] !font-medium"
            >
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-[#B30000] to-[#E60000] rounded-2xl p-5 text-white shadow-lg shadow-red-200 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            className="bg-white/20 border-2 border-white/30 flex-shrink-0 text-white"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white m-0 truncate">{application.full_name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              {application.phone && (
                <span className="flex items-center gap-1.5 text-white/80 text-sm">
                  <PhoneOutlined className="text-xs" /> {application.phone}
                </span>
              )}
              {application.cccd_number && (
                <span className="flex items-center gap-1.5 text-white/80 text-sm">
                  <IdcardOutlined className="text-xs" /> {application.cccd_number}
                </span>
              )}
              {application.submitted_at && (
                <span className="flex items-center gap-1.5 text-white/80 text-sm">
                  <CalendarOutlined className="text-xs" />
                  Nộp {new Date(application.submitted_at).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center bg-white rounded-xl px-4 py-2 shadow-sm">
            <StarOutlined className="text-gray-500 text-lg" />
            <span className="text-gray-500 text-xs mt-1 font-medium">Ưu tiên</span>
            <span className="text-gray-800 font-bold text-sm">{priorityText}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Thông tin cá nhân */}
        <SectionCard title="Thông tin cá nhân" accent="#B30000" icon={<UserOutlined />}>
          <InfoRow icon={<UserOutlined />} label="Họ và tên" value={application.full_name} accent="#B30000" />
          <InfoRow icon={<PhoneOutlined />} label="Số điện thoại" value={application.phone} accent="#B30000" />
          <InfoRow
            icon={<CalendarOutlined />}
            label="Ngày sinh"
            value={new Date(application.dob).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            accent="#B30000"
          />
          <InfoRow icon={<IdcardOutlined />} label="Số CCCD" value={<span className="font-mono">{application.cccd_number}</span>} accent="#B30000" />
        </SectionCard>

        {/* Thông tin xét tuyển */}
        <SectionCard title="Thông tin xét tuyển" accent="#0038F7" icon={<BookOutlined />}>
          <InfoRow
            icon={<BankOutlined />}
            label="Trường"
            value={schoolMap.get(application.school_id) ?? `ID: ${application.school_id}`}
            accent="#0038F7"
          />
          <InfoRow
            icon={<BookOutlined />}
            label="Ngành"
            value={majorMap.get(application.major_id) || `ID: ${application.major_id}`}
            accent="#0038F7"
          />
          <InfoRow
            icon={<AppstoreOutlined />}
            label="Tổ hợp môn"
            value={
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#0038F7]/10 text-[#0038F7] text-xs font-bold border border-[#0038F7]/20 tracking-wide">
                {subjectGroupMap.get(application.subject_group_id) || `ID: ${application.subject_group_id}`}
              </span>
            }
            accent="#0038F7"
          />
          <InfoRow icon={<StarOutlined />} label="Đối tượng ưu tiên" value={priorityText} accent="#0038F7" />
        </SectionCard>

        {/* Trạng thái & thời gian */}
        <SectionCard title="Trạng thái hồ sơ" accent={statusInfo.color} icon={<FileTextOutlined />}>
          <InfoRow
            icon={<FileTextOutlined />}
            label="Trạng thái hiện tại"
            value={<Tag color={statusInfo.tagColor} className="!rounded-full !font-semibold !px-3">{statusInfo.text}</Tag>}
            accent={statusInfo.color}
          />
          {application.submitted_at && (
            <InfoRow
              icon={<ClockCircleOutlined />}
              label="Ngày nộp"
              value={new Date(application.submitted_at).toLocaleDateString('vi-VN')}
              accent={statusInfo.color}
            />
          )}
          {application.reject_reason && (
            <div className="mt-3 p-3.5 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ExclamationCircleOutlined className="text-red-500 text-xs" />
                <Text className="text-xs font-semibold uppercase tracking-widest text-red-400">Lý do từ chối</Text>
              </div>
              <Text className="text-sm text-red-700">{application.reject_reason}</Text>
            </div>
          )}
        </SectionCard>

        {/* Điểm thi */}
        {scoreEntries.length > 0 && (
          <SectionCard title="Điểm thi" accent="#8B716D" icon={<BarChartOutlined />}>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {scoreEntries.map(([subject, score]) => (
                <div
                  key={subject}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <Text className="text-sm text-gray-500 font-medium">{subject}</Text>
                  <Text className="text-lg font-bold text-[#B30000]">{score as number}</Text>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* File đính kèm */}
      {application.files && application.files.length > 0 && (
        <div className="mt-5">
          <SectionCard title="Minh chứng đính kèm" accent="#B30000" icon={<PaperClipOutlined />}>
            <div className="flex flex-wrap gap-4 pt-2">
              {application.files.map((file: any, idx: number) => (
                <div key={idx}>
                  {file.file_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <Image
                        src={file.file_url}
                        width={120}
                        height={120}
                        alt={file.file_type}
                        className="object-cover"
                      />
                      <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-100">
                        <Text className="text-xs text-gray-400 truncate block">{file.file_type}</Text>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#B30000]/20 bg-[#B30000]/5 hover:bg-[#B30000]/10 transition-colors no-underline"
                    >
                      <PaperClipOutlined className="text-[#B30000]" />
                      <Text className="text-sm text-[#B30000] font-medium">{file.file_type} — Xem file</Text>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;