import React, { useState } from 'react';
import SurveyForm from './components/SurveyForm';
import Header from './Head';
import './App.css';  // App.css 파일을 import합니다.

const questions = [
  { id: 1, text: '당신의 나이는?', options: [{ text: ' ~ 44세', score: 5 }, 
                                            { text: '45-55', score: 4 }, 
                                            { text: '56-65', score: 3 }, 
                                            { text: '66-77', score: 2 }, 
                                            { text: '76세 ~', score: 1 }] },
  { id: 2, text: '당신의 투자 기간은?', options: [{ text: '20년 이상', score: 5 }, 
                                                { text: '11년 ~ 19년', score: 4 }, 
                                                { text: '6년 ~ 10년', score: 3 }, 
                                                { text: '1년 ~ 5년', score: 2 }, 
                                                { text: '1년 이내', score: 1 }] },
  { id: 3, text: '당신이 우선 고려하는 투자는?', options: [{ text: '무조건 수익률 우선', score: 5 }, 
                                                        { text: '원금보전 고려 + 수익률 우선', score: 4 }, 
                                                        { text: '수익률과 원금보전 동일하게 고려', score: 3 }, 
                                                        { text: '수익률 고려 + 원금보전 우선', score: 2 }, 
                                                        { text: '무조건 원금보전 우선', score: 1 }] },
  { id: 4, text: '정상적인 주식시장상황에서 이번 투자에서 기대하는 수익은?', options: [{ text: '시장 수익률은 상회해야 한다.', score: 5}, 
                                                                                  { text: '시장 수익률 수준은 따라가야 한다.', score: 4}, 
                                                                                  { text: '시장 수익률 하회해도 평균적인 수익은 내야한다.', score: 3}, 
                                                                                  { text: '어느 정도의 안정성과 평균적인 수익은 내야한다.', score: 2}, 
                                                                                  { text: '안정성이 확보되면서 약간의 수익은 내야 한다.', score: 1}] },
  { id: 5, text: '향후 10년 간 주식 시장 침체가 예상될 때 나의 투자 성과는?', options: [{ text: '부진할 수 있다.', score: 5}, 
                                                                                    { text: '원금 수준은 유지해야 한다.', score: 4}, 
                                                                                    { text: '약간의 수익은 나야 한다.', score: 3}, 
                                                                                    { text: '꽤 괜찮은 수익을 기대한다.', score: 2}, 
                                                                                    { text: '어떤 경우라도 수익이 나야한다.', score: 1}] },
  { id: 6, text: '향후 3년 투자시 투자 성과에 대한 당신의 생각은?', options: [{ text: '원금 손실 가능성 인정', score: 5}, 
                                                                          { text: '대부분의 손실은 감내 가능', score: 4}, 
                                                                          { text: '약간의 손실은 감내가능', score: 3}, 
                                                                          { text: '어떤 손실도 감내 어려움', score: 2}, 
                                                                          { text: '약간의 수익이라도 내야함', score: 1}] },
  { id: 7, text: '향후 3개월 투자 시 투자 손실에 대한 당신의 생각은?', options: [{ text: '시장 변화에 크게 신경쓰지 않는다.', score: 5}, 
                                                                              { text: '20% 이상 손실 발생 시 걱정한다.', score: 4}, 
                                                                              { text: '10% 이상 손실 발생 시 걱정한다.', score: 3}, 
                                                                              { text:'작은 시장변화는 감내한다.' , score: 2}, 
                                                                              { text: '어떤 투자 손실도 견디기 힘들다.', score: 1}] },

];

