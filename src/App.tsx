import React, { useState, useEffect } from "react";
import "./App.css";

// 格式化日期的函数
const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  };
  return date.toLocaleDateString('zh-CN', options);
};

// 颜色分类配置
const COLOR_CONFIG = {
  red: [1, 2, 7, 8, 12, 13, 18, 19, 23, 24, 29, 30, 34, 35, 40, 45, 46],
  green: [5, 6, 11, 16, 17, 21, 22, 27, 28, 32, 33, 38, 39, 43, 44, 49],
  blue: [3, 4, 9, 10, 14, 15, 20, 25, 26, 31, 36, 37, 41, 42, 47, 48, 50]
};

// 获取数字的颜色类型
const getNumberColor = (number: number): 'red' | 'green' | 'blue' => {
  if (COLOR_CONFIG.red.includes(number)) return 'red';
  if (COLOR_CONFIG.green.includes(number)) return 'green';
  return 'blue';
};

interface AmountRecord {
  number: number;
  amounts: number[];
  total: number;
  color: 'red' | 'green' | 'blue';
}

// 本地存储相关的工具函数
const STORAGE_KEY = 'number-tracker-data';

const saveDataToStorage = (date: string, amounts: { [key: number]: number[] }) => {
  try {
    const data = { date, amounts };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
};

const loadDataFromStorage = (): { date: string; amounts: { [key: number]: number[] } } | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载数据失败:', error);
  }
  return null;
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [amounts, setAmounts] = useState<{ [key: number]: number[] }>({});
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [inputAmount, setInputAmount] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ number: number; index: number; amount: number } | null>(null);

  // 初始化时加载数据
  useEffect(() => {
    const savedData = loadDataFromStorage();
    if (savedData && savedData.date === currentDate) {
      setAmounts(savedData.amounts);
    }
  }, []);

  // 监听日期变化并自动清空数据
  useEffect(() => {
    const interval = setInterval(() => {
      const today = formatDate(new Date());
      if (today !== currentDate) {
        setCurrentDate(today);
        setAmounts({});
        // 清空本地存储
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentDate]);

  // 当数据变化时自动保存到本地存储
  useEffect(() => {
    if (Object.keys(amounts).length > 0) {
      saveDataToStorage(currentDate, amounts);
    }
  }, [amounts, currentDate]);

  // 处理按钮点击
  const handleButtonClick = (number: number) => {
    setSelectedNumber(number);
    setInputAmount("");
    setShowModal(true);
  };

  // 处理确认输入
  const handleConfirm = () => {
    const amount = parseFloat(inputAmount);
    if (selectedNumber !== null && !isNaN(amount) && amount > 0) {
      setAmounts((prev) => ({
        ...prev,
        [selectedNumber]: [...(prev[selectedNumber] || []), amount],
      }));
      setShowModal(false);
      setSelectedNumber(null);
      setInputAmount("");
    }
  };

  // 处理取消
  const handleCancel = () => {
    setShowModal(false);
    setSelectedNumber(null);
    setInputAmount("");
  };

  // 处理清空数据
  const handleClearData = () => {
    setAmounts({});
    setShowClearConfirm(false);
    // 清空本地存储
    localStorage.removeItem(STORAGE_KEY);
  };

  // 处理删除单个金额记录
  const handleDeleteAmount = (number: number, index: number) => {
    setAmounts((prev) => {
      const newAmounts = { ...prev };
      if (newAmounts[number]) {
        newAmounts[number] = newAmounts[number].filter((_, i) => i !== index);
        // 如果该数字没有金额了，删除整个数字条目
        if (newAmounts[number].length === 0) {
          delete newAmounts[number];
        }
      }
      return newAmounts;
    });
  };

  // 处理删除按钮点击（显示确认弹窗）
  const handleDeleteClick = (number: number, index: number, amount: number) => {
    setDeleteTarget({ number, index, amount });
    setShowDeleteConfirm(true);
  };

  // 处理确认删除
  const handleConfirmDelete = () => {
    if (deleteTarget) {
      setAmounts((prev) => {
        const newAmounts = { ...prev };
        if (newAmounts[deleteTarget.number]) {
          newAmounts[deleteTarget.number] = newAmounts[deleteTarget.number].filter((_, i) => i !== deleteTarget.index);
          // 如果该数字没有金额了，删除整个数字条目
          if (newAmounts[deleteTarget.number].length === 0) {
            delete newAmounts[deleteTarget.number];
          }
        }
        return newAmounts;
      });
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // 处理取消删除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 获取金额记录列表
  const getAmountRecords = (): AmountRecord[] => {
    return Object.entries(amounts)
      .map(([number, amountsArray]) => ({
        number: parseInt(number),
        amounts: amountsArray,
        total: amountsArray.reduce((sum, amount) => sum + amount, 0),
        color: getNumberColor(parseInt(number))
      }))
      .sort((a, b) => b.total - a.total);
  };

  // 获取统计信息
  const getStatistics = () => {
    const records = getAmountRecords();
    const totalAmount = records.reduce((sum, record) => sum + record.total, 0);
    const totalNumbers = records.length;
    
    return {
      totalAmount,
      totalNumbers
    };
  };

  const amountRecords = getAmountRecords();
  const statistics = getStatistics();

  return (
    <div className="app">
      {/* 头部日期显示 */}
      <header className="header">
        <div className="date-container">
          <div className="date-icon">📅</div>
          <h1 className="date-text">{currentDate}</h1>
        </div>
        {amountRecords.length > 0 && (
          <button 
            className="clear-button"
            onClick={() => setShowClearConfirm(true)}
            title="清空所有数据"
          >
            🗑️ 清空
          </button>
        )}
      </header>

      {/* 数字按钮网格 */}
      <main className="main-content">
        <div className="buttons-grid">
          {/* 蛇：01 13 25 37 49 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐍 蛇</div>
            <div className="zodiac-buttons">
              {[1, 13, 25, 37, 49].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 龙：02 14 26 38 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐉 龙</div>
            <div className="zodiac-buttons">
              {[2, 14, 26, 38].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 兔：03 15 27 39 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐰 兔</div>
            <div className="zodiac-buttons">
              {[3, 15, 27, 39].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 虎：04 16 28 40 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐯 虎</div>
            <div className="zodiac-buttons">
              {[4, 16, 28, 40].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 牛：05 17 29 41 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐮 牛</div>
            <div className="zodiac-buttons">
              {[5, 17, 29, 41].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 鼠：06 18 30 42 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐭 鼠</div>
            <div className="zodiac-buttons">
              {[6, 18, 30, 42].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 猪：07 19 31 43 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐷 猪</div>
            <div className="zodiac-buttons">
              {[7, 19, 31, 43].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 狗：08 20 32 44 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐕 狗</div>
            <div className="zodiac-buttons">
              {[8, 20, 32, 44].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 鸡：09 21 33 45 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐔 鸡</div>
            <div className="zodiac-buttons">
              {[9, 21, 33, 45].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 猴：10 22 34 46 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐒 猴</div>
            <div className="zodiac-buttons">
              {[10, 22, 34, 46].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 羊：11 23 35 47 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐑 羊</div>
            <div className="zodiac-buttons">
              {[11, 23, 35, 47].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 马：12 24 36 48 */}
          <div className="zodiac-row">
            <div className="zodiac-label">🐎 马</div>
            <div className="zodiac-buttons">
              {[12, 24, 36, 48].map((number) => {
                const hasAmount = amounts[number] && amounts[number].length > 0;
                const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
                const colorType = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                    onClick={() => handleButtonClick(number)}
                  >
                    <span className="button-number">{number.toString().padStart(2, '0')}</span>
                    {hasAmount && (
                      <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 金额记录列表 */}
        {amountRecords.length > 0 && (
          <section className="records-section">
            {/* 统计卡片 */}
            <div className="statistics-card">
              <h3 className="statistics-title">
                <span className="statistics-icon">📈</span>
                今日统计
              </h3>
              <div className="statistics-grid">
                <div className="stat-item total-stat">
                  <div className="stat-label">总金额</div>
                  <div className="stat-value">¥{statistics.totalAmount.toFixed(2)}</div>
                  <div className="stat-subtitle">{statistics.totalNumbers} 个数字</div>
                </div>
              </div>
            </div>

            <h2 className="records-title">
              <span className="records-icon">📊</span>
              金额记录
            </h2>
            <div className="records-list">
              {amountRecords.map((record) => (
                <div key={record.number} className="record-item">
                  <div className="record-header">
                    <span className="record-number">
                      数字{record.number}
                      <span className={`color-text ${record.color}-text`}>
                        （{record.color === 'red' ? '红' : record.color === 'green' ? '绿' : '蓝'}）
                      </span>
                    </span>
                    <span className="record-total">¥{record.total.toFixed(2)}</span>
                  </div>
                  <div className="record-details">
                    {record.amounts.map((amount, index) => (
                      <span key={index} className="amount-item">
                        ¥{amount.toFixed(2)}
                        <button
                          className="delete-amount-btn"
                          onClick={() => handleDeleteClick(record.number, index, amount)}
                          title="删除此金额"
                        >
                          ✕
                        </button>
                        {index < record.amounts.length - 1 && <span className="plus">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 弹窗 */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="modal-icon">💰</span>
                输入金额
              </h3>
              <p className="modal-subtitle">数字 {selectedNumber}</p>
            </div>
            
            <div className="modal-body">
              <div className="input-group">
                <label htmlFor="amount-input" className="input-label">金额</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">¥</span>
                  <input
                    id="amount-input"
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="amount-input"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-cancel" onClick={handleCancel}>
                取消
              </button>
              <button 
                className="btn btn-confirm" 
                onClick={handleConfirm}
                disabled={!inputAmount || parseFloat(inputAmount) <= 0}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清空确认弹窗 */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal clear-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="modal-icon">⚠️</span>
                确认清空
              </h3>
            </div>
            
            <div className="modal-body">
              <p className="clear-warning">
                确定要清空所有金额记录吗？此操作不可撤销。
              </p>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-cancel" 
                onClick={() => setShowClearConfirm(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleClearData}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="modal-icon">⚠️</span>
                确认删除
              </h3>
            </div>
            
            <div className="modal-body">
              <p className="delete-warning">
                确定要删除数字 {deleteTarget?.number} 的金额 ¥{deleteTarget?.amount.toFixed(2)} 吗？
                <br />
                此操作不可撤销。
              </p>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-cancel" 
                onClick={handleCancelDelete}
              >
                取消
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDelete}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;