import React from 'react';

const TestSimple: React.FC = () => {
  console.log('TestSimple component is rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'red', 
      color: 'white', 
      fontSize: '24px',
      minHeight: '100vh',
      width: '100%'
    }}>
      <h1>测试页面 - 如果你能看到这个，说明React正在工作</h1>
      <p>时间: {new Date().toLocaleString()}</p>
      <p>端口: 3001</p>
      <p>路径: /</p>
    </div>
  );
};

export default TestSimple;