function App() {
  const [answers, setAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState("main"); // 'main', 'survey'

  const [rows, setRows] = useState([]); // 주식 데이터
  const [expected, setExpected] = useState(); // 포트폴리오 예상 수익률
  const [risk, setRisk] = useState(); // 포트폴리오 리스크
  const [error, setError] = useState(null);

  const [ratios, setRatios] = useState([]); // 비율 데이터 별도 상태
  const [expected2, setExpected2] = useState();
  const [risk2, setRisk2] = useState();
  const [tendency, setTendency] = useState(null);

  let stocks = [];

  // 종목 데이터를 가져오기 위한 API 호출 함수
  const query = (index) => {
    const stockCode = rows[index].code; // rows[index]의 code (종목코드)에 해당하는 데이터 가져오기
    
    // Flask 서버에 종목 코드로 종목 정보를 요청하는 API 호출
    fetch(`http://localhost:5000/api/get_stock_info?code=${stockCode}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        alert('해당 종목 코드를 찾을 수 없습니다.');
      } else {
        const newRows = [...rows];
        newRows[index] = {
          ...newRows[index],
          name: data.기업명,  // 종목명
          expected: data.예상수익률, // 예상 수익률
          risk: data.리스크,  // 리스크
        };
        stocks.push(data.기업명)
        setRows(newRows);
      }
    })
    .catch(err => {
      alert('해당 종목 코드를 찾을 수 없습니다.');
    });  
  };

  // 행 추가 함수
  const addRow = () => {
    const newRow = { name: '', code: '', expected: '', risk: '', ratio: '', expected2: '', risk2: '' };
    setRows([...rows, newRow]);
  };

  // 입력 핸들러
  const handleInputChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value === '' ? '' : value;
    setRows(newRows);
  };

  // 포트폴리오 예상 수익률과 리스크 계산 함수
  const calculate = () => {
    // Flask 서버에 종목 코드로 종목 정보를 요청하는 API 호출
    let stocks = [];
    let weights = [];

    rows.forEach(row => {
      stocks.push(row.name);
      weights.push(row.ratio);
    });

    fetch(`http://localhost:5000/api/get_portfolio_performance?stocks=${stocks.join(',')}&weights=${weights.join(',')}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        alert('데이터 오류가 발생했습니다.');
      } else {
        // API 응답에서 기대수익률과 리스크 값을 받아서 상태 업데이트
        setExpected(roundToFourDecimal(data.return));  // 기대수익률 값
        setRisk(roundToFourDecimal(data.risk));        // 리스크 값
        setError(null);  // 오류 상태 초기화
      }
    })
    .catch(err => {
      alert('오류가 발생했습니다.');
    });  
  };

  // 두 번째 테이블의 투자 비율을 표시할 함수
  const calculate2 = () => {
    if (tendency === null) {
      alert("설문조사를 먼저 진행해주세요.");
      setCurrentPage("survey"); // 설문조사 화면으로 전환
      return; // 이후 코드를 실행하지 않음
    }
  
    let stocks = [];
    const rowsArray = Array.from(rows); // `rows`는 HTMLCollection이므로 배열로 변환
  
    rowsArray.forEach(row => {
      stocks.push(row.name);
    });
  
    fetch(`http://localhost:5000/api/get_efficient_portfolio_route?stocks=${stocks.join(',')}&tendency=${tendency}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          alert('데이터 오류가 발생했습니다.');
        } else {
          // API 응답에서 기대수익률과 리스크 값을 받아서 상태 업데이트
          setExpected2(roundToFourDecimal(data.return));  // 기대수익률 값
          setRisk2(roundToFourDecimal(data.risk));              // 리스크 값
  
          // ratios 업데이트
          if (data.weights && Array.isArray(data.weights)) {
            setRatios(data.weights.map(weight => roundToFourDecimal(weight))); // 비율을 소수점 처리
          } else {
            console.error("weights 데이터가 유효하지 않습니다.", data.weights);
            alert("적절한 투자 비율 데이터를 받지 못했습니다.");
          }
          setError(null); // 오류 상태 초기화
        }
      })
      .catch(err => {
        alert('오류가 발생했습니다.');
      });
  };
  

  // 소수점 넷째 자리에서 반올림하는 함수
  const roundToFourDecimal = (value) => {
    return Math.round(value * 1000) / 1000;
  };

  const handleAnswerChange = (questionId, answerText) => {
    const question = questions.find(q => q.id === questionId);
    const selectedOption = question.options.find(option => option.text === answerText);

    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: selectedOption.score
    }));
  };

  const handleSubmit = () => {
    const totalScore = Object.values(answers).reduce((acc, score) => acc + score, 0);
    
    let resultMessage = '';
    if (totalScore >= 25) {
      resultMessage = '공격 추구형';
      setTendency(0);
    } else if (totalScore >= 11 && totalScore <= 24) {
      resultMessage = '위험 중립형';
      setTendency(1);
    } else {
      resultMessage = '안정 추구형';
      setTendency(2);
    }

    alert(`검사 결과 : \n당신의 투자 성향은 '${resultMessage}'입니다! \n${totalScore}점`);
    goToMain();
  };

  const goToMain = () => {
    setAnswers({});
    setCurrentPage("main");
  };

  const startSurvey = () => {
    setCurrentPage("survey");
  };

  return (
    <div className="App">
    <Header></Header>
      {currentPage === "main" && (
        <div>
          <table id="stockTable" border={1}>
            <thead>
              <tr>
                <th colSpan={6}>직접 비율을 설정할 수 있는 포트폴리오</th>
              </tr>
              <tr>
                <th>종목 코드</th>
                <th>종목명</th>
                <th>예상 수익률</th>
                <th>리스크</th>
                <th>투자 비율</th>
                <th>가져오기</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={row.code}
                      placeholder="종목 코드"
                      className="code"
                      spellCheck="false"
                      onChange={(e) => handleInputChange(index, 'code', e.target.value)}
                    />
                  </td>
                  <td>{row.name}</td>
                  <td>{row.expected}</td>
                  <td>{row.risk}</td>
                  <td>
                    <input
                      type="number"
                      value={row.ratio}
                      placeholder="비율"
                      className="ratio"
                      onChange={(e) => handleInputChange(index, 'ratio', e.target.value)}
                    />%
                  </td>
                  <td>
                    <button className="btn" onClick={() => query(index)}>📂</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}>
                  <button className="add" onClick={addRow}><b>주식 추가하기</b></button>
                </td>
                <td colSpan={3}>
                  <button className="cal" onClick={() => calculate()}><b>계산하기</b></button>
                </td>
              </tr>
            </tbody>
          </table>

          <p className="result">
            <b>내가 좋아하는 주식</b> 포트폴리오의 예상 수익률은 <span>[{expected}%]</span>입니다.
          </p>
          <p className="result">
            <b>내가 좋아하는 주식</b> 포트폴리오의 위험도(리스크)는 <span>[{risk}%]</span>입니다.
          </p>

          <table border={1}>
            <thead>
              <tr>
                <th colSpan={6}>투자 성향에 맞는 비율 추천 포트폴리오</th>
              </tr>
              <tr>
                <th>종목 코드</th>
                <th>종목명</th>
                <th>예상 수익률</th>
                <th>리스크</th>
                <th>투자 비율</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input type="text" value={row.code} placeholder="종목 코드" className="code" spellCheck="false"
                      onChange={(e) => handleInputChange(index, 'code', e.target.value)}
                    />
                  </td>
                  <td>{row.name}</td>
                  <td>{row.expected}</td>
                  <td>{row.risk}</td>
                  <td>{ratios[index] || ''}%</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5}>
                  <button className="cal" onClick={calculate2}><b>비율 추천받기</b></button>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="result">
            <b>내가 좋아하는 주식</b> 포트폴리오의 예상 수익률은 <span>[{expected2}%]</span>입니다.
          </p>
          <p className="result">
            <b>내가 좋아하는 주식</b> 포트폴리오의 위험도(리스크)는 <span>[{risk2}%]</span>입니다.
          </p>
          <button onClick={startSurvey}>내 투자성향 알아보기</button>
          <p style={{ fontSize: '12px', color: 'gray', textAlign: 'center', marginTop: '20px' }}>
          ★ 이 자료는 보조 지표일 뿐 실제 투자는 개인의 <b>책임</b> 입니다. ★<br />
          ★ 안정 추구형이라고 해서 리스크가 가장 낮고 수익률이 높은 건 아닙니다. ★<br /><br />
            
            공격 추구형 = 최대 샤프지수 포트폴리오 // 위험 중립형 = 리스크 패리티 포트폴리오 // 안정 추구형 = 최소분산 포트폴리오<br />
            을 참고하여 추천된 투자 비율 입니다.
            </p>
        </div>
      )}
      {currentPage === "survey" && (
        <SurveyForm questions={questions} onAnswerChange={handleAnswerChange} onSubmit={handleSubmit} />
      )}
       
    </div>
  );
}

export default App;
