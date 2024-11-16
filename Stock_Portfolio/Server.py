from flask import Flask, jsonify, request

import pymysql
import pymysql.cursors
from sqlalchemy import create_engine

import pandas as pd
import numpy as np

from scipy.optimize import minimize
import scipy.optimize as sco

from flask_cors import CORS  # CORS 추가

app = Flask(__name__)
CORS(app)  # 모든 라우트에 CORS 허용

# Create SQLAlchemy engine to connect to MySQL Database 

engine = create_engine('mysql+pymysql://root:1234@127.0.0.1:3306/team_project') 

stock_data = pd.read_sql_table('stock_data', con = engine)
stock_price = pd.read_sql_table('stock_price', con = engine)

# 주식종목 불러오기
def get_db_connection():
    # MySQL 연결 설정 (적절히 수정하세요)
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='1234',
        db='team_project',
        charset='utf8'
    )
    return conn

@app.route('/api/get_stock_info', methods=['GET'])
def get_stock_info():
    stock_code = request.args.get('code')  # URL 파라미터로 종목 코드 받기
    if not stock_code:
        return jsonify({'error': '종목 코드가 필요합니다.'}), 400

    # MySQL에서 종목 정보 가져오기
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute('SELECT 기업명, 예상수익률, 리스크 FROM stock_data WHERE 코드 = %s', (stock_code,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if result:
        result['예상수익률'] = round(result['예상수익률'], 3)
        result['리스크'] = round(result['리스크'], 3)
        return jsonify(result)
    else:
        return jsonify({'error': '해당 종목 코드를 찾을 수 없습니다.'}), 404
    
# 총 예상수익률, 리스크 계산 함수
daily_ret = stock_price.set_index(stock_price.columns[0]).loc['2019-01-01':]

def get_avg_covmat(stocks) : # stocks : 종목(리스트), weights : 가중치(리스트)
    
    universe = daily_ret[stocks]
    monthly_returns = universe.resample('ME').last().pct_change(1)

    # inf 값을 NaN으로 변환
    monthly_returns.replace([np.inf, -np.inf], np.nan, inplace=True) # 2019년 이후 상장한 주식의 경우

    adjusted_returns = monthly_returns.apply(lambda x: x[x.first_valid_index():])
    
    covmat= np.array(adjusted_returns.cov()*12)      #  자산별 수익률의 공분산
    avg_returns= np.array(adjusted_returns.mean()*12)      #  종목별 기대수익률 
    
    return avg_returns, covmat

def portfolio_performance(expected_returns, cov_matrix, weights):
    """
    포트폴리오의 예상 수익률과 리스크를 계산하는 함수

    Parameters:
        expected_returns (np.array): 각 종목의 예상 수익률 벡터
        cov_matrix (np.array): 종목 간 공분산 행렬
        weights (np.array): 각 종목의 투자 비중 벡터

    Returns:
        portfolio_return (float): 포트폴리오의 예상 수익률
        portfolio_risk (float): 포트폴리오의 리스크 (표준편차)
    """
    # 포트폴리오 예상 수익률 계산
    portfolio_return = np.sum(expected_returns * weights)

    # 포트폴리오 리스크 (표준편차) 계산
    portfolio_variance = np.dot(weights, np.dot(cov_matrix, weights))
    portfolio_risk = np.sqrt(portfolio_variance)

    return portfolio_return, portfolio_risk

def get_portfolio(stocks, weights) :
    avg_return, covmat = get_avg_covmat(stocks)
    pf_return, pf_risk = portfolio_performance(avg_return, covmat, weights)
    return pf_return, pf_risk

@app.route('/api/get_portfolio_performance', methods=['GET'])
def get_portfolio_performance():
    # 파라미터 값 받기
    stocks = request.args.get('stocks')  # 종목 코드들
    weights = request.args.get('weights')  # 각 종목의 가중치

    if not stocks or not weights:
        return jsonify({'error': 'stocks and weights parameters are required'}), 400

    # stocks와 weights를 리스트로 변환
    if stocks:
        stocks = stocks.split(',')
    else:
        return jsonify({'error': 'stocks parameter is required'}), 400

    if weights:
        try:
            weights = [float(w) for w in weights.split(',')]
        except ValueError:
            return jsonify({'error': 'weights must be a comma-separated list of numbers'}), 400
    else:
        return jsonify({'error': 'weights parameter is required'}), 400

    # 포트폴리오 성능 계산
    pf_return, pf_risk = get_portfolio(stocks, weights)

    # 결과 저장 및 반환
    result = {
        'return': pf_return,
        'risk': pf_risk
    }

    return jsonify(result)

# 비율 추천 함수
# 1) 최대샤프지수
# 목적함수인 (-) 샤프비율을 구하는 함수 

def sharpe_ratio(weight,returns,cov_mat,rf = 0.03):
    ret=np.sum(returns*weight)                            #  포트폴리오 기대수익률 
    std=np.sqrt(np.dot(weight.T,np.dot(cov_mat,weight)))   # 포트폴리오 리스크 (변동성)
    sharpe =-(ret-rf)/std                                 # 최소화--> 최대화 되므로 마이너스 붙인다.
    return sharpe
    
# (-)샤프비율을 최소화하기 위한 최적화 함수  = (+) 샤프비율을 최대화

def mean_variance_optimization(stocks, returns,cov_mat,rf = 0.03):  # ( 포트폴리오 기대수익률, 공분산, 무위험이자율)
    num_assets=len(returns)
    args=(returns,cov_mat,rf)
    constraints=({'type': 'eq','fun': lambda x: np.sum(x)-1})
    bounds=[(0,1) for i in range(num_assets)]
    
    result= sco.minimize(sharpe_ratio,num_assets*[1./num_assets,],args=args, method='SLSQP',
                         bounds=bounds,constraints=constraints)
    Sharp_Allocation =pd.DataFrame(result.x,index=stocks,columns=['allocation'])  # 종목명 인덱스만 가져다 쓴다.

    return round(Sharp_Allocation*100,2)  

# 2) MVP
# 자산별 리스크 기여도를 구하기 위한 함수

def Risk_Contribution(weight,cov_mat) :
    # weight =np.array(weight)
    std=np.sqrt(np.dot(weight.T,np.dot(cov_mat,weight)))  # 포트폴리오 리스크 (변동성)
    mrc=np.dot(cov_mat,weight)/std                        # 한계기여도 = (공분산*자산별 비중)/포트폴리오 리스크
    rc=weight*mrc
    return rc, std


def risk_parity_target(weight, cov_mat) :
    
    rc,std=Risk_Contribution(weight,cov_mat)
    RC_assets=rc
    RC_target=std/len(rc)
    objective_fun=np.sum(np.square(RC_assets-RC_target.T))
    
    return objective_fun


# 포트폴리오의 자산별 리스크 기여도를 동일하게 하는 자산별 비중

def risk_parity_optimization(stocks, cov_mat):
    
    TOLERANCE= 1e-20
    num_assets=len(cov_mat)
    constraints=({'type': 'eq','fun': lambda x: np.sum(x)-1.0},{'type': 'ineq','fun': lambda x: x})  
    result=sco.minimize(risk_parity_target,
                        num_assets*[1./num_assets,],
                        method='SLSQP',
                        args = (cov_mat,),
                        constraints=constraints,
                        tol=TOLERANCE)    
    RP_Allocation=pd.DataFrame(result.x,index=stocks,columns=['allocation'])
 
    return  round(RP_Allocation*100,2)              

# 3) Risk Parity
# 포트폴리오 변동성 최소화를 위한 최적화 

def get_portf_vol(w, cov_mat):  
    return np.sqrt(np.dot(w.T, np.dot(cov_mat, w)))

def minimum_variance_optimization(stocks, returns,cov_mat):
    
    num_assets=len(returns) # 자산갯수 
    args=(cov_mat)          # 공분산 입력
    constraints=({'type': 'eq','fun': lambda x: np.sum(x)-1})
    bounds=[(0,1) for i in range(num_assets)]  # 자산별 비중 제약 (0, 1)
    
    result_mv= sco.minimize(get_portf_vol,num_assets*[1./num_assets],args=args, method='SLSQP',
                         bounds=bounds,constraints=constraints)
    MVO_Allocation =pd.DataFrame(result_mv.x,index=stocks,columns=['allocation'])  # 종목명 인덱스만 가져다 쓴다.
    
    return round(MVO_Allocation*100,2)

def get_efficient_portfolio(stocks, tendency) :
    '''
    stocks : 종목들 (list)
    tendency : 성향
        0 -> 매우공격형 => Max Sharpe Ratio Portfolio
        1 -> 중립형 => MVP
        2 -> 안전형 => Risk Parity
    '''
    avg_return, covmat = get_avg_covmat(stocks)
    if tendency == 0 :
        array_result = np.array(mean_variance_optimization(stocks, avg_return, covmat))
        flattened = [item[0] for item in array_result]
        return flattened
    elif tendency == 1 :
        array_result = np.array(minimum_variance_optimization(stocks, avg_return, covmat))
        flattened = [item[0] for item in array_result]
        return flattened
    else :
        array_result = np.array(risk_parity_optimization(stocks, covmat))
        flattened = [item[0] for item in array_result]
        return flattened
    
@app.route('/api/get_efficient_portfolio_route', methods=['GET'])
def get_efficient_portfolio_route():
    # 파라미터 값 받기
    stocks = request.args.get('stocks')
    tendency = request.args.get('tendency')

    # stocks 유효성 검사 및 리스트 변환
    if stocks:
        stocks = stocks.split(',')
    else:
        return jsonify({'error': 'stocks parameter is required'}), 400

    # tendency 유효성 검사 및 변환
    try:
        tendency = int(tendency)
        if tendency not in [0, 1, 2]:
            return jsonify({'error': 'tendency must be one of 0, 1, 2'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'tendency must be an integer (0, 1, 2)'}), 400

    # get_efficient_portfolio 호출
    try:
        weights = get_efficient_portfolio(stocks, tendency)
        print(weights)
        pf_return, pf_risk = get_portfolio(stocks, weights)
        print(pf_return, pf_risk)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    result = {
        'return': pf_return,
        'risk': pf_risk,
        'weights' : weights
    }

    print(result)
    # 결과 반환
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)


