import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const Forbidden = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle="Bạn không có quyền truy cập trang này."
      extra={
        <Button type="primary" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      }
    />
  );
};

export default Forbidden;