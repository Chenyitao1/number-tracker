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
      .sort((a, b) => a.number - b.number);
  };

  const amountRecords = getAmountRecords();

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
          {Array.from({ length: 50 }, (_, i) => i + 1).map((number) => {
            const hasAmount = amounts[number] && amounts[number].length > 0;
            const total = hasAmount ? amounts[number].reduce((sum, amount) => sum + amount, 0) : 0;
            const colorType = getNumberColor(number);
            
            return (
              <button
                key={number}
                className={`number-button ${colorType}-button ${hasAmount ? 'has-amount' : ''}`}
                onClick={() => handleButtonClick(number)}
              >
                <span className="button-number">{number}</span>
                {hasAmount && (
                  <span className={`button-total ${colorType}-total`}>¥{total.toFixed(2)}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 金额记录列表 */}
        {amountRecords.length > 0 && (
          <section className="records-section">
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
    </div>
  );
};

export default App;