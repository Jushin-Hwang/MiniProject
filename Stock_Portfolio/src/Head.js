import React from 'react';
import './Header.css'; // 스타일을 위한 CSS 파일

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">주식 포트폴리오 관리 시스템</h1>
      </div>
    </header>
  );
}

export default Header;
